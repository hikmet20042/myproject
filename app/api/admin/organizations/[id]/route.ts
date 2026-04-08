import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canAccessAdmin } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic'

// DELETE /api/admin/organizations/[id] - Delete organization registration permanently
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    
    const session = await getServerSession()
    if (!session || !canAccessAdmin(session)) {
      return errorResponse('Admin access required', "API_ERROR", {}, 403)
    }
    
    const { data: profile } = await supabase
      .from('organization_profiles')
      .select('account_id')
      .eq('account_id', params.id)
      .maybeSingle()

    if (!profile) {
      return errorResponse('Organization not found', "API_ERROR", {}, 404)
    }

    await supabase
      .from('organization_profiles')
      .delete()
      .eq('account_id', params.id)

    await supabase.auth.admin.deleteUser(params.id)
    
    return successResponse({ 
      message: 'Organization deleted successfully'
    })
  } catch (error) {
    console.error('DELETE /api/admin/organizations/[id] error:', error)
    return errorResponse('Failed to delete organization', "API_ERROR", {}, 500)
  }
}
