import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { handleApiRequest, withRateLimitHeaders } from '@/lib/apiHelpers'
import { ORGANIZATION_TYPE_VALUES } from '@/lib/organizationTypes'
import { MIN_DESCRIPTION_LENGTH } from '@/lib/constants/onboarding'

export async function POST(request: NextRequest) {
  try {
    const result = await handleApiRequest(request, {
      rateLimit: 'write',
      requireAuth: true,
      endpoint: '/api/onboarding/organization',
    })
    if (result instanceof Response) return result

    const { session, rateLimitHeaders } = result
    if (!session?.user) {
      return withRateLimitHeaders(errorResponse('Auth session tapılmadı.', 'AUTH_ERROR', {}, 401), rateLimitHeaders)
    }
    const body = await request.json()
    const organizationName = String(body?.organizationName || '').trim()
    const organizationType = String(body?.organizationType || '').trim()
    const description = String(body?.description || '').trim()

    if (!organizationName || organizationName.length < 3) {
      return withRateLimitHeaders(errorResponse('Təşkilat adı minimum 3 simvol olmalıdır.', 'VALIDATION_ERROR', {}, 400), rateLimitHeaders)
    }
    if (!ORGANIZATION_TYPE_VALUES.includes(organizationType as any)) {
      return withRateLimitHeaders(errorResponse('Kateqoriya seçimi etibarsızdır.', 'VALIDATION_ERROR', {}, 400), rateLimitHeaders)
    }
    if (!description || description.length < MIN_DESCRIPTION_LENGTH) {
      return withRateLimitHeaders(errorResponse(`Qısa təsvir minimum ${MIN_DESCRIPTION_LENGTH} simvol olmalıdır.`, 'VALIDATION_ERROR', {}, 400), rateLimitHeaders)
    }

    const supabase = createSupabaseAdminClient()
    const userId = session.user.id

    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('account_type')
      .eq('id', userId)
      .maybeSingle()

    if (existingAccount?.account_type === 'organization') {
      return withRateLimitHeaders(successResponse({ message: 'Təşkilat onboarding-i artıq tamamlanıb', redirect: '/dashboard' }), rateLimitHeaders)
    }

    const { error: accountError } = await supabase
      .from('accounts')
      .update({ account_type: 'organization', updated_at: new Date().toISOString() })
      .eq('id', userId)
    if (accountError) {
      console.error('Account update error:', accountError)
      return withRateLimitHeaders(errorResponse('Hesab yenilənə bilmədi.', 'DATABASE_ERROR', {}, 500), rateLimitHeaders)
    }

    const { error: orgError } = await supabase
      .from('organization_profiles')
      .upsert(
        {
          account_id: userId,
          organization_name: organizationName,
          organization_type: organizationType,
          description,
          moderation_status: 'pending',
          is_verified: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'account_id' },
      )
    if (orgError) {
      console.error('Organization profile error:', orgError)
      return withRateLimitHeaders(errorResponse('Təşkilat profili yaradıla bilmədi.', 'DATABASE_ERROR', {}, 500), rateLimitHeaders)
    }

    return withRateLimitHeaders(successResponse({ message: 'Təşkilat onboarding-i tamamlandı', redirect: '/organization/pending' }), rateLimitHeaders)
  } catch (error) {
    console.error('Organization onboarding error:', error)
    return errorResponse('Daxili server xətası', 'INTERNAL_ERROR', {}, 500)
  }
}
