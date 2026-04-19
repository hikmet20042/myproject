import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { mapEventToResponse } from '@/lib/events/mapEventToResponse'

const hydrateEventRowsWithOrganizationHandles = async (supabase: any, rows: any[]) => {
  const organizationIds = Array.from(
    new Set(
      rows
        .map((row: any) => row?.created_by_organization?.id || row?.created_by_organization)
        .filter(Boolean)
        .map((id: any) => String(id))
    )
  )

  if (organizationIds.length === 0) {
    return rows
  }

  const { data: profiles } = await supabase
    .from('organization_profiles')
    .select('account_id, organization_name, email, slug, url_handle')
    .in('account_id', organizationIds)

  const profileByAccountId = new Map(
    (profiles || []).map((profile: any) => [String(profile.account_id), profile])
  )

  return rows.map((row: any) => {
    const organizationId = row?.created_by_organization?.id || row?.created_by_organization
    if (!organizationId) {
      return row
    }

    const key = String(organizationId)
    const profile = profileByAccountId.get(key)
    if (!profile) {
      return row
    }

    return {
      ...row,
      created_by_organization: {
        id: key,
        organization_name:
          profile.organization_name ||
          row?.organization_name ||
          row?.created_by_organization?.organization_name ||
          null,
        email: profile.email || row?.created_by_organization?.email || null,
        slug: profile.slug || null,
        url_handle: profile.url_handle || null,
      },
    }
  })
}

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

    const hydratedRows = await hydrateEventRowsWithOrganizationHandles(supabase, eventRows || [])
    const events = hydratedRows.map(mapEventToResponse)
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
