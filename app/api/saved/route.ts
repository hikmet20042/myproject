import { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'
import { isUuid, resolveEntityBySlugOrId } from '@/lib/identifier'

const ALLOWED_TYPES = ['event', 'vacancy', 'blog'] as const
type SavedType = (typeof ALLOWED_TYPES)[number]

const isValidType = (value: string): value is SavedType =>
  ALLOWED_TYPES.includes(value as SavedType)

async function resolveContentBySlugOrId(
  supabase: SupabaseClient,
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
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'write',
      endpoint: '/api/saved',
    })

    const session = await getServerSession()
    if (!session?.user?.id) {
      const response = errorResponse('İcazəsiz giriş', 'API_ERROR', {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    if (session.user.accountType === 'organization') {
      const response = errorResponse('Təşkilat hesabları məzmun saxlaya bilməz', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMITED', {
        retryAfter: rateLimitResult.resetAt,
      }, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const body = await request.json()
    const itemId = String(body?.itemId || '').trim()
    const itemType = String(body?.itemType || '').trim()

    if (!itemId || !isValidType(itemType)) {
      const response = errorResponse('Yanlış saxlama məlumatı', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const supabase = createSupabaseAdminClient()

    const { data: content, error: contentError } = await resolveContentBySlugOrId(
      supabase,
      itemType,
      itemId,
      { requireApproved: true }
    )

    if (contentError || !content) {
      const response = errorResponse(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found`, 'CONTENT_NOT_FOUND', {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
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
      if (error) {
        const response = errorResponse(error.message, 'API_ERROR', {}, 500)
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }
      const response = successResponse({ action: 'unsaved', hasSaved: false })
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const { error } = await supabase.from('content_saves').insert({
      user_id: session.user.id,
      content_id: content.id,
      content_type: itemType,
    })
    if (error) {
      const response = errorResponse(error.message, 'API_ERROR', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const response = successResponse({ action: 'saved', hasSaved: true })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    console.error('Save POST error:', error)
    const response = errorResponse('Daxili server xətası', 'API_ERROR', {}, 500)
    return response
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'write',
      endpoint: '/api/saved',
    })

    const session = await getServerSession()
    if (!session?.user?.id) {
      const response = errorResponse('İcazəsiz giriş', 'API_ERROR', {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    if (session.user.accountType === 'organization') {
      const response = errorResponse('Təşkilat hesabları məzmun saxlaya bilməz', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMITED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const body = await request.json().catch(() => ({}))
    const itemId = String(body?.itemId || '').trim()
    const itemType = String(body?.itemType || '').trim()

    if (!itemId || !isValidType(itemType)) {
      const response = errorResponse('Yanlış silmə məlumatı', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const supabase = createSupabaseAdminClient()

    const { data: content, error: contentError } = await resolveContentBySlugOrId(
      supabase,
      itemType,
      itemId
    )

    if (contentError) {
      const response = errorResponse('Məzmun həll edilə bilmədi', 'API_ERROR', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const contentIdToDelete = content?.id || (isUuid(itemId) ? itemId : null)
    if (!contentIdToDelete) {
      const response = errorResponse('Məzmun tapılmadı', 'CONTENT_NOT_FOUND', {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const { error } = await supabase
      .from('content_saves')
      .delete()
      .eq('user_id', session.user.id)
      .eq('content_id', contentIdToDelete)
      .eq('content_type', itemType)

    if (error) {
      const response = errorResponse(error.message, 'API_ERROR', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    const response = successResponse({ action: 'unsaved', hasSaved: false })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    console.error('Save DELETE error:', error)
    const response = errorResponse('Daxili server xətası', 'API_ERROR', {}, 500)
    return response
  }
}

export async function GET(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'authenticatedRead',
      endpoint: '/api/saved',
    })

    const session = await getServerSession()
    if (!session?.user?.id) {
      const response = errorResponse('İcazəsiz giriş', 'API_ERROR', {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    if (session.user.accountType === 'organization') {
      const response = errorResponse('Təşkilat hesabları saxlanılmış məzmuna daxil ola bilməz', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMITED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
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
        const response = errorResponse('Saxlama statusu yüklənə bilmədi', 'API_ERROR', {}, 500)
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }

      if (!content) {
        const response = successResponse({ hasSaved: false })
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }

      const { data } = await supabase
        .from('content_saves')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('content_id', content.id)
        .eq('content_type', itemType)
        .maybeSingle()
      const response = successResponse({ hasSaved: Boolean(data?.id) })
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const { data: rows, error } = await supabase
      .from('content_saves')
      .select('id, content_id, content_type, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      const response = errorResponse(error.message, 'API_ERROR', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
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
      const response = errorResponse('Saxlanılmış məzmun detalları yüklənə bilmədi', 'API_ERROR', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
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

    const response = successResponse({ items })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    console.error('Save GET error:', error)
    const response = errorResponse('Daxili server xətası', 'API_ERROR', {}, 500)
    return response
  }
}
