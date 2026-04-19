import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { isBot, getClientIp, getSessionId, setSessionCookie, recordBlogView, getBlogViewCounts } from '@/lib/viewTracking'
import { resolveEntityBySlugOrId } from '@/lib/identifier'
import { checkRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const VIEW_RATE_LIMIT_MAX = 60 // Max 60 view requests
const VIEW_RATE_LIMIT_WINDOW_MS = 60000 // Per minute

// POST /api/blogs/[slug]/view - Record a blog view with server-side dedup
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const clientIp = getClientIp(request) || 'unknown'
    const { id: sessionId, isNew: isNewSession } = getSessionId(request, 'blog_session_id')
    const session = await getServerSession()
    const userId = session?.user?.id || null
    
    // More robust rate limit key: include session/user to prevent single IP from affecting all users
    // Also add content type to separate rate limits for different content types
    const identifier = userId || sessionId || clientIp
    const rateLimitKey = `view:blog:${identifier}:${params.slug}`
    
    const rateLimitResult = checkRateLimit({
      key: rateLimitKey,
      maxRequests: VIEW_RATE_LIMIT_MAX,
      windowMs: VIEW_RATE_LIMIT_WINDOW_MS
    })
    
    if (!rateLimitResult.allowed) {
      console.warn(`[POST /api/blogs/[slug]/view] Rate limit exceeded for identifier: ${identifier}`)
      return errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    }

    const supabase = createSupabaseAdminClient()
    const blogIdentifier = params.slug

    if (!blogIdentifier) {
      console.warn('[POST /api/blogs/[slug]/view] Missing blog identifier')
      return errorResponse('Blog identifier is required', 'VALIDATION_ERROR', {}, 400)
    }

    const { data: resolvedBlog, error: resolveError } = await resolveEntityBySlugOrId(
      supabase,
      'blogs',
      blogIdentifier,
      'id'
    )

    if (resolveError || !resolvedBlog?.id) {
      return errorResponse('Blog not found', 'BLOG_NOT_FOUND', {}, 404)
    }

    // Find the blog
    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('id, status')
      .eq('id', resolvedBlog.id)
      .single()

    if (blogError || !blog) {
      console.warn(`[POST /api/blogs/[slug]/view] Blog not found: identifier="${blogIdentifier}", error=${blogError?.message}`)
      return errorResponse('Blog not found', 'BLOG_NOT_FOUND', {}, 404)
    }

    // Only track views for approved blogs
    if (blog.status !== 'approved') {
      console.warn(`[POST /api/blogs/[slug]/view] Blog not approved: identifier="${blogIdentifier}", status="${blog.status}"`)
      return errorResponse('Blog not found', 'BLOG_NOT_FOUND', {}, 404)
    }

    // Bot filtering
    const userAgent = request.headers.get('user-agent')
    if (isBot(userAgent)) {
      console.log(`[POST /api/blogs/[slug]/view] Bot filtered: user-agent="${userAgent}"`)
      return errorResponse('Bot views not tracked', 'BOT_FILTERED', {}, 200)
    }

    // Server-side time verification - prevent direct API calls bypassing client-side timer
    // Accept requests with timestamp from legitimate ViewTracker component
    const viewTime = parseInt(request.headers.get('x-view-start-time') || '0', 10)
    const now = Date.now()
    const MIN_VIEW_TIME_MS = 10000 // 10 seconds minimum
    
    if (viewTime > 0) {
      const timeOnPage = now - viewTime
      if (timeOnPage < MIN_VIEW_TIME_MS) {
        console.warn(`[POST /api/blogs/[slug]/view] View time too short: ${timeOnPage}ms < ${MIN_VIEW_TIME_MS}ms`)
        return errorResponse('View time too short', 'VIEW_TIME_INVALID', {}, 400)
      }
    } else {
      // No timestamp header = suspicious request (could be direct API call)
      console.warn(`[POST /api/blogs/[slug]/view] No view start timestamp - possible direct API call`)
      return errorResponse('Invalid view request', 'VIEW_REQUEST_INVALID', {}, 400)
    }

    // Get session and user identity (already fetched above)
    console.log(`[POST /api/blogs/[slug]/view] Recording view: blog="${blogIdentifier}" (id=${blog.id}), sessionId="${sessionId}", userId="${userId}", ip="${clientIp}", timeOnPage=${now - viewTime}ms`)

    // Record the view with 24h dedup
    const stats = await recordBlogView(supabase, blog.id, sessionId, userId)

    console.log(`[POST /api/blogs/[slug]/view] View recorded: views=${stats.views}, uniqueViews=${stats.uniqueViews}, incremented=${stats.viewIncremented}`)

    const response = successResponse({
      views: stats.views,
      uniqueViews: stats.uniqueViews,
      viewIncremented: stats.viewIncremented,
    }) as NextResponse

    // Set session cookie for anonymous users
    if (isNewSession && !userId) {
      setSessionCookie(response, 'blog_session_id', sessionId)
      console.log(`[POST /api/blogs/[slug]/view] Session cookie set for sessionId="${sessionId}"`)
    }

    return response
  } catch (error) {
    console.error('POST /api/blogs/[slug]/view error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}

// GET /api/blogs/[slug]/view - Get blog view counts (total + unique)
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    const blogIdentifier = params.slug

    if (!blogIdentifier) {
      return errorResponse('Blog identifier is required', 'VALIDATION_ERROR', {}, 400)
    }

    const { data: blog, error: blogError } = await resolveEntityBySlugOrId(
      supabase,
      'blogs',
      blogIdentifier,
      'id'
    )

    if (blogError || !blog) {
      return errorResponse('Blog not found', 'BLOG_NOT_FOUND', {}, 404)
    }

    const stats = await getBlogViewCounts(supabase, blog.id)

    return successResponse({
      views: stats.views,
      uniqueViews: stats.uniqueViews,
    })
  } catch (error) {
    console.error('GET /api/blogs/[slug]/view error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}
