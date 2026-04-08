import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { canAccessAdmin } from '@/lib/auth/permissions';
import { successResponse, errorResponse } from '@/lib/apiResponse'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !canAccessAdmin(session)) {
      return errorResponse('Unauthorized - Admin access required', "API_ERROR", {}, 401);
    }

    const supabase = createSupabaseAdminClient();

    const { updates } = await request.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return errorResponse('Updates array is required', "API_ERROR", {}, 400);
    }

    // Validate updates structure
    for (const update of updates) {
      if (!update.id || typeof update.order !== 'number') {
        return errorResponse('Each update must have id and order', "API_ERROR", {}, 400);
      }
    }

    const updatePromises = updates.map(({ id, order }) =>
      supabase.from('materials').update({ order }).eq('id', id).select('*').single()
    );

    const updatedMaterials = await Promise.all(updatePromises);
    const materials = updatedMaterials
      .filter(result => !result.error)
      .map(result => result.data);

    return successResponse({
      success: true,
      count: materials.length,
      materials
    });

  } catch (error: any) {
    console.error('Error updating material order:', error);
    return errorResponse(error.message || 'Failed to update material order', "API_ERROR", {}, 500);
  }
}
