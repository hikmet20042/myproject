import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { cache, generateCacheKey, withCache } from '@/lib/cache'
import { isApprovedOrganization } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

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
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'authenticatedRead',
      endpoint: '/api/users/profile/stats',
    })

    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    console.log('Profile Stats GET - Session:', { userId: session?.user?.id, email: session?.user?.email, role: session?.user?.role });
    
    if (!session?.user?.id) {
      const response = errorResponse('İcazəsiz giriş', "API_ERROR", {}, 401);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }
    
    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMITED', {}, 429);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    if (session.user.accountType === 'organization') {
      const response = errorResponse('Təşkilat hesabları istifadəçi profil statistikasına daxil ola bilməz. Bunun əvəzinə /api/organization/stats istifadə edin.', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const user = await ensureUserRow(supabase, session)
    if (!user) {
      const response = errorResponse('İstifadəçi tapılmadı', "API_ERROR", {}, 404);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const cacheKey = generateCacheKey.userStats(session.user.id);
    
    const cachedStats = await withCache(
      cache.userStats,
      cacheKey,
      async () => {
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
        let totalDislikes = 0;
        let totalSaves = 0;

        if (blogIds.length > 0) {
          const [viewsCountRes, uniqueViewsCountRes, likesCountRes, dislikesCountRes, savesCountRes] = await Promise.all([
            supabase
              .from('blog_views')
              .select('*', { count: 'exact', head: true })
              .in('blog_id', blogIds),
            supabase
              .rpc('count_distinct_blog_views', { p_blog_ids: blogIds }),
            supabase
              .from('blog_reactions')
              .select('*', { count: 'exact', head: true })
              .in('blog_id', blogIds)
              .eq('reaction_type', 'like'),
            supabase
              .from('blog_reactions')
              .select('*', { count: 'exact', head: true })
              .in('blog_id', blogIds)
              .eq('reaction_type', 'dislike'),
            supabase
              .from('content_saves')
              .select('*', { count: 'exact', head: true })
              .eq('content_type', 'blog')
              .in('content_id', blogIds),
          ]);

          if (viewsCountRes.error || likesCountRes.error || savesCountRes.error) {
            return errorResponse('Profil statistikası yüklənə bilmədi', 'FETCH_PROFILE_STATS_FAILED', {}, 500);
          }
          totalViews = viewsCountRes.count || 0;
          totalUniqueViews = uniqueViewsCountRes.data || 0;
          totalLikes = likesCountRes.count || 0;
          totalDislikes = dislikesCountRes.count || 0;
          totalSaves = savesCountRes.count || 0;
        }

        const [{ data: userEvents }, { data: userVacancies }] = await Promise.all([
          supabase
            .from('events')
            .select('id')
            .or(`created_by.eq.${session.user.id},created_by_organization.eq.${session.user.id}`),
          supabase
            .from('vacancies')
            .select('id')
            .or(`created_by.eq.${session.user.id},created_by_organization.eq.${session.user.id}`),
        ]);

        const eventIds = (userEvents || []).map((e: any) => e.id).filter(Boolean);
        const vacancyIds = (userVacancies || []).map((v: any) => v.id).filter(Boolean);

        if (eventIds.length > 0) {
          const [eventViewsRes, eventUniqueViewsRes, eventSavesRes] = await Promise.all([
            supabase
              .from('content_views')
              .select('*', { count: 'exact', head: true })
              .eq('content_type', 'event')
              .in('content_id', eventIds),
            supabase
              .rpc('count_distinct_content_views', { p_content_type: 'event', p_content_ids: eventIds }),
            supabase
              .from('content_saves')
              .select('*', { count: 'exact', head: true })
              .eq('content_type', 'event')
              .in('content_id', eventIds),
          ]);

          if (eventViewsRes.error) {
            return errorResponse('Tədbir baxışları yüklənə bilmədi', 'FETCH_EVENT_VIEWS_FAILED', {}, 500);
          }
          totalViews += eventViewsRes.count || 0;
          totalUniqueViews += eventUniqueViewsRes.data || 0;
          totalSaves += eventSavesRes.count || 0;
        }

        if (vacancyIds.length > 0) {
          const [vacancyViewsRes, vacancyUniqueViewsRes, vacancySavesRes] = await Promise.all([
            supabase
              .from('content_views')
              .select('*', { count: 'exact', head: true })
              .eq('content_type', 'vacancy')
              .in('content_id', vacancyIds),
            supabase
              .rpc('count_distinct_content_views', { p_content_type: 'vacancy', p_content_ids: vacancyIds }),
            supabase
              .from('content_saves')
              .select('*', { count: 'exact', head: true })
              .eq('content_type', 'vacancy')
              .in('content_id', vacancyIds),
          ]);

          if (vacancyViewsRes.error) {
            return errorResponse('Vakansiya baxışları yüklənə bilmədi', 'FETCH_VACANCY_VIEWS_FAILED', {}, 500);
          }
          totalViews += vacancyViewsRes.count || 0;
          totalUniqueViews += vacancyUniqueViewsRes.data || 0;
          totalSaves += vacancySavesRes.count || 0;
        }

        const recentActivity: string[] = [];

    const totalWordCount = 0;

    const activityDates = recentActivity.map(item =>
      new Date(item).toDateString()
    );
    const uniqueActivityDays = Array.from(new Set(activityDates)).length;

    let writingStreak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();

      if (activityDates.includes(dateString)) {
        writingStreak++;
      } else if (i > 0) {
        break;
      }
    }

    const productivityScore = 0;

    const achievements = [];

    if (writingStreak >= 7) {
      achievements.push({
        id: 'consistent_writer',
        name: 'Davamlı Yazar',
        description: '7+ gün ardıcıl aktiv',
        icon: '🔥',
        category: 'consistency',
        unlockedAt: new Date()
      });
    }

    if (totalLikes >= 50) {
      achievements.push({
        id: 'popular_writer',
        name: 'Populyar Yazar',
        description: 'Bütün məzmunlarda 50+ bəyənmə aldı',
        icon: '⭐',
        category: 'engagement',
        unlockedAt: new Date()
      });
    }

    if (totalViews >= 1000) {
      achievements.push({
        id: 'viral_content',
        name: 'Viral Məzmun',
        description: '1000+ ümumi baxışa çatdı',
        icon: '🚀',
        category: 'engagement',
        unlockedAt: new Date()
      });
    }

        return {
          totalBlogs: blogRows.length || 0,
          totalStories: approvedStories || 0,

          totalViews,
          totalUniqueViews,
          totalLikes,
          totalDislikes,
          totalSaves,

          joinedDate: user.created_at,
          lastActive: user.updated_at,

          writingStreak,
          totalWordCount,
          productivityScore,

          avgEngagementRate: totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(2) : 0,

          contentByStatus: {
            approved: approvedStories || 0,
            pending: 0,
            rejected: 0
          },

          recentActivityCount: recentActivity.length,
          lastContentUpdate: recentActivity[0] || null,

          achievements
        };
      }
    );

    const response = successResponse({ stats: cachedStats });
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  } catch (error) {
    console.error('Profile stats error:', error);
    const response = errorResponse('Daxili server xətası', "API_ERROR", {}, 500);
    return response;
  }
}
