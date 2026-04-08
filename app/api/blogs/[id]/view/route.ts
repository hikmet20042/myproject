import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { randomUUID } from 'crypto'
import { getBlogStats } from '@/lib/blogStats'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    const blogId = params.id
    const session = await getServerSession()
    const viewerId = session?.user?.id

    let body: any = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const { sessionId: bodySessionId, session_id: bodySessionIdAlt } = body

    const { data: blog, error } = await supabase
      .from('blogs')
      .select('id, status')
      .eq('id', blogId)
      .single()
    if (error || !blog) {
      return errorResponse('Blog not found', 'BLOG_NOT_FOUND', {}, 404)
    }

    const cookieSessionId = request.cookies.get('blog_view_session_id')?.value
    const sessionIdRaw =
      bodySessionId ||
      bodySessionIdAlt ||
      cookieSessionId ||
      (viewerId ? `user_${viewerId}` : `tmp_${randomUUID()}`)
    const sessionId = String(sessionIdRaw || '').trim().slice(0, 255)

    if (!sessionId) {
      return errorResponse('Session id is required', 'INVALID_SESSION', {}, 400)
    }

    if (blog.status !== 'approved') {
      const stats = await getBlogStats(supabase, blogId, viewerId)
      return successResponse({
        message: 'Views only tracked for approved content',
        views: stats.views,
        uniqueViews: stats.uniqueViews,
        likes: stats.likes,
        dislikes: stats.dislikes,
        engagementScore: stats.engagementScore,
        isUniqueView: false,
        viewIncremented: false
      })
    }

    const dedupeSince = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const { data: existingEvent, error: existingEventError } = await supabase
      .from('blog_views')
      .select('id')
      .eq('blog_id', blogId)
      .eq('session_id', sessionId)
      .gte('created_at', dedupeSince)
      .limit(1)
      .maybeSingle()

    if (existingEventError) {
      return errorResponse('Failed to track view', 'INTERNAL_SERVER_ERROR', {}, 500)
    }

    const viewIncremented = !existingEvent?.id
    if (viewIncremented) {
      const { error: insertError } = await supabase
        .from('blog_views')
        .insert({
          blog_id: blogId,
          session_id: sessionId,
          user_id: viewerId || null
        })
      if (insertError) {
        return errorResponse('Failed to track view', 'INTERNAL_SERVER_ERROR', {}, 500)
      }
      console.info('[blog_views] inserted', { blogId, sessionId, userId: viewerId || null })
    } else {
      console.info('[blog_views] dedupe hit', { blogId, sessionId })
    }

    const stats = await getBlogStats(supabase, blogId, viewerId)

    return successResponse({
      views: stats.views,
      uniqueViews: stats.uniqueViews,
      likes: stats.likes,
      dislikes: stats.dislikes,
      engagementScore: stats.engagementScore,
      isUniqueView: viewIncremented,
      viewIncremented
    })
  } catch (error) {
    console.error('View tracking error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    const blogId = params.id

    const { data: blog, error } = await supabase
      .from('blogs')
      .select('id')
      .eq('id', blogId)
      .single()
    if (error || !blog) {
      return errorResponse('Blog not found', 'BLOG_NOT_FOUND', {}, 404)
    }

    const viewAnalytics: any[] = []
    const session = await getServerSession()
    const stats = await getBlogStats(supabase, blogId, session?.user?.id)

    return successResponse({
      views: stats.views,
      uniqueViews: stats.uniqueViews,
      likes: stats.likes,
      dislikes: stats.dislikes,
      engagementScore: stats.engagementScore,
      dailyAnalytics: viewAnalytics
    })
  } catch (error) {
    console.error('View analytics error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}
