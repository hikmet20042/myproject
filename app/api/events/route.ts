import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose'
import Event from '@/lib/models/Event'
import User from '@/lib/models/User'

// GET /api/events - Get events with filtering
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const month = searchParams.get('month')
    const search = searchParams.get('search')
    const status = searchParams.get('status') // 'approved', 'pending', 'all'
    const createdBy = searchParams.get('createdBy') // For NGO's own events
    const adminView = searchParams.get('adminView') === 'true'
    
    const skip = (page - 1) * limit
    
    // Build filter query
    const filter: any = {}
    
    // Admin view shows all events, regular view shows only approved
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
    
    // If viewing own events, filter by creator
    if (createdBy) {
      filter.createdBy = createdBy
      if (status === 'approved') {
        filter.isApproved = true
      } else if (status === 'pending') {
        filter.isApproved = false
      }
    }
    
    if (category && category !== 'all') {
      filter.category = category
    }
    
    if (location && location !== 'all') {
      if (location === 'online') {
        filter['location.type'] = { $in: ['online', 'hybrid'] }
      } else if (location === 'physical') {
        filter['location.type'] = { $in: ['physical', 'hybrid'] }
      } else {
        filter['location.city'] = new RegExp(location, 'i')
      }
    }
    
    if (month && month !== 'all') {
      const year = new Date().getFullYear()
      const monthNum = parseInt(month)
      const startDate = new Date(year, monthNum - 1, 1)
      const endDate = new Date(year, monthNum, 0, 23, 59, 59)
      filter.eventDate = { $gte: startDate, $lte: endDate }
    }
    
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }
    
    const events = await Event.find(filter)
      .populate('createdBy', 'name organizationName')
      .populate('approvedBy', 'name')
      .sort({ eventDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    const total = await Event.countDocuments(filter)
    
    // Calculate stats for admin view
    let stats = null
    if (adminView) {
      const [pending, approved, rejected, totalCount] = await Promise.all([
        Event.countDocuments({ isApproved: false, rejectedAt: { $exists: false } }),
        Event.countDocuments({ isApproved: true, rejectedAt: { $exists: false } }),
        Event.countDocuments({ rejectedAt: { $exists: true } }),
        Event.countDocuments({})
      ])
      
      stats = { pending, approved, rejected, total: totalCount }
    }
    
    const response: any = {
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
    
    if (stats) {
      response.stats = stats
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

// POST /api/events - Create new event (NGO only)
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
    const user = await User.findById(session.user.id)
    if (!user || user.role !== 'ngo' || user.ngoStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Only approved NGOs can create events' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'eventDate', 'location']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }
    
    // Validate location structure
    if (!body.location.type || !['online', 'physical', 'hybrid'].includes(body.location.type)) {
      return NextResponse.json(
        { error: 'Valid location type is required' },
        { status: 400 }
      )
    }
    
    // Create event
    const event = new Event({
      ...body,
      createdBy: session.user.id,
      isApproved: false, // Requires admin approval
      isPublished: false,
      currentParticipants: 0
    })
    
    await event.save()
    
    return NextResponse.json(
      { message: 'Event created successfully. Awaiting admin approval.', event },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}