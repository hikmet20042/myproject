import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import NGO from '@/lib/models/NGO'
import Blog from '@/lib/models/Blog'
import UserAnalytics from '@/lib/models/UserAnalytics'

import mongoose from 'mongoose'
import { cache, generateCacheKey, withCache } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    console.log('Profile Stats GET - Session:', { userId: session?.user?.id, email: session?.user?.email, role: session?.user?.role });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Redirect NGO users - they should use NGO-specific endpoints
    if (session.user.isApprovedNGO) {
      return NextResponse.json({ 
        error: 'NGO stats should use /api/ngo/stats endpoint',
        redirect: '/api/ngo/stats'
      }, { status: 400 });
    }
    
    const user = await User.findById(session.user.id);
    
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
          storyStats,
          recentActivity,
          activityStats
        ] = await Promise.all([
      // Combined blog statistics in single aggregation
      Blog.aggregate([
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
    const blogs = storyStats[0] || {};

    // Calculate metrics from aggregated data
    const totalWordCount = 0;

    // Calculate total views and likes from aggregated data
    const totalViews = blogs.totalViews || 0;
    const totalUniqueViews = blogs.totalUniqueViews || 0;
    const totalLikes = blogs.totalLikes || 0;

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
        
        totalStories: blogs.length,
        writingStreak,
        avgEngagementRate: totalViews > 0 ? (totalLikes / totalViews) * 100 : 0,
        totalWordCount
      }) : 0;

    // Generate achievements
    const achievements = [];

    // Removed first article achievement

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
          totalStories: blogs.approvedStories || 0,
          
          totalViews,
          totalUniqueViews,
          totalLikes,

          // User info
          joinedDate: (user as any).createdAt,
          lastActive: (user as any).updatedAt,

          // Writing metrics
          writingStreak,
          totalWordCount,
          productivityScore,

          // Engagement metrics
          avgEngagementRate: totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(2) : 0,

          // Content breakdown from aggregated data
          contentByStatus: {
            approved: blogs.approvedStories || 0,
            pending: 0, // Would need separate query if needed
            rejected: 0 // Would need separate query if needed
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
