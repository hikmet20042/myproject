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
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const storyId = params.id;
    const userId = session.user.id;
    
    // Find the story
    const story = await Story.findById(storyId);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }
    
    // Check if user already liked this story
    const hasLiked = story.likedBy.includes(userId);
    let action: 'liked' | 'unliked';
    
    if (hasLiked) {
      // Unlike the story
      story.likedBy = story.likedBy.filter((id: any) => id.toString() !== userId);
      story.likes = Math.max(0, (story.likes || 0) - 1);
      action = 'unliked';
    } else {
      // Like the story
      story.likedBy.push(userId);
      story.likes = (story.likes || 0) + 1;
      action = 'liked';
    }
    
    // Recalculate engagement score
    const engagementScore = (story.views * 1) + (story.likes * 3) + (story.shares * 5);
    story.engagementScore = engagementScore;
    
    // Save the story
    await story.save();
    

    
    // Update user analytics for the story owner
    if (story.author) {
      try {
        const increment = action === 'liked' ? 1 : -1;
        await UserAnalytics.findOneAndUpdate(
          { userId: story.author },
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
      likes: story.likes,
      hasLiked: !hasLiked,
      engagementScore: story.engagementScore
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
    const storyId = params.id;
    
    const story = await Story.findById(storyId).select('likes likedBy');
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }
    
    const hasLiked = session?.user?.id ? story.likedBy.includes(session.user.id) : false;
    
    return NextResponse.json({
      likes: story.likes || 0,
      hasLiked,
      canLike: !!session?.user?.id
    });
    
  } catch (error) {
    console.error('Get like status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
