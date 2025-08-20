import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose'
import Training from '@/lib/models/Training'
import User from '@/lib/models/User'

// GET /api/trainings - Get trainings with filtering
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const trainingType = searchParams.get('trainingType')
    const location = searchParams.get('location')
    const search = searchParams.get('search')
    const status = searchParams.get('status') || 'approved'
    const createdBy = searchParams.get('createdBy') // For NGO's own trainings
    const adminView = searchParams.get('adminView') === 'true'
    const sortBy = searchParams.get('sortBy') || 'startDate'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    
    const skip = (page - 1) * limit
    
    // Build filter object
    const filter: any = {}
    
    // Admin view shows all trainings, regular view shows only approved
    if (!adminView) {
      if (status !== 'all' && !createdBy) {
        filter.isApproved = true
        filter.isPublished = true
      }
    } else {
      // Admin view with status filtering
      if (status === 'approved') {
        filter.isApproved = true
        filter.rejectedAt = { $exists: false }
      } else if (status === 'pending') {
        filter.isApproved = false
        filter.rejectedAt = { $exists: false }
      } else if (status === 'rejected') {
        filter.rejectedAt = { $exists: true }
      }
    }
    
    // Filter by creator if specified (for NGO dashboard)
    if (createdBy) {
      filter.createdBy = createdBy
    }
    
    // Category filter
    if (category && category !== 'all') {
      filter.category = category
    }
    
    // Training type filter
    if (trainingType && trainingType !== 'all') {
      filter.trainingType = trainingType
    }
    
    // Location filter
    if (location && location !== 'all') {
      if (location === 'online') {
        filter.trainingType = { $in: ['online', 'hybrid'] }
      } else if (location === 'physical') {
        filter.trainingType = { $in: ['physical', 'hybrid'] }
      } else {
        filter['location.city'] = new RegExp(location, 'i')
      }
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }
    
    // Build sort object
    const sort: any = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1
    
    // Fetch trainings with pagination
    const trainings = await Training.find(filter)
      .populate('createdBy', 'name organizationName email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
    
    const total = await Training.countDocuments(filter)
    
    // Calculate stats for admin view
    let stats = null
    if (adminView) {
      const [pending, approved, rejected, totalCount] = await Promise.all([
        Training.countDocuments({ isApproved: false, rejectedAt: { $exists: false } }),
        Training.countDocuments({ isApproved: true, rejectedAt: { $exists: false } }),
        Training.countDocuments({ rejectedAt: { $exists: true } }),
        Training.countDocuments({})
      ])
      
      stats = { pending, approved, rejected, total: totalCount }
    }
    
    const response: any = {
      trainings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTrainings: total,
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
    console.error('Error fetching trainings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trainings' },
      { status: 500 }
    )
  }
}

// POST /api/trainings - Create new training
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
        { error: 'Only NGOs can create trainings' },
        { status: 403 }
      )
    }
    
    // Check if NGO is approved
    if (user.role === 'ngo' && !user.isApproved) {
      return NextResponse.json(
        { error: 'NGO must be approved to create trainings' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = [
      'title', 'description', 'category', 'trainingType',
      'startDate', 'endDate', 'duration', 'schedule',
      'applicationLink', 'applicationDeadline', 'learningOutcomes'
    ]
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }
    
    // Validate dates
    const startDate = new Date(body.startDate)
    const endDate = new Date(body.endDate)
    const applicationDeadline = new Date(body.applicationDeadline)
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }
    
    if (applicationDeadline >= startDate) {
      return NextResponse.json(
        { error: 'Application deadline must be before start date' },
        { status: 400 }
      )
    }
    
    // Create training
    const training = new Training({
      ...body,
      createdBy: session.user.id,
      isApproved: user.role === 'admin', // Auto-approve if created by admin
      isPublished: user.role === 'admin'
    })
    
    await training.save()
    
    const populatedTraining = await Training.findById(training._id)
      .populate('createdBy', 'name organizationName')
      .lean()
    
    return NextResponse.json({
      message: 'Training created successfully',
      training: populatedTraining
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating training:', error)
    return NextResponse.json(
      { error: 'Failed to create training' },
      { status: 500 }
    )
  }
}