import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { isBot, getClientIp, getSessionId, setSessionCookie, recordBlogView, getBlogViewCounts } from '@/lib/viewTracking'
import { applyRateLimit } from '@/lib/rateLimit'
import { isValidUUID } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = await applyRateLimit({
      request,
      preset: 'publicRead',
      endpoint: '/api/blogs/[id]/view',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (!isValidUUID(params.id)) {
      const response = errorResponse('Yanlış ID formatı', 'VALIDATION_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const clientIp = getClientIp(request) || 'unknown'
    const { id: sessionId, isNew: isNewSession } = getSessionId(request, 'blog_session_id')
    const session = await getServerSession()
    const userId = session?.user?.id || null
    
    const supabase = createSupabaseAdminClient()
    const blogId = params.id

    if (!blogId) {
      console.warn('[POST /api/blogs/[id]/view] Missing blog identifier')
      const response = errorResponse('Bloq identifikatoru tələb olunur', 'VALIDATION_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('id, status')
      .eq('id', blogId)
      .single()

    if (blogError || !blog) {
      console.warn(`[POST /api/blogs/[id]/view] Blog not found: id="${blogId}", error=${blogError?.message}`)
      const response = errorResponse('Bloq tapılmadı', 'BLOG_NOT_FOUND', {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (blog.status !== 'approved') {
      console.warn(`[POST /api/blogs/[id]/view] Blog not approved: id="${blogId}", status="${blog.status}"`)
      const response = errorResponse('Bloq tapılmadı', 'BLOG_NOT_FOUND', {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const userAgent = request.headers.get('user-agent')
    if (isBot(userAgent)) {
      console.log(`[POST /api/blogs/[id]/view] Bot filtered: user-agent="${userAgent}"`)
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
        console.warn(`[POST /api/blogs/[id]/view] View time too short: ${timeOnPage}ms < ${MIN_VIEW_TIME_MS}ms`)
        const response = errorResponse('Baxış müddəti çox qısadır', 'VIEW_TIME_INVALID', {}, 400)
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }
    } else {
      console.warn(`[POST /api/blogs/[id]/view] No view start timestamp - possible direct API call`)
      const response = errorResponse('Yanlış baxış sorğusu', 'VIEW_REQUEST_INVALID', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    console.log(`[POST /api/blogs/[id]/view] Recording view: blog="${blogId}", sessionId="${sessionId}", userId="${userId}", ip="${clientIp}", timeOnPage=${now - viewTime}ms`)

    const stats = await recordBlogView(supabase, blog.id, sessionId, userId)

    console.log(`[POST /api/blogs/[id]/view] View recorded: views=${stats.views}, uniqueViews=${stats.uniqueViews}, incremented=${stats.viewIncremented}`)

    const response = successResponse({
      views: stats.views,
      uniqueViews: stats.uniqueViews,
      viewIncremented: stats.viewIncremented,
    }) as NextResponse

    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }

    if (isNewSession && !userId) {
      setSessionCookie(response, 'blog_session_id', sessionId)
      console.log(`[POST /api/blogs/[id]/view] Session cookie set for sessionId="${sessionId}"`)
    }

    return response
  } catch (error) {
    console.error('POST /api/blogs/[id]/view error:', error)
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
      endpoint: '/api/blogs/[id]/view',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (!isValidUUID(params.id)) {
      const response = errorResponse('Yanlış ID formatı', 'VALIDATION_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const supabase = createSupabaseAdminClient()
    const blogId = params.id

    if (!blogId) {
      const response = errorResponse('Bloq identifikatoru tələb olunur', 'VALIDATION_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('id')
      .eq('id', blogId)
      .single()

    if (blogError || !blog) {
      const response = errorResponse('Bloq tapılmadı', 'BLOG_NOT_FOUND', {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const stats = await getBlogViewCounts(supabase, blog.id)

    const response = successResponse({
      views: stats.views,
      uniqueViews: stats.uniqueViews,
    })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    console.error('GET /api/blogs/[id]/view error:', error)
    return errorResponse('Daxili server xətası', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}
