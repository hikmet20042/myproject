import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canAccessAdmin } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

// DELETE /api/admin/organizations/[id] - Delete organization registration permanently
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'admin',
      endpoint: '/api/admin/organizations/[id]',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const supabase = createSupabaseAdminClient()
    
    const session = await getServerSession()
    if (!session || !canAccessAdmin(session)) {
      const response = errorResponse('Admin girişi tələb olunur', "API_ERROR", {}, 403)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }
    
    const { data: profile } = await supabase
      .from('organization_profiles')
      .select('account_id')
      .eq('account_id', params.id)
      .maybeSingle()

    if (!profile) {
      const response = errorResponse('Təşkilat tapılmadı', "API_ERROR", {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    await supabase
      .from('organization_profiles')
      .delete()
      .eq('account_id', params.id)

    await supabase.auth.admin.deleteUser(params.id)
    
    const response = successResponse({ message: 'Təşkilat uğurla silindi' })
    for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
    return response
  } catch (error) {
    console.error('DELETE /api/admin/organizations/[id] error:', error)
    return errorResponse('Təşkilat silinə bilmədi', "API_ERROR", {}, 500)
  }
}
