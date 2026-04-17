import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { checkRateLimit } from '@/lib/rateLimit'
import { isUuid, resolveEntityBySlugOrId } from '@/lib/identifier'

const ALLOWED_TYPES = ['event', 'vacancy', 'blog'] as const
type SavedType = (typeof ALLOWED_TYPES)[number]

const isValidType = (value: string): value is SavedType =>
  ALLOWED_TYPES.includes(value as SavedType)

async function resolveContentBySlugOrId(
  supabase: any,
  itemType: SavedType,
  itemId: string,
  options?: { requireApproved?: boolean }
) {
  const contentTableMap: Record<SavedType, string> = {
    event: 'events',
    vacancy: 'vacancies',
    blog: 'blogs',
  }

  const tableName = contentTableMap[itemType]
  const { data, error } = await resolveEntityBySlugOrId(
    supabase,
    tableName,
    itemId,
    'id, status'
  )

  if (error || !data) return { data: null, error }
  if (options?.requireApproved && data.status !== 'approved') {
    return { data: null, error: null }
  }

  return { data, error: null }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) return errorResponse('Unauthorized', 'API_ERROR', {}, 401)
    if (session.user.accountType === 'organization') {
      return errorResponse('Organization accounts cannot save content', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403)
    }

    // Rate limiting: max 10 save/unsave actions per minute per user
    const rateLimit = checkRateLimit({
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
      key: `save-content:${session.user.id}`,
    })
    if (!rateLimit.allowed) {
      return errorResponse('Too many requests. Please try again later.', 'RATE_LIMITED', {
        retryAfter: rateLimit.resetAt,
      }, 429)
    }

    const body = await request.json()
    const itemId = String(body?.itemId || '').trim()
    const itemType = String(body?.itemType || '').trim()

    if (!itemId || !isValidType(itemType)) {
      return errorResponse('Invalid save payload', 'API_ERROR', {}, 400)
    }

    const supabase = createSupabaseAdminClient()

    const { data: content, error: contentError } = await resolveContentBySlugOrId(
      supabase,
      itemType,
      itemId,
      { requireApproved: true }
    )

    if (contentError || !content) {
      return errorResponse(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found`, 'CONTENT_NOT_FOUND', {}, 404)
    }

    const { data: existing } = await supabase
      .from('content_saves')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('content_id', content.id)
      .eq('content_type', itemType)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await supabase.from('content_saves').delete().eq('id', existing.id)
      if (error) return errorResponse(error.message, 'API_ERROR', {}, 500)
      return successResponse({ action: 'unsaved', hasSaved: false })
    }

    const { error } = await supabase.from('content_saves').insert({
      user_id: session.user.id,
      content_id: content.id,
      content_type: itemType,
    })
    if (error) return errorResponse(error.message, 'API_ERROR', {}, 500)

    return successResponse({ action: 'saved', hasSaved: true })
  } catch (error) {
    console.error('Save POST error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) return errorResponse('Unauthorized', 'API_ERROR', {}, 401)
    if (session.user.accountType === 'organization') {
      return errorResponse('Organization accounts cannot save content', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403)
    }

    const body = await request.json().catch(() => ({}))
    const itemId = String(body?.itemId || '').trim()
    const itemType = String(body?.itemType || '').trim()

    if (!itemId || !isValidType(itemType)) {
      return errorResponse('Invalid unsave payload', 'API_ERROR', {}, 400)
    }

    const supabase = createSupabaseAdminClient()

    const { data: content, error: contentError } = await resolveContentBySlugOrId(
      supabase,
      itemType,
      itemId
    )

    if (contentError) {
      return errorResponse('Failed to resolve content', 'API_ERROR', {}, 500)
    }

    const contentIdToDelete = content?.id || (isUuid(itemId) ? itemId : null)
    if (!contentIdToDelete) {
      return errorResponse('Content not found', 'CONTENT_NOT_FOUND', {}, 404)
    }

    const { error } = await supabase
      .from('content_saves')
      .delete()
      .eq('user_id', session.user.id)
      .eq('content_id', contentIdToDelete)
      .eq('content_type', itemType)

    if (error) return errorResponse(error.message, 'API_ERROR', {}, 500)
    return successResponse({ action: 'unsaved', hasSaved: false })
  } catch (error) {
    console.error('Save DELETE error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) return errorResponse('Unauthorized', 'API_ERROR', {}, 401)
    if (session.user.accountType === 'organization') {
      return errorResponse('Organization accounts cannot access saved content', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403)
    }

    const supabase = createSupabaseAdminClient()
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const itemType = searchParams.get('itemType')

    if (itemId && itemType && isValidType(itemType)) {
      const { data: content, error: contentError } = await resolveContentBySlugOrId(
        supabase,
        itemType,
        itemId,
        { requireApproved: true }
      )

      if (contentError) {
        return errorResponse('Failed to fetch save status', 'API_ERROR', {}, 500)
      }

      if (!content) {
        return successResponse({ hasSaved: false })
      }

      const { data } = await supabase
        .from('content_saves')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('content_id', content.id)
        .eq('content_type', itemType)
        .maybeSingle()
      return successResponse({ hasSaved: Boolean(data?.id) })
    }

    const { data: rows, error } = await supabase
      .from('content_saves')
      .select('id, content_id, content_type, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) return errorResponse(error.message, 'API_ERROR', {}, 500)
    const savedRows = rows || []

    const idsByType = {
      event: savedRows.filter((r) => r.content_type === 'event').map((r) => r.content_id),
      vacancy: savedRows.filter((r) => r.content_type === 'vacancy').map((r) => r.content_id),
      blog: savedRows.filter((r) => r.content_type === 'blog').map((r) => r.content_id),
    }

    const [eventsResult, vacanciesResult, blogsResult] = await Promise.all([
      idsByType.event.length
        ? supabase
            .from('events')
            .select('id,slug,title,description,category,event_type,organization_name,event_date')
            .in('id', idsByType.event)
            .eq('status', 'approved')
        : Promise.resolve({ data: [], error: null } as any),
      idsByType.vacancy.length
        ? supabase
            .from('vacancies')
            .select('id,slug,title,description,type,work_type,application_deadline')
            .in('id', idsByType.vacancy)
            .eq('status', 'approved')
        : Promise.resolve({ data: [], error: null } as any),
      idsByType.blog.length
        ? supabase
            .from('blogs')
            .select('id,slug,title,abstract,author_name,created_at,status')
            .in('id', idsByType.blog)
            .eq('status', 'approved')
        : Promise.resolve({ data: [], error: null } as any),
    ])

    if (eventsResult.error || vacanciesResult.error || blogsResult.error) {
      return errorResponse('Failed to fetch saved content details', 'API_ERROR', {}, 500)
    }

    const eventMap = new Map<string, any>(((eventsResult.data || []) as any[]).map((e: any) => [String(e.id), e]))
    const vacancyMap = new Map<string, any>(((vacanciesResult.data || []) as any[]).map((v: any) => [String(v.id), v]))
    const blogMap = new Map<string, any>(((blogsResult.data || []) as any[]).map((b: any) => [String(b.id), b]))

    const items = savedRows
      .map((row) => {
        if (row.content_type === 'event') {
          const event = eventMap.get(row.content_id) as any
          if (!event) return null
          return {
            id: row.id,
            itemId: row.content_id,
            itemType: 'event',
            createdAt: row.created_at,
            title: event.title,
            description: event.description,
            href: `/resources/events/${event.slug}`,
            metaOne: event.organization_name || event.category || '',
            metaTwo: event.event_date || '',
            badge: event.event_type || 'event',
          }
        }
        if (row.content_type === 'vacancy') {
          const vacancy = vacancyMap.get(row.content_id) as any
          if (!vacancy) return null
          return {
            id: row.id,
            itemId: row.content_id,
            itemType: 'vacancy',
            createdAt: row.created_at,
            title: vacancy.title,
            description: vacancy.description,
            href: `/resources/vacancies/${vacancy.slug}`,
            metaOne: vacancy.type || vacancy.work_type || '',
            metaTwo: vacancy.application_deadline || '',
            badge: vacancy.work_type || 'vacancy',
          }
        }
        if (row.content_type === 'blog') {
          const blog = blogMap.get(row.content_id) as any
          if (!blog) return null
          return {
            id: row.id,
            itemId: row.content_id,
            itemType: 'blog',
            createdAt: row.created_at,
            title: blog.title,
            description: blog.abstract || '',
            href: `/blogs/${blog.slug}`,
            metaOne: blog.author_name || '',
            metaTwo: blog.created_at || '',
            badge: 'blog',
          }
        }
        return null
      })
      .filter(Boolean)

    return successResponse({ items })
  } catch (error) {
    console.error('Save GET error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}
