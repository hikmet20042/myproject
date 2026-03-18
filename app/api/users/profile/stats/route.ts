import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { cache, generateCacheKey, withCache } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    console.log('Profile Stats GET - Session:', { userId: session?.user?.id, email: session?.user?.email, role: session?.user?.role });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Redirect organization users - they should use organization-specific endpoints
    if (session.user.isApprovedOrganization) {
      return NextResponse.json({ 
        error: 'Organization stats should use /api/organization/stats endpoint',
        redirect: '/api/organization/stats'
      }, { status: 400 });
    }
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, created_at, updated_at')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate cache key for user stats
    const cacheKey = generateCacheKey.userStats(session.user.id);
    
    // Try to get from cache first
    const cachedStats = await withCache(
      cache.userStats,
      cacheKey,
      async () => {
        // Optimized: Use fewer, more efficient aggregation queries
        const { data: blogs } = await supabase
          .from('blogs')
          .select('status, views, unique_views, likes')
          .eq('author_id', session.user.id);

        const blogRows = blogs || [];
        const approvedStories = blogRows.filter(blog => blog.status === 'approved').length;
        const totalViews = blogRows.reduce((sum, blog) => sum + (blog.views || 0), 0);
        const totalUniqueViews = blogRows.reduce((sum, blog) => sum + (blog.unique_views || 0), 0);
        const totalLikes = blogRows.reduce((sum, blog) => sum + (blog.likes || 0), 0);

        const recentActivity: string[] = [];

    // Calculate metrics from aggregated data
    const totalWordCount = 0;

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
    const productivityScore = 0;

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
          totalStories: approvedStories || 0,
          
          totalViews,
          totalUniqueViews,
          totalLikes,

          // User info
          joinedDate: user.created_at,
          lastActive: user.updated_at,

          // Writing metrics
          writingStreak,
          totalWordCount,
          productivityScore,

          // Engagement metrics
          avgEngagementRate: totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(2) : 0,

          // Content breakdown from aggregated data
          contentByStatus: {
            approved: approvedStories || 0,
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
