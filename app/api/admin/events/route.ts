import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'

type EventPersonRef = {
  id?: string
  name?: string
  email?: string
} | null

type EventOrganizationRef = {
  id?: string
  organization_name?: string
  email?: string
} | null

type EventDbRow = {
  id: string
  title?: string | null
  description?: string | null
  category?: string | null
  event_type?: string | null
  event_date?: string | null
  end_date?: string | null
  sessions?: unknown
  certification?: string | null
  audience_age_min?: number | null
  audience_age_max?: number | null
  requirements?: string[] | null
  participant_benefits?: string[] | null
  location?: unknown
  application_link?: string | null
  application_deadline?: string | null
  max_participants?: number | null
  tags?: string[] | null
  image_url?: string | null
  images?: unknown
  created_by?: EventPersonRef
  created_by_organization?: EventOrganizationRef
  organization_name?: string | null
  status?: string | null
  approved_at?: string | null
  approved_by?: EventPersonRef
  rejected_at?: string | null
  rejection_reason?: string | null
  admin_comment?: string | null
  is_published?: boolean | null
  is_featured?: boolean | null
  views?: number | null
  unique_views?: number | null
  viewed_by?: string[] | null
  engagement_score?: number | null
  created_at?: string | null
  updated_at?: string | null
}

const mapEvent = (row: EventDbRow) => ({
  _id: row.id,
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  eventType: row.event_type,
  eventDate: row.event_date,
  endDate: row.end_date,
  sessions: row.sessions,
  certification: row.certification,
  audienceAgeMin: row.audience_age_min,
  audienceAgeMax: row.audience_age_max,
  requirements: row.requirements || [],
  participantBenefits: row.participant_benefits || [],
  location: row.location,
  applicationLink: row.application_link,
  applicationDeadline: row.application_deadline,
  maxParticipants: row.max_participants,
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


// GET /api/admin/events - Get all events for admin management
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient()
    
    const session = await getServerSession()
    if (!isAdmin(session)) {
      return errorResponse('Admin access required', 'ADMIN_ACCESS_REQUIRED', {}, 403)
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
    const query: {
      status?: string
      eventDate?: { $gte?: Date; $lte?: Date }
      [key: string]: unknown
    } = {}
    
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
      return errorResponse('Failed to fetch events', 'FETCH_EVENTS_FAILED', {}, 500)
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
    
    return successResponse({
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
    return errorResponse('Failed to fetch events', 'FETCH_EVENTS_FAILED', {}, 500)
  }
}
