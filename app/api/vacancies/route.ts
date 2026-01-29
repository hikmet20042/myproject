import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose'
import Vacancy from '@/lib/models/Vacancy'
import User from '@/lib/models/User'

// GET /api/vacancies - Get vacancies with filtering
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type')
    const location = searchParams.get('location')
    const search = searchParams.get('search')
    const createdBy = searchParams.get('createdBy') // For NGO's own vacancies
    const author = searchParams.get('author') // Handle 'author=me' parameter
    const adminView = searchParams.get('adminView') === 'true'
    const status = searchParams.get('status') || (adminView ? 'all' : 'approved')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const skip = (page - 1) * limit
    
    // Handle author=me parameter
    let actualCreatedBy = createdBy
    if (author === 'me') {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      actualCreatedBy = session.user.id
    }
    
    // Build filter object
    const filter: any = {}
    
    // Admin view shows all vacancies, regular view shows only approved
    if (!adminView) {
      // Regular view: only show approved vacancies unless filtering by creator
      if (!createdBy) {
        filter.status = 'approved'
      }
    } else {
      // Admin view with status filtering
      if (status && status !== 'all') {
        if (status === 'pending') {
          filter.status = 'pending'
        } else if (status === 'approved') {
          filter.status = 'approved'
        } else if (status === 'rejected') {
          filter.status = 'rejected'
        }
      }
      // If status is 'all' or not specified in admin view, show all vacancies (no additional filter)
    }
    
    // Filter by creator if specified (for NGO dashboard)
    if (actualCreatedBy) {
      filter.createdBy = actualCreatedBy
    }
    
    // Type filter
    if (type && type !== 'all') {
      filter.type = type
    }
    
    // Location filter
    if (location && location !== 'all') {
      filter.location = new RegExp(location, 'i')
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { requirements: { $regex: search, $options: 'i' } }
      ]
    }
    
    // Build sort object
    const sort: any = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1
    
    // Fetch vacancies with pagination
    const vacancies = await Vacancy.find(filter)
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
    
    const total = await Vacancy.countDocuments(filter)
    
    // Calculate stats for admin view
    let stats = null
    if (adminView) {
      const [pending, approved, rejected, totalCount] = await Promise.all([
        Vacancy.countDocuments({ status: 'pending' }),
        Vacancy.countDocuments({ status: 'approved' }),
        Vacancy.countDocuments({ status: 'rejected' }),
        Vacancy.countDocuments({})
      ])
      
      stats = { pending, approved, rejected, total: totalCount }
    }
    
    const response: any = {
      vacancies,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalVacancies: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
        pages: Math.ceil(total / limit)
      }
    }
    
    if (stats) {
      response.stats = stats
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error fetching vacancies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vacancies' },
      { status: 500 }
    )
  }
}

// POST /api/vacancies - Create new vacancy
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    await dbConnect()
    
    // Check if user is an approved NGO
    if (!session.user.isApprovedNGO && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only approved NGOs can create vacancies' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = [
      'title', 'description', 'type', 'category', 'workType', 'experienceLevel', 'applicationDeadline', 'applicationInstructions'
    ]
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    const descText = typeof body.description === 'string'
      ? body.description.replace(/<[^>]*>/g, '').trim()
      : ''
    if (!descText || descText.length < 50) {
      return NextResponse.json(
        { error: 'Description must be at least 50 characters long' },
        { status: 400 }
      )
    }

    if (typeof body.applicationInstructions === 'string') {
      const instr = body.applicationInstructions.trim()
      if (instr.length < 30) {
        return NextResponse.json(
          { error: 'Application instructions must be at least 30 characters long' },
          { status: 400 }
        )
      }
    }

    // Validate application method
    if (body.applicationMethod === 'link' && !body.applicationLink) {
      return NextResponse.json(
        { error: 'Application link is required when using link method' },
        { status: 400 }
      )
    }

    if (body.applicationMethod === 'email' && !body.applicationEmail) {
      return NextResponse.json(
        { error: 'Application email is required when using email method' },
        { status: 400 }
      )
    }
    
    // Validate deadline if provided
    if (body.deadline) {
      const deadline = new Date(body.deadline)
      if (deadline <= new Date()) {
        return NextResponse.json(
          { error: 'Deadline must be in the future' },
          { status: 400 }
        )
      }
    }
    
    // Prepare application process data
    const applicationProcess: any = {
      instructions: body.applicationInstructions || ''
    }
    
    if (body.applicationMethod === 'link' && body.applicationLink) {
      applicationProcess.applicationLink = body.applicationLink
    }
    
    if (body.applicationMethod === 'email' && body.applicationEmail) {
      applicationProcess.email = body.applicationEmail
    }

    // Map compensation type from form values to database enum values
    const mapCompensationType = (formType: string): string => {
      switch (formType) {
        case 'salary':
        case 'hourly':
        case 'negotiable':
          return 'paid'
        case 'volunteer':
          return 'unpaid'
        case 'stipend':
          return 'stipend'
        default:
          return 'unpaid' // fallback
      }
    }

    // Prepare compensation data
    const compensation: any = {
      type: mapCompensationType(body.compensationType || 'volunteer')
    }
    
    if (body.compensationAmount && body.compensationType !== 'volunteer') {
      compensation.amount = parseFloat(body.compensationAmount.replace(/[^0-9.]/g, ''))
      compensation.currency = body.compensationCurrency || 'USD'
    }
    
    // Set compensation period based on type
    if (body.compensationType === 'salary') {
      compensation.period = 'yearly'
    } else if (body.compensationType === 'hourly') {
      compensation.period = 'hourly'
    }

    // Map duration type from form values to database enum values
    const mapDurationType = (formType: string): string => {
      switch (formType) {
        case 'permanent':
          return 'permanent'
        case 'fixed':
        case 'project':
          return 'contract'
        case 'temporary':
          return 'temporary'
        default:
          return 'temporary' // fallback
      }
    }

    // Prepare duration data
    const duration: any = {
      type: mapDurationType(body.durationType || 'permanent')
    }
    
    if (body.contractLength && body.contractUnit && body.durationType !== 'permanent') {
      duration.contractLength = {
        value: parseInt(body.contractLength),
        unit: body.contractUnit
      }
    }

    // Prepare location data
    const location: any = {
      isRemote: body.workType === 'remote'
    }
    
    if (body.city) {
      location.city = body.city
    }
    
    if (body.country) {
      location.country = body.country
    }
    
    if (body.address) {
      location.address = body.address
    }

    // Create vacancy with proper structure
    const vacancyData = {
      title: body.title,
      description: body.description,
      type: body.type,
      category: body.category,
      workType: body.workType,
      experienceLevel: body.experienceLevel,
      location,
      compensation,
      duration,
      applicationProcess,
      applicationDeadline: body.applicationDeadline,
      responsibilities: body.responsibilities || [],
      requirements: body.requirements || [],
      qualifications: body.qualifications || [],
      benefits: body.benefits || [],
      tags: body.tags || [],
      createdBy: session.user.id,
      status: session.user.role === 'admin' ? 'approved' : 'pending',
      isPublished: session.user.role === 'admin'
    }

    const vacancy = new Vacancy(vacancyData)
    
    await vacancy.save()
    
    const populatedVacancy = await Vacancy.findById(vacancy._id)
      .populate('createdBy', 'name email')
      .lean()
    
    return NextResponse.json({
      message: 'Vacancy created successfully',
      vacancy: populatedVacancy
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating vacancy:', error)
    return NextResponse.json(
      { error: 'Failed to create vacancy' },
      { status: 500 }
    )
  }
}
