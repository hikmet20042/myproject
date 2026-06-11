import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Fetch all materials for admin (including unpublished)
export async function GET(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = await applyRateLimit({
      request,
      preset: 'admin',
      endpoint: '/api/admin/materials',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const session = await getServerSession();

    if (!session || session.user?.role !== 'admin') {
      const response = errorResponse('İcazəsiz giriş. Admin girişi tələb olunur.', "API_ERROR", {}, 403)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const supabase = createSupabaseAdminClient();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    let query = supabase
      .from('materials')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, (page - 1) * limit + limit - 1);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,provider.ilike.%${search}%`);
    }

    const { data: materials, error, count: total } = await query;

    if (error) {
      const response = errorResponse('Materiallar yüklənə bilmədi', "API_ERROR", {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const [publishedResult, featuredResult] = await Promise.all([
      supabase.from('materials').select('id', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('materials').select('id', { count: 'exact', head: true }).eq('featured', true)
    ])
    const published = publishedResult.count || 0
    const featured = featuredResult.count || 0
    const totalCount = total || 0
    const unpublished = Math.max(totalCount - published, 0)

    const response = successResponse({
      materials,
      page,
      totalPages: Math.ceil(totalCount / limit),
      total: totalCount,
      stats: { total: totalCount, published, unpublished, featured },
      pagination: { page, limit, total: totalCount, pages: Math.ceil(totalCount / limit) }
    })
    for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
    return response
  } catch (error: any) {
    console.error('Error fetching materials:', error);
    return errorResponse('Materiallar yüklənə bilmədi', "API_ERROR", {}, 500);
  }
}
