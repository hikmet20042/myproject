import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// GET: Fetch all materials (with optional filters)
export async function GET(request: Request) {
  try {
    const supabase = createSupabaseAdminClient();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query
    let query = supabase
      .from('materials')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('order', { ascending: true })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, (page - 1) * limit + limit - 1);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch materials
    const { data: materials, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch materials', details: error.message },
        { status: 500 }
      );
    }

    const total = count || 0;

    return NextResponse.json({
      materials,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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

// POST: Create new material (Admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const body = await request.json();
    const {
      title,
      description,
      category,
      type,
      url,
      imageUrl,
      provider,
      duration,
      language,
      tags,
      featured,
      isPublished,
      order
    } = body;

    // Validate required fields
    if (!title || !description || !category || !type || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, category, type, url' },
        { status: 400 }
      );
    }

    // Create material
    const { data: material, error } = await supabase
      .from('materials')
      .insert({
        title,
        description,
        category,
        type,
        url,
        image_url: imageUrl || null,
        provider,
        duration,
        language: language || ['English'],
        tags: tags || [],
        featured: featured || false,
        is_published: isPublished !== undefined ? isPublished : true,
        order: order || 0,
        created_by: session.user.id
      })
      .select('*')
      .single();

    if (error || !material) {
      return NextResponse.json(
        { error: 'Failed to create material', details: error?.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Material created successfully', material },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating material:', error);
    return NextResponse.json(
      { error: 'Failed to create material', details: error.message },
      { status: 500 }
    );
  }
}
