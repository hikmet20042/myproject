import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// DELETE /api/admin/organizations/[id] - Delete organization registration permanently
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    
    const session = await getServerSession()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { data: profile } = await supabase
      .from('organization_profiles')
      .select('account_id')
      .eq('account_id', params.id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    await supabase
      .from('organization_profiles')
      .delete()
      .eq('account_id', params.id)

    await supabase.auth.admin.deleteUser(params.id)
    
    return NextResponse.json({ 
      message: 'Organization deleted successfully'
    })
  } catch (error) {
    console.error('DELETE /api/admin/organizations/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    )
  }
}
