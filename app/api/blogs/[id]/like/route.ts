import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Blog from '@/lib/models/Blog'
import { NotificationService } from '@/lib/services/notificationService'

import UserAnalytics from '@/lib/models/UserAnalytics'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const blogId = params.id;
    const userId = session.user.id;
    
    // Find the blog
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    
    // Check if user already liked this blog
    const hasLiked = blog.likedBy.includes(userId);
    // Check if user has disliked this blog
    const hasDisliked = blog.dislikedBy?.includes(userId);
    
    let action: 'liked' | 'unliked';
    
    // If user disliked it, remove the dislike first
    if (hasDisliked) {
      blog.dislikedBy = blog.dislikedBy.filter((id: any) => id.toString() !== userId);
      blog.dislikes = Math.max(0, (blog.dislikes || 0) - 1);
    }
    
    if (hasLiked) {
      // Unlike the blog
      blog.likedBy = blog.likedBy.filter((id: any) => id.toString() !== userId);
      blog.likes = Math.max(0, (blog.likes || 0) - 1);
      action = 'unliked';
    } else {
      // Like the blog
      blog.likedBy.push(userId);
      blog.likes = (blog.likes || 0) + 1;
      action = 'liked';
      
      // Create notification for blog author (if not liking own blog)
      if (blog.author && blog.author.toString() !== userId) {
        NotificationService.notifyBlogLike(
          blogId,
          blog.title,
          blog.author.toString(),
          userId,
          session.user.name || 'Someone'
        ).catch(err => console.error('Failed to create like notification:', err));
      }
    }
    
    // Recalculate engagement score (views * 1 + likes * 3 - dislikes * 1)
    const engagementScore = (blog.views * 1) + (blog.likes * 3) - (blog.dislikes || 0);
    blog.engagementScore = engagementScore;
    
    // Save the blog
    await blog.save();
    

    
    // Update user analytics for the blog owner
    if (blog.author) {
      try {
        const increment = action === 'liked' ? 1 : -1;
        await UserAnalytics.findOneAndUpdate(
          { userId: blog.author },
          {
            $inc: { totalLikes: increment },
            $set: { lastCalculated: new Date() }
          },
          { upsert: true }
        );
      } catch (error) {
        console.error('Failed to update user analytics:', error);
      }
    }
    
    // Return updated stats
    return NextResponse.json({
      success: true,
      action,
      likes: blog.likes,
      dislikes: blog.dislikes || 0,
      hasLiked: !hasLiked,
      hasDisliked: false,
      engagementScore: blog.engagementScore
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
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    const blogId = params.id;
    
    const blog = await Blog.findById(blogId).select('likes likedBy');
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    
    const hasLiked = session?.user?.id ? blog.likedBy.includes(session.user.id) : false;
    
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
