import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { applyRateLimit } from '@/lib/rateLimit'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

const CONTENT_TABLE_BY_TYPE = {
  blog: 'blogs',
  event: 'events',
  vacancy: 'vacancies',
} as const

type ContentType = keyof typeof CONTENT_TABLE_BY_TYPE

const isContentType = (value: string): value is ContentType => value in CONTENT_TABLE_BY_TYPE

async function resolveApprovedContentId(supabase: any, contentType: ContentType, identifier: string) {
  const tableName = CONTENT_TABLE_BY_TYPE[contentType]
  const { data, error } = await resolveEntityBySlugOrId(supabase, tableName, identifier, 'id, status')
  if (error || !data?.id || data.status !== 'approved') {
    return null
  }
  return String(data.id)
}

async function getContentOwnerAndTitle(supabase: any, contentType: ContentType, contentId: string) {
  if (contentType === 'blog') {
    const { data } = await supabase
      .from('blogs')
      .select('id, title, slug, author_id')
      .eq('id', contentId)
      .maybeSingle()

    return {
      title: data?.title || 'Untitled',
      slug: data?.slug || contentId,
      ownerUserId: data?.author_id || null,
      ownerOrganizationId: null,
    }
  }

  if (contentType === 'event') {
    const { data } = await supabase
      .from('events')
      .select('id, title, slug, created_by, created_by_organization')
      .eq('id', contentId)
      .maybeSingle()

    return {
      title: data?.title || 'Untitled',
      slug: data?.slug || contentId,
      ownerUserId: data?.created_by || null,
      ownerOrganizationId: data?.created_by_organization || null,
    }
  }

  const { data } = await supabase
    .from('vacancies')
    .select('id, title, slug, created_by, created_by_organization')
    .eq('id', contentId)
    .maybeSingle()

  return {
    title: data?.title || 'Untitled',
    slug: data?.slug || contentId,
    ownerUserId: data?.created_by || null,
    ownerOrganizationId: data?.created_by_organization || null,
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { type: string; id: string } },
) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'write',
      endpoint: '/api/content/[type]/[id]/save',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const session = await getServerSession()
    if (!session?.user?.id) {
      const response = errorResponse('Unauthorized', 'API_ERROR', {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    if (session.user.accountType === 'organization') {
      const response = errorResponse('Organization accounts cannot save content', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const contentType = String(params.type || '').trim().toLowerCase()
    const contentId = String(params.id || '').trim()
    if (!contentId || !isContentType(contentType)) {
      const response = errorResponse('Invalid save payload', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const supabase = createSupabaseAdminClient()
    const canonicalContentId = await resolveApprovedContentId(supabase, contentType, contentId)
    if (!canonicalContentId) {
      const response = errorResponse('Content not found', 'API_ERROR', {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const { data: existing } = await supabase
      .from('content_saves')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('content_type', contentType)
      .eq('content_id', canonicalContentId)
      .maybeSingle()

    let action: 'saved' | 'unsaved' = 'saved'
    let saved = true

    if (existing?.id) {
      const { error: deleteError } = await supabase
        .from('content_saves')
        .delete()
        .eq('id', existing.id)
      if (deleteError) {
        const response = errorResponse(deleteError.message, 'API_ERROR', {}, 500)
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }
      action = 'unsaved'
      saved = false
    } else {
      const { error: insertError } = await supabase
        .from('content_saves')
        .insert({
          user_id: session.user.id,
          content_type: contentType,
          content_id: canonicalContentId,
        })
      if (insertError) {
        const response = errorResponse(insertError.message, 'API_ERROR', {}, 500)
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }

      if (contentType !== 'event') {
        try {
          const ownerData = await getContentOwnerAndTitle(supabase, contentType, canonicalContentId)
          const ownerUserId = ownerData.ownerUserId ? String(ownerData.ownerUserId) : null
          const ownerOrganizationId = ownerData.ownerOrganizationId ? String(ownerData.ownerOrganizationId) : null
          const actorId = session.user.id
          const shouldNotifyUser = Boolean(ownerUserId && ownerUserId !== actorId)
          const shouldNotifyOrganization = Boolean(ownerOrganizationId && ownerOrganizationId !== actorId)

          if (shouldNotifyUser || shouldNotifyOrganization) {
            await NotificationService.notifyContentSaved({
              recipientUserId: shouldNotifyUser ? ownerUserId || undefined : undefined,
              recipientOrganizationId: shouldNotifyOrganization ? ownerOrganizationId || undefined : undefined,
              contentType,
              contentId: canonicalContentId,
              contentSlug: ownerData.slug,
              contentTitle: ownerData.title,
            })
          }
        } catch (notificationError) {
          console.error('Failed to notify content save owner:', notificationError)
        }
      }
    }

    const { count: totalSaves } = await supabase
      .from('content_saves')
      .select('*', { count: 'exact', head: true })
      .eq('content_type', contentType)
      .eq('content_id', canonicalContentId)

    const response = successResponse({ action, saved, hasSaved: saved, totalSaves: totalSaves || 0 })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    console.error('Content save POST error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } },
) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'write',
      endpoint: '/api/content/[type]/[id]/save',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const contentType = String(params.type || '').trim().toLowerCase()
    const contentId = String(params.id || '').trim()
    if (!contentId || !isContentType(contentType)) {
      const response = errorResponse('Invalid save query', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const supabase = createSupabaseAdminClient()
    const canonicalContentId = await resolveApprovedContentId(supabase, contentType, contentId)
    if (!canonicalContentId) {
      const response = errorResponse('Content not found', 'API_ERROR', {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const session = await getServerSession()
    let saved = false

    if (session?.user?.id) {
      const { data } = await supabase
        .from('content_saves')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('content_type', contentType)
        .eq('content_id', canonicalContentId)
        .maybeSingle()
      saved = Boolean(data?.id)
    }

    const { count: totalSaves, error: countError } = await supabase
      .from('content_saves')
      .select('*', { count: 'exact', head: true })
      .eq('content_type', contentType)
      .eq('content_id', canonicalContentId)

    if (countError) {
      const response = errorResponse(countError.message, 'API_ERROR', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    const response = successResponse({ saved, hasSaved: saved, totalSaves: totalSaves || 0 })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    console.error('Content save GET error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}
