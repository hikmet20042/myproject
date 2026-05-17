import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'
import { ORGANIZATION_TYPE_VALUES } from '@/lib/organizationTypes'

export async function POST(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'write',
      endpoint: '/api/onboarding/organization',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const session = await getServerSession()
    if (!session?.user?.id) {
      const response = errorResponse('Unauthorized', 'API_ERROR', {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const body = await request.json()
    const organizationName = String(body?.organizationName || '').trim()
    const organizationType = String(body?.organizationType || '').trim()
    const description = String(body?.description || '').trim()

    if (!organizationName || organizationName.length < 3) {
      const response = errorResponse('Təşkilat adı minimum 3 simvol olmalıdır.', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }
    if (!ORGANIZATION_TYPE_VALUES.includes(organizationType as any)) {
      const response = errorResponse('Kateqoriya seçimi etibarsızdır.', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }
    if (!description || description.length < 20) {
      const response = errorResponse('Qısa təsvir minimum 20 simvol olmalıdır.', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const supabase = createSupabaseAdminClient()

    const { data: existingUser } = await supabase
      .from('users')
      .select('name')
      .eq('id', session.user.id)
      .single()

    const currentName = existingUser?.name || ''
    const nameLooksIncomplete = !currentName || !currentName.includes(' ') || currentName.includes('@')
    if (nameLooksIncomplete) {
      await supabase
        .from('users')
        .update({ name: organizationName, updated_at: new Date().toISOString() })
        .eq('id', session.user.id)
    }

    const { error: accountError } = await supabase
      .from('accounts')
      .update({ account_type: 'organization', updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
    if (accountError) {
      const response = errorResponse(accountError.message, 'API_ERROR', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
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
      const response = errorResponse(orgError.message, 'API_ERROR', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const response = successResponse({ message: 'Organization onboarding completed' })
    for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
    return response
  } catch (error) {
    console.error('Organization onboarding error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}
