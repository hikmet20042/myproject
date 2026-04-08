import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { cache, generateCacheKey, withCache } from '@/lib/cache'
import { isApprovedOrganization } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic'

async function ensureUserRow(
  supabase: any,
  session: Awaited<ReturnType<typeof getServerSession>>
) {
  if (!session?.user?.id) return null

  const { data: existingUser } = await supabase
    .from('users')
    .select('id, created_at, updated_at')
    .eq('id', session.user.id)
    .maybeSingle()

  if (existingUser) return existingUser

  const { data: createdUser, error: createError } = await supabase
    .from('users')
    .upsert(
      {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || session.user.email || 'User',
        role: session.user.role || 'user',
      },
      { onConflict: 'id' }
    )
    .select('id, created_at, updated_at')
    .single()

  if (createError) {
    console.error('Profile stats auto-create user failed:', createError);
    return null
  }

  return createdUser
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    console.log('Profile Stats GET - Session:', { userId: session?.user?.id, email: session?.user?.email, role: session?.user?.role });
    
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401);
    }
    
    // Redirect organization users - they should use organization-specific endpoints
    if (isApprovedOrganization(session)) {
      return errorResponse('Organization stats should use /api/organization/stats endpoint', "API_ERROR", {}, 400);
    }
    
    const user = await ensureUserRow(supabase, session)
    if (!user) {
      return errorResponse('User not found', "API_ERROR", {}, 404);
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
          .select('id, status')
          .eq('author_id', session.user.id);

        const blogRows = blogs || [];
        const approvedStories = blogRows.filter(blog => blog.status === 'approved').length;
        const blogIds = blogRows.map((blog: any) => blog.id).filter(Boolean);

        let totalViews = 0;
        let totalUniqueViews = 0;
        let totalLikes = 0;
        let totalSaves = 0;

        if (blogIds.length > 0) {
          const [viewsCountRes, likesCountRes, savesCountRes] = await Promise.all([
            supabase
              .from('blog_views')
              .select('*', { count: 'exact', head: true })
              .in('blog_id', blogIds),
            supabase
              .from('blog_reactions')
              .select('*', { count: 'exact', head: true })
              .in('blog_id', blogIds)
              .eq('reaction_type', 'like'),
            supabase
              .from('content_saves')
              .select('*', { count: 'exact', head: true })
              .eq('content_type', 'blog')
              .in('content_id', blogIds),
          ]);

          if (viewsCountRes.error || likesCountRes.error || savesCountRes.error) {
            return errorResponse('Failed to fetch profile stats', 'FETCH_PROFILE_STATS_FAILED', {}, 500);
          }
          totalViews = viewsCountRes.count || 0;
          totalUniqueViews = viewsCountRes.count || 0;
          totalLikes = likesCountRes.count || 0;
          totalSaves = savesCountRes.count || 0;
        }

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
          totalSaves,

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

    return successResponse({ stats: cachedStats });
  } catch (error) {
    console.error('Profile stats error:', error);
    return errorResponse('Internal server error', "API_ERROR", {}, 500);
  }
}
