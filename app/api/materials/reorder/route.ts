import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { canAccessAdmin } from '@/lib/auth/permissions';
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

const rlh = (r: Response, h: Record<string, string>) => { for (const [k,v] of Object.entries(h)) r.headers.set(k,v); return r }

export async function PATCH(request: NextRequest) {
  try {
    const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'write', endpoint: '/api/materials/reorder' })
    if (!rlResult.allowed) {
      return errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    }
    const session = await getServerSession();
    
    if (!session || !canAccessAdmin(session)) {
      return errorResponse('İcazəsiz giriş - Admin girişi tələb olunur', "API_ERROR", {}, 401)
    }

    const supabase = createSupabaseAdminClient();

    const { updates } = await request.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return errorResponse('Yeniləmələr massivi tələb olunur', "API_ERROR", {}, 400)
    }

    // Validate updates structure
    for (const update of updates) {
      if (!update.id || typeof update.order !== 'number') {
        return errorResponse('Hər yeniləmədə id və order olmalıdır', "API_ERROR", {}, 400)
      }
    }

    const updatePromises = updates.map(({ id, order }) =>
      supabase.from('materials').update({ order }).eq('id', id).select('*').single()
    );

    const updatedMaterials = await Promise.all(updatePromises);
    const materials = updatedMaterials
      .filter(result => !result.error)
      .map(result => result.data);

    return successResponse({ success: true, count: materials.length, materials })

  } catch (error: any) {
    console.error('Error updating material order:', error);
    return errorResponse(error.message || 'Material sırası yenilənə bilmədi', "API_ERROR", {}, 500)
  }
}
