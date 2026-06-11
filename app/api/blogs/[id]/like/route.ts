import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getBlogStats } from '@/lib/blogStats'
import { NotificationService } from '@/features/notifications/services/notificationService'
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
      preset: 'write',
      endpoint: '/api/blogs/[id]/like',
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
    const session = await getServerSession()

    if (!session?.user?.id) {
      const response = errorResponse('Autentifikasiya tələb olunur', 'AUTH_REQUIRED', {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

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
      .select('id, author_id, title')
      .eq('id', blogId)
      .single()

    if (blogError || !blog) {
      const response = errorResponse('Bloq tapılmadı', 'BLOG_NOT_FOUND', {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const { data: existingReaction, error: reactionError } = await supabase
      .from('blog_reactions')
      .select('id, reaction_type')
      .eq('blog_id', blog.id)
      .eq('user_id', session.user.id)
      .single()

    if (reactionError && reactionError.code !== 'PGRST116') {
      const response = errorResponse('Reaksiya yoxlanıla bilmədi', 'CHECK_REACTION_FAILED', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (existingReaction) {
      if (existingReaction.reaction_type === 'like') {
        const { error: deleteError } = await supabase
          .from('blog_reactions')
          .delete()
          .eq('id', existingReaction.id)

        if (deleteError) {
          const response = errorResponse('Bəyənmə silinə bilmədi', 'DELETE_REACTION_FAILED', {}, 500)
          for (const [key, value] of Object.entries(rateLimitHeaders)) {
            response.headers.set(key, value)
          }
          return response
        }

        const stats = await getBlogStats(supabase, blog.id, session.user.id)
        const response = successResponse({
          action: 'unliked',
          likes: stats.likes,
          dislikes: stats.dislikes,
          hasLiked: false,
          hasDisliked: false,
          engagementScore: stats.engagementScore,
        })
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      } else {
        const { error: updateError } = await supabase
          .from('blog_reactions')
          .update({ reaction_type: 'like' })
          .eq('id', existingReaction.id)

        if (updateError) {
          const response = errorResponse('Reaksiya yenilənə bilmədi', 'UPDATE_REACTION_FAILED', {}, 500)
          for (const [key, value] of Object.entries(rateLimitHeaders)) {
            response.headers.set(key, value)
          }
          return response
        }

        const stats = await getBlogStats(supabase, blog.id, session.user.id)
        
        if (blog.author_id && blog.author_id !== session.user.id) {
          await NotificationService.notifyBlogLike(blog.id, blog.title, blog.author_id)
        }

        const response = successResponse({
          action: 'liked',
          likes: stats.likes,
          dislikes: stats.dislikes,
          hasLiked: true,
          hasDisliked: false,
          engagementScore: stats.engagementScore,
        })
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }
    } else {
      const { error: insertError } = await supabase
        .from('blog_reactions')
        .insert({
          blog_id: blog.id,
          user_id: session.user.id,
          reaction_type: 'like',
        })

      if (insertError) {
        const response = errorResponse('Bəyənmə əlavə edilə bilmədi', 'INSERT_REACTION_FAILED', {}, 500)
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }

      const stats = await getBlogStats(supabase, blog.id, session.user.id)

      if (blog.author_id && blog.author_id !== session.user.id) {
        await NotificationService.notifyBlogLike(blog.id, blog.title, blog.author_id)
      }

      const response = successResponse({
        action: 'liked',
        likes: stats.likes,
        dislikes: stats.dislikes,
        hasLiked: true,
        hasDisliked: false,
        engagementScore: stats.engagementScore,
      })
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
  } catch (error) {
    console.error('POST /api/blogs/[id]/like error:', error)
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
      endpoint: '/api/blogs/[id]/like',
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
    const session = await getServerSession()
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

    const stats = await getBlogStats(supabase, blog.id, session?.user?.id)

    const response = successResponse({
      likes: stats.likes,
      hasLiked: stats.userReaction === 'like',
    })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    console.error('GET /api/blogs/[id]/like error:', error)
    return errorResponse('Daxili server xətası', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}
