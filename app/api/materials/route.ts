import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

// GET: Fetch all materials (with optional filters)
export async function GET(request: Request) {
  const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
    request,
    preset: 'publicRead',
    endpoint: '/api/materials',
  })

  if (!rateLimitResult.allowed) {
    const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMITED', {}, 429)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }

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
      const response = errorResponse('Failed to fetch materials', "API_ERROR", {}, 500);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response;
    }

    const total = count || 0;

    const response = successResponse({
      materials,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response;
  } catch (error: any) {
    console.error('Error fetching materials:', error);
    const response = errorResponse('Failed to fetch materials', "API_ERROR", {}, 500);
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response;
  }
}

// POST: Create new material (Admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session || session.user?.role !== 'admin') {
      return errorResponse('Unauthorized. Admin access required.', "API_ERROR", {}, 403);
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
      return errorResponse('Missing required fields: title, description, category, type, and url', "API_ERROR", {}, 400);
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
      return errorResponse('Failed to create material', "API_ERROR", {}, 500);
    }

    return successResponse({ message: 'Material created successfully', material }, {}, 201);
  } catch (error: any) {
    console.error('Error creating material:', error);
    return errorResponse('Failed to create material', "API_ERROR", {}, 500);
  }
}
