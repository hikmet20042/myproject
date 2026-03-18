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
    
    // Check if user already disliked this blog
    const likedBy = Array.isArray(blog.liked_by) ? blog.liked_by : [];
    const dislikedBy = Array.isArray(blog.disliked_by) ? blog.disliked_by : [];
    const hasDisliked = dislikedBy.includes(userId);
    // Check if user has liked this blog
    const hasLiked = likedBy.includes(userId);
    
    let action: 'disliked' | 'undisliked';
    
    // If user liked it, remove the like first
    if (hasLiked) {
      blog.liked_by = likedBy.filter((id: any) => id.toString() !== userId);
      blog.likes = Math.max(0, (blog.likes || 0) - 1);
    }
    
    if (hasDisliked) {
      // Undislike the blog
      blog.disliked_by = dislikedBy.filter((id: any) => id.toString() !== userId);
      blog.dislikes = Math.max(0, (blog.dislikes || 0) - 1);
      action = 'undisliked';
    } else {
      // Dislike the blog
      dislikedBy.push(userId);
      blog.disliked_by = dislikedBy;
      blog.dislikes = (blog.dislikes || 0) + 1;
      action = 'disliked';
      
      // Create notification for blog author (if not disliking own blog)
      if (blog.author_id && blog.author_id.toString() !== userId) {
        const { error: notificationError } = await supabase.from('notifications').insert({
          user_id: blog.author_id,
          type: 'blog_dislike',
          title: 'New Dislike',
          message: `${session.user.name || 'Someone'} disliked your blog "${blog.title}"`,
          action_url: `/blogs/${blogId}`,
          data: {
            blogId,
            blogTitle: blog.title,
            dislikedBy: userId
          }
        });

        if (notificationError) {
          console.error('Failed to create dislike notification:', notificationError);
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
      hasLiked: false,
      hasDisliked: !hasDisliked,
      engagementScore
    });
    
  } catch (error) {
    console.error('Dislike/undislike error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get dislike status for current user
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
      .select('dislikes, disliked_by')
      .eq('id', blogId)
      .single();
    if (error || !blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    
    const dislikedBy = Array.isArray(blog.disliked_by) ? blog.disliked_by : [];
    const hasDisliked = session?.user?.id ? dislikedBy.includes(session.user.id) : false;
    
    return NextResponse.json({
      dislikes: blog.dislikes || 0,
      hasDisliked: hasDisliked || false,
      canDislike: !!session?.user?.id
    });
    
  } catch (error) {
    console.error('Get dislike status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
