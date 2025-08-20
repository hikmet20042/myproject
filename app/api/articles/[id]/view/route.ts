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
    
    const articleId = params.id;
    const session = await getServerSession(authOptions);
    const viewerId = session?.user?.id;
    
    // Get client IP for unique view tracking
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    
    // Get user agent for analytics
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Find the article
    const article = await Article.findById(articleId);
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Check if this is a unique view
    let isUniqueView = false;
    
    if (viewerId) {
      // For logged-in users, check if they haven't viewed this article before
      if (!article.viewedBy.includes(viewerId)) {
        isUniqueView = true;
        article.viewedBy.push(viewerId);
        article.uniqueViews = (article.uniqueViews || 0) + 1;
      }
    } else {
      // For anonymous users, we'll count it as unique for now
      // In production, you might want to use cookies or IP tracking
      isUniqueView = true;
      article.uniqueViews = (article.uniqueViews || 0) + 1;
    }
    
    // Always increment total views
    article.views = (article.views || 0) + 1;
    
    // Calculate engagement score (simple formula)
    const engagementScore = (article.views * 1) + (article.likes * 3) + (article.shares * 5);
    article.engagementScore = engagementScore;
    
    // Save the article
    await article.save();
    

    
    // Update user analytics if the article has an owner
    if (article.userId) {
      try {
        await UserAnalytics.findOneAndUpdate(
          { userId: article.userId },
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
      views: article.views,
      uniqueViews: article.uniqueViews,
      likes: article.likes,
      engagementScore: article.engagementScore,
      isUniqueView
    });
    
  } catch (error) {
    console.error('View tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get view statistics for an article
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const articleId = params.id;
    
    const article = await Article.findById(articleId).select('views uniqueViews likes shares engagementScore');
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    
    // Get view analytics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const viewAnalytics: any[] = [];
    
    return NextResponse.json({
      views: article.views || 0,
      uniqueViews: article.uniqueViews || 0,
      likes: article.likes || 0,
      shares: article.shares || 0,
      engagementScore: article.engagementScore || 0,
      dailyAnalytics: viewAnalytics
    });
    
  } catch (error) {
    console.error('View analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
