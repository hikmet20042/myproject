import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Blog from '@/lib/models/Blog'

import UserAnalytics from '@/lib/models/UserAnalytics'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const blogId = params.id;
    const session = await getServerSession(authOptions);
    const viewerId = session?.user?.id;
    
    // Get client IP for unique view tracking
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    
    // Get user agent for analytics
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Find the blog
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Check if this is a unique view
    let isUniqueView = false;
    
    if (viewerId) {
      // For logged-in users, check if they haven't viewed this blog before
      if (!blog.viewedBy.includes(viewerId)) {
        isUniqueView = true;
        blog.viewedBy.push(viewerId);
        blog.uniqueViews = (blog.uniqueViews || 0) + 1;
      }
    } else {
      // For anonymous users, we'll count it as unique for now
      isUniqueView = true;
      blog.uniqueViews = (blog.uniqueViews || 0) + 1;
    }
    
    // Always increment total views
    blog.views = (blog.views || 0) + 1;
    
    // Calculate engagement score
    const engagementScore = (blog.views * 1) + (blog.likes * 3) + (blog.shares * 5);
    blog.engagementScore = engagementScore;
    
    // Save the blog
    await blog.save();
    

    
    // Update user analytics if the blog has an owner
    if (blog.author) {
      try {
        await UserAnalytics.findOneAndUpdate(
          { userId: blog.author },
          {
            $inc: { 
              totalViews: 1,
              ...(isUniqueView && { uniqueViews: 1 })
            },
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
      views: blog.views,
      uniqueViews: blog.uniqueViews,
      likes: blog.likes,
      engagementScore: blog.engagementScore,
      isUniqueView
    });
    
  } catch (error) {
    console.error('View tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get view statistics for a blog
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const blogId = params.id;
    
    const blog = await Blog.findById(blogId).select('views uniqueViews likes shares engagementScore');
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    
    // Get view analytics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const viewAnalytics: any[] = [];
    
    return NextResponse.json({
      views: blog.views || 0,
      uniqueViews: blog.uniqueViews || 0,
      likes: blog.likes || 0,
      shares: blog.shares || 0,
      engagementScore: blog.engagementScore || 0,
      dailyAnalytics: viewAnalytics
    });
    
  } catch (error) {
    console.error('View analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
