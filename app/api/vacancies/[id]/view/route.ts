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
    const { result: rateLimitResult, headers: rateLimitHeaders } = await applyRateLimit({
      request,
      preset: 'publicRead',
      endpoint: '/api/vacancies/[id]/view',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const vacancyId = String(params.id || '').trim()
    const clientIp = getClientIp(request) || 'unknown'
    const { id: sessionId, isNew: isNewSession } = getSessionId(request, 'vacancy_session_id')
    const session = await getServerSession()
    const userId = session?.user?.id || null

    const supabase = createSupabaseAdminClient()
    if (!vacancyId) {
      const response = errorResponse('Vakansiya identifikatoru tələb olunur', 'VALIDATION_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const { data: vacancy, error } = await supabase
      .from('vacancies')
      .select('id, slug, status, created_by, created_by_organization, title')
      .eq('id', vacancyId)
      .single()

    if (error || !vacancy) {
      const response = errorResponse('Vakansiya tapılmadı', 'VACANCY_NOT_FOUND', {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (vacancy.status !== 'approved') {
      const response = errorResponse('Vakansiya tapılmadı', 'VACANCY_NOT_FOUND', {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const userAgent = request.headers.get('user-agent')
    if (isBot(userAgent)) {
      const response = errorResponse('Bot baxışları izlənmir', 'BOT_FILTERED', {}, 200)
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
        console.warn(`[POST /api/vacancies/[id]/view] View time too short: ${timeOnPage}ms < ${MIN_VIEW_TIME_MS}ms`)
        const response = errorResponse('Baxış müddəti çox qısadır', 'VIEW_TIME_INVALID', {}, 400)
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }
    } else {
      console.warn(`[POST /api/vacancies/[id]/view] No view start timestamp - possible direct API call`)
      const response = errorResponse('Yanlış baxış sorğusu', 'VIEW_REQUEST_INVALID', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const stats = await recordContentView(supabase, 'vacancy', vacancy.id, sessionId, userId)

    if (stats.viewIncremented) {
      const milestones = [50, 100, 500, 1000, 5000, 10000, 50000, 100000]
      const reachedMilestone = milestones.find(m => stats.views === m)
      
      if (reachedMilestone) {
        try {
          if (vacancy.created_by_organization) {
            await NotificationService.notifyContentViewMilestone({
              recipientOrganizationId: vacancy.created_by_organization,
              contentType: 'vacancy',
              contentId: vacancy.id,
              contentSlug: vacancy.slug || vacancy.id,
              contentTitle: vacancy.title || 'Adsız Vakansiya',
              viewCount: stats.views,
            }).catch((err) => {
              console.error('Failed to notify organization about vacancy view milestone:', err)
            })
          }
          else if (vacancy.created_by) {
            await NotificationService.createNotification({
              userId: vacancy.created_by,
              type: 'content_view_milestone',
              title: '🎉 Görüntülənmə əngəsi çatıldı',
              message: `"${vacancy.title}" ${reachedMilestone >= 1000 ? (reachedMilestone / 1000).toFixed(0) + 'K' : reachedMilestone} görüntüləməyə çatdı!`,
              actionUrl: `/resources/vacancies/${vacancy.slug || vacancy.id}`,
              data: {
                contentType: 'vacancy',
                contentId: vacancy.id,
                contentSlug: vacancy.slug || null,
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

    const response = successResponse({
      views: stats.views,
      uniqueViews: stats.uniqueViews,
      viewIncremented: stats.viewIncremented,
    }) as NextResponse

    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }

    if (isNewSession && !userId) {
      setSessionCookie(response, 'vacancy_session_id', sessionId)
    }

    return response
  } catch (error) {
    console.error('POST /api/vacancies/[id]/view error:', error)
    return errorResponse('Daxili server xətası', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = await applyRateLimit({
      request,
      preset: 'publicRead',
      endpoint: '/api/vacancies/[id]/view',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const vacancyId = String(params.id || '').trim()
    const supabase = createSupabaseAdminClient()
    const session = await getServerSession()

    if (!vacancyId) {
      const response = errorResponse('Vakansiya identifikatoru tələb olunur', 'VALIDATION_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const { data: vacancy, error } = await supabase
      .from('vacancies')
      .select('id, status, created_by, created_by_organization')
      .eq('id', vacancyId)
      .single()

    if (error || !vacancy) {
      const response = errorResponse('Vakansiya tapılmadı', 'VACANCY_NOT_FOUND', {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (vacancy.status !== 'approved') {
      const isAdminUser = isAdmin(session)
      const isCreator = session?.user?.id === vacancy.created_by || session?.user?.id === vacancy.created_by_organization
      if (!isCreator && !isAdminUser) {
        const response = errorResponse('Vakansiya tapılmadı', 'VACANCY_NOT_FOUND', {}, 404)
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }
    }

    const stats = await getContentViewCounts(supabase, 'vacancy', vacancy.id)

    const response = successResponse({
      views: stats.views,
      uniqueViews: stats.uniqueViews,
    })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    console.error('GET /api/vacancies/[id]/view error:', error)
    return errorResponse('Daxili server xətası', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}
