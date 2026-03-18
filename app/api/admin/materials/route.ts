import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Fetch all materials for admin (including unpublished)
export async function GET(request: Request) {
  try {
    const session = await getServerSession();

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query - NO isPublished filter for admin
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

    // Fetch materials
    const { data: materials, error, count: total } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch materials', details: error.message },
        { status: 500 }
      );
    }

    const [publishedResult, featuredResult] = await Promise.all([
      supabase.from('materials').select('id', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('materials').select('id', { count: 'exact', head: true }).eq('featured', true)
    ])
    const published = publishedResult.count || 0
    const featured = featuredResult.count || 0
    const totalCount = total || 0
    const unpublished = Math.max(totalCount - published, 0)

    return NextResponse.json({
      materials,
      page,
      totalPages: Math.ceil(totalCount / limit),
      total: totalCount,
      stats: {
        total: totalCount,
        published,
        unpublished,
        featured
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials', details: error.message },
      { status: 500 }
    );
  }
}
