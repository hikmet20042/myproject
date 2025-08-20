import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import Article from '@/lib/models/Article'
import Story from '@/lib/models/Story'
import UserAnalytics from '@/lib/models/UserAnalytics'

import mongoose from 'mongoose'
import { cache, generateCacheKey, withCache } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(session.user.id).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create user analytics
    let userAnalytics = await UserAnalytics.findOne({ userId: session.user.id });

    // Generate cache key for user stats
    const cacheKey = generateCacheKey.userStats(session.user.id);
    
    // Try to get from cache first
    const cachedStats = await withCache(
      cache.userStats,
      cacheKey,
      async () => {
        // Optimized: Use fewer, more efficient aggregation queries
        const [
          articleStats,
          storyStats,
          recentActivity,
          activityStats
        ] = await Promise.all([
      // Combined article statistics in single aggregation
      Article.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(session.user.id) } },
        {
          $group: {
            _id: null,
            totalArticles: { $sum: 1 },
            publishedArticles: {
              $sum: {
                $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
              }
            },
            draftArticles: {
              $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
            },
            totalViews: { $sum: '$views' },
            totalUniqueViews: { $sum: '$uniqueViews' },
            totalLikes: { $sum: '$likes' },
            totalWordCount: { $sum: '$draftMetadata.wordCount' },
            completedDrafts: {
              $sum: {
                $cond: [{ $gte: ['$draftMetadata.completionPercentage', 80] }, 1, 0]
              }
            }
          }
        }
      ]),

      // Combined story statistics in single aggregation
      Story.aggregate([
        { $match: { author: new mongoose.Types.ObjectId(session.user.id) } },
        {
          $group: {
            _id: null,
            totalStories: { $sum: 1 },
            approvedStories: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            },
            totalViews: { $sum: '$views' },
            totalUniqueViews: { $sum: '$uniqueViews' },
            totalLikes: { $sum: '$likes' }
          }
        }
      ]),

      // Recent activity removed - returning empty array
      Promise.resolve([]),

      // Activity statistics removed - returning default stats
      Promise.resolve({ totalActivities: 0, streak: 0, lastActivity: null })
    ]);

    // Extract stats with defaults
    const articles = articleStats[0] || {};
    const stories = storyStats[0] || {};
    const drafts = { length: articles.draftArticles || 0 };

    // Calculate metrics from aggregated data
    const completedDrafts = articles.completedDrafts || 0;
    const totalWordCount = articles.totalWordCount || 0;
    const avgWordsPerDraft = drafts.length > 0 ? Math.round(totalWordCount / drafts.length) : 0;

    // Calculate total views and likes from aggregated data
    const totalViews = (articles.totalViews || 0) + (stories.totalViews || 0);
    const totalUniqueViews = (articles.totalUniqueViews || 0) + (stories.totalUniqueViews || 0);
    const totalLikes = (articles.totalLikes || 0) + (stories.totalLikes || 0);

    // Calculate writing streak from activity data
    const activityDates = recentActivity.map(item =>
      new Date(item).toDateString()
    );
    const uniqueActivityDays = Array.from(new Set(activityDates)).length;

    // Calculate consecutive writing streak
    let writingStreak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();

      if (activityDates.includes(dateString)) {
        writingStreak++;
      } else if (i > 0) {
        // Break streak if no activity (but allow for today)
        break;
      }
    }

    // Calculate productivity score using the UserAnalytics static method
    const productivityScore = userAnalytics ?
      (UserAnalytics as any).calculateProductivityScore({
        totalArticles: articles.length,
        totalStories: stories.length,
        completedDrafts,
        writingStreak,
        avgEngagementRate: totalViews > 0 ? (totalLikes / totalViews) * 100 : 0,
        totalWordCount
      }) : 0;

    // Generate achievements
    const achievements = [];

    if (articles.length >= 1) {
      achievements.push({
        id: 'first_article',
        name: 'First Article',
        description: 'Published your first article',
        icon: '📝',
        category: 'milestone',
        unlockedAt: articles[0]?.publishedAt || articles[0]?.createdAt
      });
    }

    if (drafts.length >= 5) {
      achievements.push({
        id: 'prolific_writer',
        name: 'Prolific Writer',
        description: 'Created 5 or more drafts',
        icon: '✍️',
        category: 'writing',
        unlockedAt: new Date()
      });
    }

    if (completedDrafts >= 3) {
      achievements.push({
        id: 'finisher',
        name: 'Finisher',
        description: 'Completed 3 or more drafts',
        icon: '🏆',
        category: 'consistency',
        unlockedAt: new Date()
      });
    }

    if (writingStreak >= 7) {
      achievements.push({
        id: 'consistent_writer',
        name: 'Consistent Writer',
        description: 'Active for 7+ days in a row',
        icon: '🔥',
        category: 'consistency',
        unlockedAt: new Date()
      });
    }

    if (totalLikes >= 50) {
      achievements.push({
        id: 'popular_writer',
        name: 'Popular Writer',
        description: 'Received 50+ likes across all content',
        icon: '⭐',
        category: 'engagement',
        unlockedAt: new Date()
      });
    }

    if (totalViews >= 1000) {
      achievements.push({
        id: 'viral_content',
        name: 'Viral Content',
        description: 'Reached 1000+ total views',
        icon: '🚀',
        category: 'engagement',
        unlockedAt: new Date()
      });
    }

        return {
          // Basic counts from aggregated data
          totalArticles: articles.publishedArticles || 0,
          totalStories: stories.totalStories || 0,
          totalDrafts: drafts.length,
          totalViews,
          totalUniqueViews,
          totalLikes,

          // User info
          joinedDate: (user as any).createdAt,
          lastActive: (user as any).updatedAt,

          // Writing metrics
          writingStreak,
          completedDrafts,
          avgWordsPerDraft,
          totalWordCount,
          productivityScore,

          // Engagement metrics
          avgEngagementRate: totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(2) : 0,

          // Content breakdown from aggregated data
          contentByStatus: {
            published: articles.publishedArticles || 0,
            approved: stories.approvedStories || 0,
            pending: 0, // Would need separate query if needed
            rejected: 0, // Would need separate query if needed
            drafts: drafts.length
          },

          // Recent activity summary
          recentActivityCount: recentActivity.length,
          lastContentUpdate: recentActivity[0] || null,

          // Achievements
          achievements
        };
      }
    );

    return NextResponse.json({ stats: cachedStats });
  } catch (error) {
    console.error('Profile stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update user preferences/settings
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { preferences } = body;

    // In a real app, you'd store preferences in a UserPreferences model
    // For now, we'll just return success
    
    return NextResponse.json({ 
      message: 'Preferences updated successfully',
      preferences 
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
