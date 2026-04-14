import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getBlogStats } from '@/lib/blogStats'
import { NotificationService } from '@/features/notifications/services/notificationService'

export const dynamic = 'force-dynamic'

// POST /api/blogs/[slug]/like - Toggle like reaction on a blog
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    const session = await getServerSession()

    if (!session?.user?.id) {
      return errorResponse('Authentication required', 'AUTH_REQUIRED', {}, 401)
    }

    const blogSlug = params.slug

    if (!blogSlug) {
      return errorResponse('Blog slug is required', 'VALIDATION_ERROR', {}, 400)
    }

    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('id, author_id, title')
      .eq('slug', blogSlug)
      .single()

    if (blogError || !blog) {
      return errorResponse('Blog not found', 'BLOG_NOT_FOUND', {}, 404)
    }

    // Check if user already has a reaction
    const { data: existingReaction, error: reactionError } = await supabase
      .from('blog_reactions')
      .select('id, reaction_type')
      .eq('blog_id', blog.id)
      .eq('user_id', session.user.id)
      .single()

    if (reactionError && reactionError.code !== 'PGRST116') {
      // PGRST116 = no rows found
      return errorResponse('Failed to check reaction', 'CHECK_REACTION_FAILED', {}, 500)
    }

    if (existingReaction) {
      if (existingReaction.reaction_type === 'like') {
        // Remove the like (unlike)
        const { error: deleteError } = await supabase
          .from('blog_reactions')
          .delete()
          .eq('id', existingReaction.id)

        if (deleteError) {
          return errorResponse('Failed to remove like', 'DELETE_REACTION_FAILED', {}, 500)
        }

        const stats = await getBlogStats(supabase, blog.id, session.user.id)
        return successResponse({
          action: 'unliked',
          likes: stats.likes,
          dislikes: stats.dislikes,
          hasLiked: false,
          hasDisliked: false,
          engagementScore: stats.engagementScore,
        })
      } else {
        // Change from dislike to like
        const { error: updateError } = await supabase
          .from('blog_reactions')
          .update({ reaction_type: 'like' })
          .eq('id', existingReaction.id)

        if (updateError) {
          return errorResponse('Failed to update reaction', 'UPDATE_REACTION_FAILED', {}, 500)
        }

        const stats = await getBlogStats(supabase, blog.id, session.user.id)
        
        // Notify blog author about the like
        if (blog.author_id && blog.author_id !== session.user.id) {
          await NotificationService.notifyBlogLike(blog.id, blog.title, blog.author_id)
        }

        return successResponse({
          action: 'liked',
          likes: stats.likes,
          dislikes: stats.dislikes,
          hasLiked: true,
          hasDisliked: false,
          engagementScore: stats.engagementScore,
        })
      }
    } else {
      // Create new like
      const { error: insertError } = await supabase
        .from('blog_reactions')
        .insert({
          blog_id: blog.id,
          user_id: session.user.id,
          reaction_type: 'like',
        })

      if (insertError) {
        return errorResponse('Failed to add like', 'INSERT_REACTION_FAILED', {}, 500)
      }

      const stats = await getBlogStats(supabase, blog.id, session.user.id)

      // Notify blog author about the like
      if (blog.author_id && blog.author_id !== session.user.id) {
        await NotificationService.notifyBlogLike(blog.id, blog.title, blog.author_id)
      }

      return successResponse({
        action: 'liked',
        likes: stats.likes,
        dislikes: stats.dislikes,
        hasLiked: true,
        hasDisliked: false,
        engagementScore: stats.engagementScore,
      })
    }
  } catch (error) {
    console.error('POST /api/blogs/[slug]/like error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}

// GET /api/blogs/[slug]/like - Get like count and user's like status
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    const session = await getServerSession()
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

    const stats = await getBlogStats(supabase, blog.id, session?.user?.id)

    return successResponse({
      likes: stats.likes,
      hasLiked: stats.userReaction === 'like',
    })
  } catch (error) {
    console.error('GET /api/blogs/[slug]/like error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}
