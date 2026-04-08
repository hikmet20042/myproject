import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { ORGANIZATION_TYPE_VALUES } from '@/lib/organizationTypes'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 'API_ERROR', {}, 401)
    }

    const body = await request.json()
    const organizationName = String(body?.organizationName || '').trim()
    const organizationType = String(body?.organizationType || '').trim()
    const description = String(body?.description || '').trim()

    if (!organizationName || organizationName.length < 3) {
      return errorResponse('Təşkilat adı minimum 3 simvol olmalıdır.', 'API_ERROR', {}, 400)
    }
    if (!ORGANIZATION_TYPE_VALUES.includes(organizationType as any)) {
      return errorResponse('Kateqoriya seçimi etibarsızdır.', 'API_ERROR', {}, 400)
    }
    if (!description || description.length < 20) {
      return errorResponse('Qısa təsvir minimum 20 simvol olmalıdır.', 'API_ERROR', {}, 400)
    }

    const supabase = createSupabaseAdminClient()

    const { error: accountError } = await supabase
      .from('accounts')
      .update({
        account_type: 'organization',
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)
    if (accountError) {
      return errorResponse(accountError.message, 'API_ERROR', {}, 500)
    }

    const { error: orgError } = await supabase
      .from('organization_profiles')
      .upsert(
        {
          account_id: session.user.id,
          organization_name: organizationName,
          organization_type: organizationType,
          description,
          moderation_status: 'approved',
          is_verified: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'account_id' },
      )
    if (orgError) {
      return errorResponse(orgError.message, 'API_ERROR', {}, 500)
    }

    return successResponse({ message: 'Organization onboarding completed' })
  } catch (error) {
    console.error('Organization onboarding error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}
