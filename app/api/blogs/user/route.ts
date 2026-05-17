import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { getBlogStats } from '@/lib/blogStats';
import { applyRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'authenticatedRead',
      endpoint: '/api/blogs/user',
    })

    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session?.user?.id) {
      const response = errorResponse('Unauthorized', 'AUTH_REQUIRED', {}, 401);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMITED', {}, 429);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    let query = supabase
      .from('blogs')
      .select('*')
      .eq('author_id', session.user.id)
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data: blogs, error } = await query;
    if (error) {
      console.error('GET /api/blogs/user query error:', error);
      const response = errorResponse('Failed to fetch user blogs', 'FETCH_USER_BLOGS_FAILED', {}, 500);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }
    const rows = blogs || []
    const itemsWithStats = await Promise.all(
      rows.map(async (blog: any) => {
        const stats = await getBlogStats(supabase, blog.id, session.user.id)
        
        const { count: savesCount } = await supabase
          .from('content_saves')
          .select('*', { count: 'exact', head: true })
          .eq('content_type', 'blog')
          .eq('content_id', blog.id)
          
        return { ...blog, ...stats, saves: savesCount || 0 }
      })
    )
    const response = successResponse({ items: itemsWithStats });
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  } catch (error) {
    console.error('GET /api/blogs/user error:', error);
    const response = errorResponse('Failed to fetch user blogs', 'FETCH_USER_BLOGS_FAILED', {}, 500);
    return response;
  }
}
