import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic'

// POST /api/blogs/[slug]/view - Record a blog view
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    const blogSlug = params.slug

    if (!blogSlug) {
      return errorResponse('Blog slug is required', 'VALIDATION_ERROR', {}, 400)
    }

    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('id')
      .eq('slug', blogSlug)
      .single()

    if (blogError || !blog) {
      return errorResponse('Blog not found', 'BLOG_NOT_FOUND', {}, 404)
    }

    // Get session ID from cookies or generate one
    const sessionId = request.cookies.get('blog_session_id')?.value || crypto.randomUUID()

    // Insert view record
    const { error: viewError } = await supabase
      .from('blog_views')
      .insert({
        blog_id: blog.id,
        session_id: sessionId,
      })

    if (viewError) {
      console.error('Failed to record blog view:', viewError)
      return errorResponse('Failed to record view', 'RECORD_VIEW_FAILED', {}, 500)
    }

    const response = successResponse({ message: 'View recorded' })
    // Set session cookie if it didn't exist
    if (!request.cookies.has('blog_session_id')) {
      response.cookies.set('blog_session_id', sessionId, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
        sameSite: 'lax',
      })
    }

    return response
  } catch (error) {
    console.error('POST /api/blogs/[slug]/view error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}

// GET /api/blogs/[slug]/view - Get blog view count
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    const blogSlug = params.slug

    if (!blogSlug) {
      return errorResponse('Blog slug is required', 'VALIDATION_ERROR', {}, 400)
    }

    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('id')
      .eq('slug', blogSlug)
      .single()

    if (blogError || !blog) {
      return errorResponse('Blog not found', 'BLOG_NOT_FOUND', {}, 404)
    }

    const { count, error: countError } = await supabase
      .from('blog_views')
      .select('*', { count: 'exact', head: true })
      .eq('blog_id', blog.id)

    if (countError) {
      return errorResponse('Failed to get view count', 'GET_VIEW_COUNT_FAILED', {}, 500)
    }

    return successResponse({ views: count || 0 })
  } catch (error) {
    console.error('GET /api/blogs/[slug]/view error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}
