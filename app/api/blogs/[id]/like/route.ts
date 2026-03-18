import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();
    
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const blogId = params.id;
    const userId = session.user.id;
    
    // Find the blog
    const { data: blog, error } = await supabase
      .from('blogs')
      .select('id, title, author_id, likes, dislikes, liked_by, disliked_by, views')
      .eq('id', blogId)
      .single();
    if (error || !blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    
    // Check if user already liked this blog
    const likedBy = Array.isArray(blog.liked_by) ? blog.liked_by : [];
    const dislikedBy = Array.isArray(blog.disliked_by) ? blog.disliked_by : [];
    const hasLiked = likedBy.includes(userId);
    // Check if user has disliked this blog
    const hasDisliked = dislikedBy.includes(userId);
    
    let action: 'liked' | 'unliked';
    
    // If user disliked it, remove the dislike first
    if (hasDisliked) {
      blog.disliked_by = dislikedBy.filter((id: any) => id.toString() !== userId);
      blog.dislikes = Math.max(0, (blog.dislikes || 0) - 1);
    }
    
    if (hasLiked) {
      // Unlike the blog
      blog.liked_by = likedBy.filter((id: any) => id.toString() !== userId);
      blog.likes = Math.max(0, (blog.likes || 0) - 1);
      action = 'unliked';
    } else {
      // Like the blog
      likedBy.push(userId);
      blog.liked_by = likedBy;
      blog.likes = (blog.likes || 0) + 1;
      action = 'liked';
      
      // Create notification for blog author (if not liking own blog)
      if (blog.author_id && blog.author_id.toString() !== userId) {
        const { error: notificationError } = await supabase.from('notifications').insert({
          user_id: blog.author_id,
          type: 'blog_like',
          title: 'New Like',
          message: `${session.user.name || 'Someone'} liked your blog "${blog.title}"`,
          action_url: `/blogs/${blogId}`,
          data: {
            blogId,
            blogTitle: blog.title,
            likedBy: userId
          }
        });

        if (notificationError) {
          console.error('Failed to create like notification:', notificationError);
        }
      }
    }
    
    // Recalculate engagement score (views * 1 + likes * 3 - dislikes * 1)
    const engagementScore = (blog.views * 1) + (blog.likes * 3) - (blog.dislikes || 0);

    await supabase
      .from('blogs')
      .update({
        likes: blog.likes,
        dislikes: blog.dislikes || 0,
        liked_by: blog.liked_by || [],
        disliked_by: blog.disliked_by || [],
        engagement_score: engagementScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', blogId);
    
    // Return updated stats
    return NextResponse.json({
      success: true,
      action,
      likes: blog.likes,
      dislikes: blog.dislikes || 0,
      hasLiked: !hasLiked,
      hasDisliked: false,
      engagementScore
    });
    
  } catch (error) {
    console.error('Like/unlike error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      .select('likes, liked_by')
      .eq('id', blogId)
      .single();
    if (error || !blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    
    const likedBy = Array.isArray(blog.liked_by) ? blog.liked_by : [];
    const hasLiked = session?.user?.id ? likedBy.includes(session.user.id) : false;
    
    return NextResponse.json({
      likes: blog.likes || 0,
      hasLiked,
      canLike: !!session?.user?.id
    });
    
  } catch (error) {
    console.error('Get like status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
