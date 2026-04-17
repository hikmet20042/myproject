import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getBlogStats } from '@/lib/blogStats'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

export const dynamic = 'force-dynamic'

// POST /api/blogs/[slug]/dislike - Toggle dislike reaction on a blog
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
      if (existingReaction.reaction_type === 'dislike') {
        // Remove the dislike (undislike)
        const { error: deleteError } = await supabase
          .from('blog_reactions')
          .delete()
          .eq('id', existingReaction.id)

        if (deleteError) {
          return errorResponse('Failed to remove dislike', 'DELETE_REACTION_FAILED', {}, 500)
        }

        const stats = await getBlogStats(supabase, blog.id, session.user.id)
        return successResponse({
          action: 'undisliked',
          likes: stats.likes,
          dislikes: stats.dislikes,
          hasLiked: false,
          hasDisliked: false,
          engagementScore: stats.engagementScore,
        })
      } else {
        // Change from like to dislike
        const { error: updateError } = await supabase
          .from('blog_reactions')
          .update({ reaction_type: 'dislike' })
          .eq('id', existingReaction.id)

        if (updateError) {
          return errorResponse('Failed to update reaction', 'UPDATE_REACTION_FAILED', {}, 500)
        }

        const stats = await getBlogStats(supabase, blog.id, session.user.id)
        return successResponse({
          action: 'disliked',
          likes: stats.likes,
          dislikes: stats.dislikes,
          hasLiked: false,
          hasDisliked: true,
          engagementScore: stats.engagementScore,
        })
      }
    } else {
      // Create new dislike
      const { error: insertError } = await supabase
        .from('blog_reactions')
        .insert({
          blog_id: blog.id,
          user_id: session.user.id,
          reaction_type: 'dislike',
        })

      if (insertError) {
        return errorResponse('Failed to add dislike', 'INSERT_REACTION_FAILED', {}, 500)
      }

      const stats = await getBlogStats(supabase, blog.id, session.user.id)
      return successResponse({
        action: 'disliked',
        likes: stats.likes,
        dislikes: stats.dislikes,
        hasLiked: false,
        hasDisliked: true,
        engagementScore: stats.engagementScore,
      })
    }
  } catch (error) {
    console.error('POST /api/blogs/[slug]/dislike error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}

// GET /api/blogs/[slug]/dislike - Get dislike count and user's dislike status
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    const session = await getServerSession()
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

    const stats = await getBlogStats(supabase, blog.id, session?.user?.id)

    return successResponse({
      dislikes: stats.dislikes,
      hasDisliked: stats.userReaction === 'dislike',
    })
  } catch (error) {
    console.error('GET /api/blogs/[slug]/dislike error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}
