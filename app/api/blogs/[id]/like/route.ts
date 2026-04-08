import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { NotificationService } from '@/lib/services/notificationService'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getBlogStats } from '@/lib/blogStats'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();
    
    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse('Authentication required', 'AUTH_REQUIRED', {}, 401);
    }
    
    const blogId = params.id;
    const userId = session.user.id;
    
    // Find the blog
    const { data: blog, error } = await supabase
      .from('blogs')
      .select('id, title, author_id')
      .eq('id', blogId)
      .single();
    if (error || !blog) {
      return errorResponse('Blog not found', 'BLOG_NOT_FOUND', {}, 404);
    }

    const { data: existingReaction, error: existingReactionError } = await supabase
      .from('blog_reactions')
      .select('reaction_type')
      .eq('blog_id', blogId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingReactionError) {
      return errorResponse('Failed to process reaction', 'INTERNAL_SERVER_ERROR', {}, 500)
    }

    const currentReaction = existingReaction?.reaction_type as 'like' | 'dislike' | undefined
    let action: 'liked' | 'unliked';

    if (currentReaction === 'like') {
      const { error: deleteError } = await supabase
        .from('blog_reactions')
        .delete()
        .eq('blog_id', blogId)
        .eq('user_id', userId)
      if (deleteError) {
        return errorResponse('Failed to remove reaction', 'INTERNAL_SERVER_ERROR', {}, 500)
      }
      action = 'unliked';
    } else {
      const { error: upsertError } = await supabase
        .from('blog_reactions')
        .upsert(
          {
            blog_id: blogId,
            user_id: userId,
            reaction_type: 'like'
          },
          { onConflict: 'user_id,blog_id' }
        )
      if (upsertError) {
        return errorResponse('Failed to update reaction', 'INTERNAL_SERVER_ERROR', {}, 500)
      }
      action = 'liked';
      
      // Create notification for blog author (if not liking own blog)
      if (blog.author_id && blog.author_id.toString() !== userId) {
        try {
          await NotificationService.notifyBlogLike(
            blogId,
            blog.title || '',
            blog.author_id.toString(),
            userId,
            session.user.name || 'Someone'
          )
        } catch (notificationError) {
          console.error('Failed to create like notification:', notificationError);
        }
      }
    }

    const stats = await getBlogStats(supabase, blogId, userId)
    
    // Return updated stats
    return successResponse({
      action,
      likes: stats.likes,
      dislikes: stats.dislikes || 0,
      hasLiked: stats.userReaction === 'like',
      hasDisliked: stats.userReaction === 'dislike',
      engagementScore: stats.engagementScore
    });
    
  } catch (error) {
    console.error('Like/unlike error:', error);
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500);
  }
}

// Get like status for current user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();
    
    const session = await getServerSession();
    const blogId = params.id;
    
    const { data: blog, error } = await supabase
      .from('blogs')
      .select('id')
      .eq('id', blogId)
      .single();
    if (error || !blog) {
      return errorResponse('Blog not found', 'BLOG_NOT_FOUND', {}, 404);
    }
    const stats = await getBlogStats(supabase, blogId, session?.user?.id)
    const hasLiked = stats.userReaction === 'like'
    
    return successResponse({
      likes: stats.likes,
      hasLiked,
      canLike: !!session?.user?.id
    });
    
  } catch (error) {
    console.error('Get like status error:', error);
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500);
  }
}
