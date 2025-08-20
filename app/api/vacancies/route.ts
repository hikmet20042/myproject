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
    const status = searchParams.get('status') || 'approved'
    const createdBy = searchParams.get('createdBy') // For NGO's own vacancies
    const adminView = searchParams.get('adminView') === 'true'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const skip = (page - 1) * limit
    
    // Build filter object
    const filter: any = {}
    
    // Admin view shows all vacancies, regular view shows only approved
    if (!adminView) {
      if (status !== 'all' && !createdBy) {
        filter.status = 'approved'
      }
    } else {
      // Admin view with status filtering
      if (status !== 'all') {
        filter.status = status
      }
    }
    
    // Filter by creator if specified (for NGO dashboard)
    if (createdBy) {
      filter.createdBy = createdBy
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
      .populate('organization', 'name email')
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
    
    const user = await User.findById(session.user.id)
    
    // Check if user is NGO or admin
    if (user?.role !== 'ngo' && user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only NGOs can create vacancies' },
        { status: 403 }
      )
    }
    
    // Check if NGO is approved
    if (user.role === 'ngo' && !user.isApproved) {
      return NextResponse.json(
        { error: 'NGO must be approved to create vacancies' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = [
      'title', 'description', 'type', 'location'
    ]
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
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
    
    // Create vacancy
    const vacancy = new Vacancy({
      ...body,
      organization: session.user.id,
      status: user.role === 'admin' ? 'approved' : 'pending' // Auto-approve if created by admin
    })
    
    await vacancy.save()
    
    const populatedVacancy = await Vacancy.findById(vacancy._id)
      .populate('organization', 'name email')
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