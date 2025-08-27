import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Event from '@/lib/models/Event'

export const dynamic = 'force-dynamic'

async function isAdmin(session: any) {
  return session?.user?.email === 'hikmat.mammadlii@gmail.com' || session?.user?.role === 'admin'
}

// GET /api/admin/events - Get all events for admin management
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const session = await getServerSession(authOptions)
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const eventType = searchParams.get('eventType')
    const location = searchParams.get('location')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const skip = (page - 1) * limit
    
    // Build query object
    const query: any = {}
    
    // Status filtering
    if (status === 'pending') {
      query.isApproved = false
      query.rejectedAt = { $exists: false }
    } else if (status === 'approved') {
      query.isApproved = true
      query.rejectedAt = { $exists: false }
    } else if (status === 'rejected') {
      query.rejectedAt = { $exists: true }
    }
    
    // Search filtering
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }
    
    // Category filtering
    if (category && category !== 'all') {
      query.category = category
    }
    
    // Event type filtering
    if (eventType && eventType !== 'all') {
      if (eventType.includes(',')) {
        query.eventType = { $in: eventType.split(',') }
      } else {
        query.eventType = eventType
      }
    }
    
    // Location filtering
    if (location && location !== 'all') {
      if (location === 'online') {
        query['location.type'] = { $in: ['online', 'hybrid'] }
      } else if (location === 'physical') {
        query['location.type'] = { $in: ['physical', 'hybrid'] }
      } else {
        query['location.city'] = { $regex: location, $options: 'i' }
      }
    }
    
    // Date range filtering
    if (dateFrom || dateTo) {
      query.eventDate = {}
      if (dateFrom) query.eventDate.$gte = new Date(dateFrom)
      if (dateTo) query.eventDate.$lte = new Date(dateTo)
    }
    
    // Build sort object
    const sortObj: any = {}
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1
    
    const events = await Event.find(query)
      .populate('createdBy', 'name ngoProfile email')
      .populate('approvedBy', 'name')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean()
    
    const total = await Event.countDocuments(query)
    
    // Get statistics
    const [pending, approved, rejected, totalCount] = await Promise.all([
      Event.countDocuments({ isApproved: false, rejectedAt: { $exists: false } }),
      Event.countDocuments({ isApproved: true, rejectedAt: { $exists: false } }),
      Event.countDocuments({ rejectedAt: { $exists: true } }),
      Event.countDocuments({})
    ])
    
    const stats = { pending, approved, rejected, total: totalCount }
    
    return NextResponse.json({
      events,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('GET /api/admin/events error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/events - Bulk approve/reject events
export async function PUT(request: NextRequest) {
  try {
    await dbConnect()
    
    const session = await getServerSession(authOptions)
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { id, status, adminComment } = body
    
    if (!id || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Event ID and valid status are required' },
        { status: 400 }
      )
    }
    
    const event = await Event.findById(id)
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }
    
    let updateData: any = {}
    
    if (status === 'approved') {
      updateData = {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: session.user.id,
        isPublished: true,
        rejectedAt: undefined,
        rejectionReason: undefined
      }
    } else if (status === 'rejected') {
      updateData = {
        isApproved: false,
        rejectedAt: new Date(),
        rejectionReason: adminComment || 'No reason provided',
        approvedAt: undefined,
        approvedBy: undefined,
        isPublished: false
      }
    }
    
    await Event.findByIdAndUpdate(id, updateData)
    
    return NextResponse.json({ message: `Event ${status} successfully` })
  } catch (error) {
    console.error('PUT /api/admin/events error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}