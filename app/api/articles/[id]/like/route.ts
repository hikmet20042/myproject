import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Article from '@/lib/models/Article'

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
    
    const articleId = params.id;
    const userId = session.user.id;
    
    // Find the article
    const article = await Article.findById(articleId);
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    
    // Check if user already liked this article
    const hasLiked = article.likedBy.includes(userId);
    let action: 'liked' | 'unliked';
    
    if (hasLiked) {
      // Unlike the article
      article.likedBy = article.likedBy.filter((id: any) => id.toString() !== userId);
      article.likes = Math.max(0, (article.likes || 0) - 1);
      action = 'unliked';
    } else {
      // Like the article
      article.likedBy.push(userId);
      article.likes = (article.likes || 0) + 1;
      action = 'liked';
    }
    
    // Recalculate engagement score
    const engagementScore = (article.views * 1) + (article.likes * 3) + (article.shares * 5);
    article.engagementScore = engagementScore;
    
    // Save the article
    await article.save();
    

    
    // Update user analytics for the article owner
    if (article.userId) {
      try {
        const increment = action === 'liked' ? 1 : -1;
        await UserAnalytics.findOneAndUpdate(
          { userId: article.userId },
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
      likes: article.likes,
      hasLiked: !hasLiked,
      engagementScore: article.engagementScore
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
    const articleId = params.id;
    
    const article = await Article.findById(articleId).select('likes likedBy');
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    
    const hasLiked = session?.user?.id ? article.likedBy.includes(session.user.id) : false;
    
    return NextResponse.json({
      likes: article.likes || 0,
      hasLiked,
      canLike: !!session?.user?.id
    });
    
  } catch (error) {
    console.error('Get like status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
