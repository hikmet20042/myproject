import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Blog from '@/lib/models/Blog'
import { NotificationService } from '@/lib/services/notificationService'

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
    
    // Check if user already disliked this blog
    const hasDisliked = blog.dislikedBy?.includes(userId);
    // Check if user has liked this blog
    const hasLiked = blog.likedBy?.includes(userId);
    
    let action: 'disliked' | 'undisliked';
    
    // If user liked it, remove the like first
    if (hasLiked) {
      blog.likedBy = blog.likedBy.filter((id: any) => id.toString() !== userId);
      blog.likes = Math.max(0, (blog.likes || 0) - 1);
    }
    
    if (hasDisliked) {
      // Undislike the blog
      blog.dislikedBy = blog.dislikedBy.filter((id: any) => id.toString() !== userId);
      blog.dislikes = Math.max(0, (blog.dislikes || 0) - 1);
      action = 'undisliked';
    } else {
      // Dislike the blog
      if (!blog.dislikedBy) blog.dislikedBy = [];
      blog.dislikedBy.push(userId);
      blog.dislikes = (blog.dislikes || 0) + 1;
      action = 'disliked';
      
      // Create notification for blog author (if not disliking own blog)
      if (blog.author && blog.author.toString() !== userId) {
        NotificationService.notifyBlogDislike(
          blogId,
          blog.title,
          blog.author.toString(),
          userId,
          session.user.name || 'Someone'
        ).catch(err => console.error('Failed to create dislike notification:', err));
      }
    }
    
    // Recalculate engagement score (views * 1 + likes * 3 - dislikes * 1)
    const engagementScore = (blog.views * 1) + (blog.likes * 3) - (blog.dislikes || 0);
    blog.engagementScore = engagementScore;
    
    // Save the blog
    await blog.save();
    
    // Return updated stats
    return NextResponse.json({
      success: true,
      action,
      likes: blog.likes,
      dislikes: blog.dislikes || 0,
      hasLiked: false,
      hasDisliked: !hasDisliked,
      engagementScore: blog.engagementScore
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
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    const blogId = params.id;
    
    const blog = await Blog.findById(blogId).select('dislikes dislikedBy');
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    
    const hasDisliked = session?.user?.id ? blog.dislikedBy?.includes(session.user.id) : false;
    
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
