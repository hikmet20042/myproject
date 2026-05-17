import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

const rlh = (r: Response, h: Record<string, string>) => { for (const [k,v] of Object.entries(h)) r.headers.set(k,v); return r }

// GET: Fetch single material by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'publicRead', endpoint: '/api/materials/[id]' })
    if (!rlResult.allowed) {
      return errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    }
    const supabase = createSupabaseAdminClient();

    const { data: material, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !material) {
      return errorResponse('Material not found', "API_ERROR", {}, 404)
    }

    // Increment view count
    await supabase
      .from('materials')
      .update({ views: (material.views || 0) + 1 })
      .eq('id', params.id);

    return successResponse({ material })
  } catch (error: any) {
    console.error('Error fetching material:', error);
    return errorResponse('Failed to fetch material', "API_ERROR", {}, 500)
  }
}

// PUT: Update material (Admin only)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'publicRead', endpoint: '/api/materials/[id]' })
    if (!rlResult.allowed) {
      return errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    }
    const session = await getServerSession();

    if (!session || session.user?.role !== 'admin') {
      return errorResponse('Unauthorized. Admin access required.', "API_ERROR", {}, 403)
    }

    const supabase = createSupabaseAdminClient();

    const body = await request.json();

    // Update material
    const updateData: any = { ...body };
    if (updateData.imageUrl !== undefined) {
      updateData.image_url = updateData.imageUrl;
      delete updateData.imageUrl;
    }
    if (updateData.isPublished !== undefined) {
      updateData.is_published = updateData.isPublished;
      delete updateData.isPublished;
    }
    if (updateData.order !== undefined) {
      updateData.order = updateData.order;
    }

    const { data: material, error } = await supabase
      .from('materials')
      .update(updateData)
      .eq('id', params.id)
      .select('*')
      .single();

    if (error || !material) {
      return errorResponse('Material not found', "API_ERROR", {}, 404)
    }

    return successResponse({ message: 'Material updated successfully', material })
  } catch (error: any) {
    console.error('Error updating material:', error);
    return errorResponse('Failed to update material', "API_ERROR", {}, 500)
  }
}

// DELETE: Delete material (Admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'publicRead', endpoint: '/api/materials/[id]' })
    if (!rlResult.allowed) {
      return errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    }
    const session = await getServerSession();

    if (!session || session.user?.role !== 'admin') {
      return errorResponse('Unauthorized. Admin access required.', "API_ERROR", {}, 403)
    }

    const supabase = createSupabaseAdminClient();

    const { data: material, error } = await supabase
      .from('materials')
      .delete()
      .eq('id', params.id)
      .select('*')
      .single();

    if (error || !material) {
      return errorResponse('Material not found', "API_ERROR", {}, 404)
    }

    return successResponse({ message: 'Material deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting material:', error);
    return errorResponse('Failed to delete material', "API_ERROR", {}, 500)
  }
}
