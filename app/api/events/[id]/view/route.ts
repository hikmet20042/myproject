import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { isAdmin } from '@/lib/auth/permissions'
import { isBot, getClientIp, getSessionId, setSessionCookie, recordContentView, getContentViewCounts } from '@/lib/viewTracking'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { applyRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'publicRead',
      endpoint: '/api/events/[id]/view',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const eventId = String(params.id || '').trim()
    const clientIp = getClientIp(request) || 'unknown'
    const { id: sessionId, isNew: isNewSession } = getSessionId(request, 'event_session_id')
    const session = await getServerSession()
    const userId = session?.user?.id || null

    const supabase = createSupabaseAdminClient()
    if (!eventId) {
      const response = errorResponse('Event identifier is required', 'VALIDATION_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const { data: event, error } = await supabase
      .from('events')
      .select('id, slug, status, created_by, created_by_organization, title')
      .eq('id', eventId)
      .single()

    if (error || !event) {
      const response = errorResponse('Event not found', 'EVENT_NOT_FOUND', {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (event.status !== 'approved') {
      const response = errorResponse('Event not found', 'EVENT_NOT_FOUND', {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const userAgent = request.headers.get('user-agent')
    if (isBot(userAgent)) {
      const response = errorResponse('Bot views not tracked', 'BOT_FILTERED', {}, 200)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const viewTime = parseInt(request.headers.get('x-view-start-time') || '0', 10)
    const now = Date.now()
    const MIN_VIEW_TIME_MS = 10000
    
    if (viewTime > 0) {
      const timeOnPage = now - viewTime
      if (timeOnPage < MIN_VIEW_TIME_MS) {
        console.warn(`[POST /api/events/[id]/view] View time too short: ${timeOnPage}ms < ${MIN_VIEW_TIME_MS}ms`)
        const response = errorResponse('View time too short', 'VIEW_TIME_INVALID', {}, 400)
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }
    } else {
      console.warn(`[POST /api/events/[id]/view] No view start timestamp - possible direct API call`)
      const response = errorResponse('Invalid view request', 'VIEW_REQUEST_INVALID', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const stats = await recordContentView(supabase, 'event', event.id, sessionId, userId)

    if (stats.viewIncremented) {
      const milestones = [50, 100, 500, 1000, 5000, 10000, 50000, 100000]
      const reachedMilestone = milestones.find(m => stats.views === m)
      
      if (reachedMilestone) {
        try {
          if (event.created_by_organization) {
            await NotificationService.notifyContentViewMilestone({
              recipientOrganizationId: event.created_by_organization,
              contentType: 'event',
              contentId: event.id,
              contentSlug: event.slug || event.id,
              contentTitle: event.title || 'Untitled Event',
              viewCount: stats.views,
            }).catch((err) => {
              console.error('Failed to notify organization about event view milestone:', err)
            })
          }
          else if (event.created_by) {
            await NotificationService.createNotification({
              userId: event.created_by,
              type: 'content_view_milestone',
              title: '🎉 Görüntülənmə əngəsi çatıldı',
              message: `"${event.title}" ${reachedMilestone >= 1000 ? (reachedMilestone / 1000).toFixed(0) + 'K' : reachedMilestone} görüntüləməyə çatdı!`,
              actionUrl: `/resources/events/${event.slug || event.id}`,
              data: {
                contentType: 'event',
                contentId: event.id,
                contentSlug: event.slug || null,
                contentTitle: event.title,
                viewCount: stats.views,
                milestone: reachedMilestone,
              },
            }).catch((err) => {
              console.error('Failed to notify user about event view milestone:', err)
            })
          }
        } catch (notifError) {
          console.error('Error processing view milestone notification:', notifError)
        }
      }
    }

    const response = successResponse({
      views: stats.views,
      uniqueViews: stats.uniqueViews,
      viewIncremented: stats.viewIncremented,
    }) as NextResponse

    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }

    if (isNewSession && !userId) {
      setSessionCookie(response, 'event_session_id', sessionId)
    }

    return response
  } catch (error) {
    console.error('POST /api/events/[id]/view error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'publicRead',
      endpoint: '/api/events/[id]/view',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const eventId = String(params.id || '').trim()
    const supabase = createSupabaseAdminClient()
    const session = await getServerSession()

    if (!eventId) {
      const response = errorResponse('Event identifier is required', 'VALIDATION_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const { data: event, error } = await supabase
      .from('events')
      .select('id, status, created_by, created_by_organization')
      .eq('id', eventId)
      .single()

    if (error || !event) {
      const response = errorResponse('Event not found', 'EVENT_NOT_FOUND', {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (event.status !== 'approved') {
      const isAdminUser = isAdmin(session)
      const isCreator = session?.user?.id === event.created_by || session?.user?.id === event.created_by_organization
      if (!isCreator && !isAdminUser) {
        const response = errorResponse('Event not found', 'EVENT_NOT_FOUND', {}, 404)
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }
    }

    const stats = await getContentViewCounts(supabase, 'event', event.id)

    const response = successResponse({
      views: stats.views,
      uniqueViews: stats.uniqueViews,
    })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    console.error('GET /api/events/[id]/view error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}
