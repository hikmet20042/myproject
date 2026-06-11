import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canAccessAdmin } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'
import { isValidUUID } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// DELETE /api/admin/organizations/[id] - Delete organization registration permanently
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { result: rateLimitResult, headers: rateLimitHeaders } = await applyRateLimit({
    request,
    preset: 'admin',
    endpoint: '/api/admin/organizations/[id]',
  })
  try {
    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const supabase = createSupabaseAdminClient()
    
    if (!isValidUUID(params.id)) {
      const response = errorResponse('Yanlış təşkilat ID-si', "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }
    
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

    const { error: profileDeleteError } = await supabase
      .from('organization_profiles')
      .delete()
      .eq('account_id', params.id)

    if (profileDeleteError) {
      console.error('Failed to delete organization profile:', profileDeleteError)
      const response = errorResponse('Təşkilat profili silinə bilmədi', "API_ERROR", {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const { error: userDeleteError } = await supabase.auth.admin.deleteUser(params.id)
    if (userDeleteError) {
      console.error('Failed to delete auth user:', userDeleteError)
      const response = errorResponse('Təşkilat istifadəçisi silinə bilmədi', "API_ERROR", {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }
    
    const response = successResponse({ message: 'Təşkilat uğurla silindi' })
    for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
    return response
  } catch (error) {
    console.error('DELETE /api/admin/organizations/[id] error:', error)
    const r = errorResponse('Təşkilat silinə bilmədi', "API_ERROR", {}, 500)
    for (const [k,v] of Object.entries(rateLimitHeaders)) r.headers.set(k,v)
    return r
  }
}
