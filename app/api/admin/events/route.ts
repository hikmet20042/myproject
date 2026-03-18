import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isAdminSession } from '@/lib/roles'

const mapEvent = (row: any) => ({
  _id: row.id,
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  eventType: row.event_type,
  eventDate: row.event_date,
  endDate: row.end_date,
  duration: row.duration,
  schedule: row.schedule,
  prerequisites: row.prerequisites || [],
  learningOutcomes: row.learning_outcomes || [],
  certification: row.certification,
  cost: row.cost,
  targetAudience: row.target_audience || [],
  syllabus: row.syllabus,
  location: row.location,
  applicationLink: row.application_link,
  applicationDeadline: row.application_deadline,
  maxParticipants: row.max_participants,
  currentParticipants: row.current_participants,
  tags: row.tags || [],
  imageUrl: row.image_url,
  images: row.images,
  createdBy: row.created_by
    ? { _id: row.created_by.id, name: row.created_by.name, email: row.created_by.email }
    : row.created_by,
  createdByOrganization: row.created_by_organization
    ? { _id: row.created_by_organization.id, organizationName: row.created_by_organization.organization_name, email: row.created_by_organization.email }
    : row.created_by_organization,
  organizationName: row.organization_name,
  status: row.status,
  approvedAt: row.approved_at,
  approvedBy: row.approved_by
    ? { _id: row.approved_by.id, name: row.approved_by.name }
    : row.approved_by,
  rejectedAt: row.rejected_at,
  rejectionReason: row.rejection_reason,
  adminComment: row.admin_comment,
  isPublished: row.is_published,
  isFeatured: row.is_featured,
  views: row.views,
  uniqueViews: row.unique_views,
  viewedBy: row.viewed_by || [],
  engagementScore: row.engagement_score,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const dynamic = 'force-dynamic'

async function isAdmin(session: any) {
  return isAdminSession(session)
}

// GET /api/admin/events - Get all events for admin management
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient()
    
    const session = await getServerSession()
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
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
      query.status = 'pending'
    } else if (status === 'approved') {
      query.status = 'approved'
    } else if (status === 'rejected') {
      query.status = 'rejected'
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
    
    const sortFieldMap: Record<string, string> = {
      createdAt: 'created_at',
      eventDate: 'event_date',
      updatedAt: 'updated_at'
    }
    const orderField = sortFieldMap[sortBy] || 'created_at'
    const ascending = sortOrder === 'asc'

    let queryBuilder = supabase
      .from('events')
      .select('*, created_by (id, name, email), created_by_organization (id, organization_name, email), approved_by (id, name)', { count: 'exact' })
      .order(orderField, { ascending })
      .range(skip, skip + limit - 1)

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status)
    }

    if (category && category !== 'all') {
      queryBuilder = queryBuilder.eq('category', category)
    }

    if (eventType && eventType !== 'all') {
      if (eventType.includes(',')) {
        queryBuilder = queryBuilder.in('event_type', eventType.split(','))
      } else {
        queryBuilder = queryBuilder.eq('event_type', eventType)
      }
    }

    if (location && location !== 'all') {
      if (location === 'online') {
        queryBuilder = queryBuilder.or('location->>type.eq.online,location->>type.eq.hybrid')
      } else if (location === 'physical') {
        queryBuilder = queryBuilder.or('location->>type.eq.physical,location->>type.eq.hybrid')
      } else {
        queryBuilder = queryBuilder.or(`location->>city.ilike.%${location}%`)
      }
    }

    if (dateFrom || dateTo) {
      if (dateFrom) queryBuilder = queryBuilder.gte('event_date', new Date(dateFrom).toISOString())
      if (dateTo) queryBuilder = queryBuilder.lte('event_date', new Date(dateTo).toISOString())
    }

    if (search) {
      queryBuilder = queryBuilder.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: eventRows, error, count } = await queryBuilder

    if (error) {
      console.error('GET /api/admin/events error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    const events = (eventRows || []).map(mapEvent)
    const total = count || 0
    
    // Get statistics
    const [pendingResult, approvedResult, rejectedResult, totalResult] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('events').select('id', { count: 'exact', head: true })
    ])
    
    const stats = {
      pending: pendingResult.count || 0,
      approved: approvedResult.count || 0,
      rejected: rejectedResult.count || 0,
      total: totalResult.count || 0
    }
    
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
    const supabase = createSupabaseAdminClient()
    
    const session = await getServerSession()
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
    
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', id)
      .single()
    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }
    
    let updateData: any = {}
    
    if (status === 'approved') {
      updateData = {
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: session.user.id,
        is_published: true,
        rejected_at: null,
        rejection_reason: null
      }
    } else if (status === 'rejected') {
      updateData = {
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: adminComment || 'No reason provided',
        approved_at: null,
        approved_by: null,
        is_published: false
      }
    }
    
    await supabase
      .from('events')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    return NextResponse.json({ message: `Event ${status} successfully` })
  } catch (error) {
    console.error('PUT /api/admin/events error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}