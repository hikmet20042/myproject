import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'
import { isValidUUID } from '@/lib/utils'

const rlh = (r: Response, h: Record<string, string>) => { for (const [k,v] of Object.entries(h)) r.headers.set(k,v); return r }

// GET: Fetch single material by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'publicRead', endpoint: '/api/materials/[id]' })
    if (!rlResult.allowed) {
      return rlh(errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429), rlHeaders)
    }

    if (!isValidUUID(params.id)) {
      return rlh(errorResponse('Yanlış material ID-si', "API_ERROR", {}, 400), rlHeaders)
    }

    const supabase = createSupabaseAdminClient();

    const { data: material, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !material) {
      return rlh(errorResponse('Material tapılmadı', "API_ERROR", {}, 404), rlHeaders)
    }

    // Increment view count
    await supabase
      .from('materials')
      .update({ views: (material.views || 0) + 1 })
      .eq('id', params.id);

    return rlh(successResponse({ material }), rlHeaders)
  } catch (error: any) {
    console.error('Error fetching material:', error);
    const r = errorResponse('Material yüklənə bilmədi', "API_ERROR", {}, 500)
    for (const [k,v] of Object.entries({} as Record<string, string>)) r.headers.set(k,v)
    return r
  }
}

// PUT: Update material (Admin only)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'admin', endpoint: '/api/materials/[id]' })
    if (!rlResult.allowed) {
      return rlh(errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429), rlHeaders)
    }

    if (!isValidUUID(params.id)) {
      return rlh(errorResponse('Yanlış material ID-si', "API_ERROR", {}, 400), rlHeaders)
    }

    const session = await getServerSession();

    if (!session || session.user?.role !== 'admin') {
      return rlh(errorResponse('İcazəsiz giriş. Admin girişi tələb olunur.', "API_ERROR", {}, 403), rlHeaders)
    }

    const supabase = createSupabaseAdminClient();

    const body = await request.json();

    const ALLOWED_FIELDS = ['title', 'description', 'category', 'type', 'url', 'imageUrl', 'provider', 'duration', 'language', 'tags', 'featured', 'isPublished', 'order'];
    const updateData: any = {};
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        if (field === 'imageUrl') {
          updateData.image_url = body[field];
        } else if (field === 'isPublished') {
          updateData.is_published = body[field];
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const { data: material, error } = await supabase
      .from('materials')
      .update(updateData)
      .eq('id', params.id)
      .select('*')
      .single();

    if (error || !material) {
      return rlh(errorResponse('Material tapılmadı', "API_ERROR", {}, 404), rlHeaders)
    }

    return rlh(successResponse({ message: 'Material uğurla yeniləndi', material }), rlHeaders)
  } catch (error: any) {
    console.error('Error updating material:', error);
    return rlh(errorResponse('Material yenilənə bilmədi', "API_ERROR", {}, 500), {} as Record<string, string>)
  }
}

// DELETE: Delete material (Admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'admin', endpoint: '/api/materials/[id]' })
    if (!rlResult.allowed) {
      return rlh(errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429), rlHeaders)
    }

    if (!isValidUUID(params.id)) {
      return rlh(errorResponse('Yanlış material ID-si', "API_ERROR", {}, 400), rlHeaders)
    }

    const session = await getServerSession();

    if (!session || session.user?.role !== 'admin') {
      return rlh(errorResponse('İcazəsiz giriş. Admin girişi tələb olunur.', "API_ERROR", {}, 403), rlHeaders)
    }

    const supabase = createSupabaseAdminClient();

    const { data: material, error } = await supabase
      .from('materials')
      .delete()
      .eq('id', params.id)
      .select('*')
      .single();

    if (error || !material) {
      return rlh(errorResponse('Material tapılmadı', "API_ERROR", {}, 404), rlHeaders)
    }

    return rlh(successResponse({ message: 'Material uğurla silindi' }), rlHeaders)
  } catch (error: any) {
    console.error('Error deleting material:', error);
    return rlh(errorResponse('Material silinə bilmədi', "API_ERROR", {}, 500), {} as Record<string, string>)
  }
}
