import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { isAdmin } from '@/lib/auth/permissions'
import { isBot, getClientIp, getSessionId, setSessionCookie, recordContentView, getContentViewCounts } from '@/lib/viewTracking'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { resolveEntityBySlugOrId } from '@/lib/identifier'
import { checkRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const VIEW_RATE_LIMIT_MAX = 60 // Max 60 view requests
const VIEW_RATE_LIMIT_WINDOW_MS = 60000 // Per minute

// POST /api/vacancies/[slug]/view - Record a vacancy view with server-side dedup
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const clientIp = getClientIp(request) || 'unknown'
    const { id: sessionId, isNew: isNewSession } = getSessionId(request, 'vacancy_session_id')
    const session = await getServerSession()
    const userId = session?.user?.id || null
    
    // Better rate limit key: include user/session to prevent IP-wide blocking
    const identifier = userId || sessionId || clientIp
    const rateLimitKey = `view:vacancy:${identifier}:${params.slug}`
    
    const rateLimitResult = checkRateLimit({
      key: rateLimitKey,
      maxRequests: VIEW_RATE_LIMIT_MAX,
      windowMs: VIEW_RATE_LIMIT_WINDOW_MS
    })
    
    if (!rateLimitResult.allowed) {
      console.warn(`[POST /api/vacancies/[slug]/view] Rate limit exceeded for identifier: ${identifier}`)
      return errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    }

    const supabase = createSupabaseAdminClient()
    const vacancyIdentifier = params.slug

    if (!vacancyIdentifier) {
      return errorResponse('Vacancy identifier is required', 'VALIDATION_ERROR', {}, 400)
    }

    const { data: resolvedVacancy, error: resolveError } = await resolveEntityBySlugOrId(
      supabase,
      'vacancies',
      vacancyIdentifier,
      'id'
    )

    if (resolveError || !resolvedVacancy?.id) {
      return errorResponse('Vacancy not found', 'VACANCY_NOT_FOUND', {}, 404)
    }

    // Find the vacancy
    const { data: vacancy, error } = await supabase
      .from('vacancies')
      .select('id, status, created_by, created_by_organization, title')
      .eq('id', resolvedVacancy.id)
      .single()

    if (error || !vacancy) {
      return errorResponse('Vacancy not found', 'VACANCY_NOT_FOUND', {}, 404)
    }

    // Only track views for approved vacancies
    if (vacancy.status !== 'approved') {
      return errorResponse('Vacancy not found', 'VACANCY_NOT_FOUND', {}, 404)
    }

    // Bot filtering
    const userAgent = request.headers.get('user-agent')
    if (isBot(userAgent)) {
      return errorResponse('Bot views not tracked', 'BOT_FILTERED', {}, 200)
    }

    // Server-side time verification - prevent direct API calls bypassing client-side timer
    const viewTime = parseInt(request.headers.get('x-view-start-time') || '0', 10)
    const now = Date.now()
    const MIN_VIEW_TIME_MS = 10000 // 10 seconds minimum
    
    if (viewTime > 0) {
      const timeOnPage = now - viewTime
      if (timeOnPage < MIN_VIEW_TIME_MS) {
        console.warn(`[POST /api/vacancies/[slug]/view] View time too short: ${timeOnPage}ms < ${MIN_VIEW_TIME_MS}ms`)
        return errorResponse('View time too short', 'VIEW_TIME_INVALID', {}, 400)
      }
    } else {
      console.warn(`[POST /api/vacancies/[slug]/view] No view start timestamp - possible direct API call`)
      return errorResponse('Invalid view request', 'VIEW_REQUEST_INVALID', {}, 400)
    }

    // Record the view with 24h dedup (session/user already fetched above)
    const stats = await recordContentView(supabase, 'vacancy', vacancy.id, sessionId, userId)

    // Check for view milestones and notify - use atomic check to avoid race conditions
    // Only notify if view was actually incremented and count exactly matches a milestone
    if (stats.viewIncremented) {
      const milestones = [50, 100, 500, 1000, 5000, 10000, 50000, 100000]
      const reachedMilestone = milestones.find(m => stats.views === m)
      
      if (reachedMilestone) {
        try {
          // Notify organization if vacancy was created by organization
          if (vacancy.created_by_organization) {
            await NotificationService.notifyContentViewMilestone({
              recipientOrganizationId: vacancy.created_by_organization,
              contentType: 'vacancy',
              contentId: vacancy.id,
              contentTitle: vacancy.title || 'Untitled Vacancy',
              viewCount: stats.views,
            }).catch((err) => {
              console.error('Failed to notify organization about vacancy view milestone:', err)
            })
          }
          // Notify individual user if vacancy was created by user
          else if (vacancy.created_by) {
            await NotificationService.createNotification({
              userId: vacancy.created_by,
              type: 'content_view_milestone',
              title: '🎉 Görüntülənmə əngəsi çatıldı',
              message: `"${vacancy.title}" ${reachedMilestone >= 1000 ? (reachedMilestone / 1000).toFixed(0) + 'K' : reachedMilestone} görüntüləməyə çatdı!`,
              actionUrl: `/resources/vacancies/${vacancy.id}`,
              data: {
                contentType: 'vacancy',
                contentId: vacancy.id,
                contentTitle: vacancy.title,
                viewCount: stats.views,
                milestone: reachedMilestone,
              },
            }).catch((err) => {
              console.error('Failed to notify user about vacancy view milestone:', err)
            })
          }
        } catch (notifError) {
          console.error('Error processing view milestone notification:', notifError)
        }
      }
    }

    const response = NextResponse.json({
      data: {
        views: stats.views,
        uniqueViews: stats.uniqueViews,
        viewIncremented: stats.viewIncremented,
      },
    })

    // Set session cookie for anonymous users
    if (isNewSession && !userId) {
      setSessionCookie(response, 'vacancy_session_id', sessionId)
    }

    return response
  } catch (error) {
    console.error('POST /api/vacancies/[slug]/view error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}

// GET /api/vacancies/[slug]/view - Get vacancy view counts
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    const session = await getServerSession()
    const vacancyIdentifier = params.slug

    if (!vacancyIdentifier) {
      return errorResponse('Vacancy identifier is required', 'VALIDATION_ERROR', {}, 400)
    }

    const { data: resolvedVacancy, error: resolveError } = await resolveEntityBySlugOrId(
      supabase,
      'vacancies',
      vacancyIdentifier,
      'id'
    )

    if (resolveError || !resolvedVacancy?.id) {
      return errorResponse('Vacancy not found', 'VACANCY_NOT_FOUND', {}, 404)
    }

    const { data: vacancy, error } = await supabase
      .from('vacancies')
      .select('id, status, created_by, created_by_organization')
      .eq('id', resolvedVacancy.id)
      .single()

    if (error || !vacancy) {
      return errorResponse('Vacancy not found', 'VACANCY_NOT_FOUND', {}, 404)
    }

    // Only return stats for approved vacancies, or for creator/admin of non-approved
    if (vacancy.status !== 'approved') {
      const isAdminUser = isAdmin(session)
      const isCreator = session?.user?.id === vacancy.created_by || session?.user?.id === vacancy.created_by_organization
      if (!isCreator && !isAdminUser) {
        return errorResponse('Vacancy not found', 'VACANCY_NOT_FOUND', {}, 404)
      }
    }

    const stats = await getContentViewCounts(supabase, 'vacancy', vacancy.id)

    return successResponse({
      views: stats.views,
      uniqueViews: stats.uniqueViews,
    })
  } catch (error) {
    console.error('GET /api/vacancies/[slug]/view error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}
