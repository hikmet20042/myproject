import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Story from '@/lib/models/Story'

import UserAnalytics from '@/lib/models/UserAnalytics'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const storyId = params.id;
    const session = await getServerSession(authOptions);
    const viewerId = session?.user?.id;
    
    // Get client IP for unique view tracking
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    
    // Get user agent for analytics
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Find the story
    const story = await Story.findById(storyId);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check if this is a unique view
    let isUniqueView = false;
    
    if (viewerId) {
      // For logged-in users, check if they haven't viewed this story before
      if (!story.viewedBy.includes(viewerId)) {
        isUniqueView = true;
        story.viewedBy.push(viewerId);
        story.uniqueViews = (story.uniqueViews || 0) + 1;
      }
    } else {
      // For anonymous users, we'll count it as unique for now
      isUniqueView = true;
      story.uniqueViews = (story.uniqueViews || 0) + 1;
    }
    
    // Always increment total views
    story.views = (story.views || 0) + 1;
    
    // Calculate engagement score
    const engagementScore = (story.views * 1) + (story.likes * 3) + (story.shares * 5);
    story.engagementScore = engagementScore;
    
    // Save the story
    await story.save();
    

    
    // Update user analytics if the story has an owner
    if (story.author) {
      try {
        await UserAnalytics.findOneAndUpdate(
          { userId: story.author },
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
      views: story.views,
      uniqueViews: story.uniqueViews,
      likes: story.likes,
      engagementScore: story.engagementScore,
      isUniqueView
    });
    
  } catch (error) {
    console.error('View tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get view statistics for a story
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const storyId = params.id;
    
    const story = await Story.findById(storyId).select('views uniqueViews likes shares engagementScore');
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }
    
    // Get view analytics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const viewAnalytics: any[] = [];
    
    return NextResponse.json({
      views: story.views || 0,
      uniqueViews: story.uniqueViews || 0,
      likes: story.likes || 0,
      shares: story.shares || 0,
      engagementScore: story.engagementScore || 0,
      dailyAnalytics: viewAnalytics
    });
    
  } catch (error) {
    console.error('View analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
