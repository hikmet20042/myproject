import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { handleApiRequest, withRateLimitHeaders } from '@/lib/apiHelpers'
import { ORGANIZATION_TYPE_VALUES } from '@/lib/organizationTypes'

export async function POST(request: NextRequest) {
  try {
    const result = await handleApiRequest(request, {
      rateLimit: 'write',
      requireAuth: true,
      endpoint: '/api/onboarding/organization',
    })
    if (result instanceof Response) return result

    const { session, rateLimitHeaders } = result
    const body = await request.json()
    const organizationName = String(body?.organizationName || '').trim()
    const organizationType = String(body?.organizationType || '').trim()
    const description = String(body?.description || '').trim()

    if (!organizationName || organizationName.length < 3) {
      return withRateLimitHeaders(errorResponse('Təşkilat adı minimum 3 simvol olmalıdır.', 'API_ERROR', {}, 400), rateLimitHeaders)
    }
    if (!ORGANIZATION_TYPE_VALUES.includes(organizationType as any)) {
      return withRateLimitHeaders(errorResponse('Kateqoriya seçimi etibarsızdır.', 'API_ERROR', {}, 400), rateLimitHeaders)
    }
    if (!description || description.length < 20) {
      return withRateLimitHeaders(errorResponse('Qısa təsvir minimum 20 simvol olmalıdır.', 'API_ERROR', {}, 400), rateLimitHeaders)
    }

    const supabase = createSupabaseAdminClient()

    const { data: existingUser } = await supabase
      .from('users')
      .select('name')
      .eq('id', session!.user.id)
      .single()

    const currentName = existingUser?.name || ''
    const nameLooksIncomplete = !currentName || !currentName.includes(' ') || currentName.includes('@')
    if (nameLooksIncomplete) {
      await supabase
        .from('users')
        .update({ name: organizationName, updated_at: new Date().toISOString() })
        .eq('id', session!.user.id)
    }

    const { error: accountError } = await supabase
      .from('accounts')
      .update({ account_type: 'organization', updated_at: new Date().toISOString() })
      .eq('id', session!.user.id)
    if (accountError) {
      return withRateLimitHeaders(errorResponse(accountError.message, 'API_ERROR', {}, 500), rateLimitHeaders)
    }

    const { error: orgError } = await supabase
      .from('organization_profiles')
      .upsert(
        {
          account_id: session!.user.id,
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
      return withRateLimitHeaders(errorResponse(orgError.message, 'API_ERROR', {}, 500), rateLimitHeaders)
    }

    return withRateLimitHeaders(successResponse({ message: 'Organization onboarding completed' }), rateLimitHeaders)
  } catch (error) {
    console.error('Organization onboarding error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}
