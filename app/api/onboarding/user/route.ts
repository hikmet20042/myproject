import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { handleApiRequest, withRateLimitHeaders } from '@/lib/apiHelpers'

const ALLOWED_INTERESTS = ['IT', 'Təhsil', 'Könüllülük', 'Sosial fəaliyyət', 'Digər'] as const
type AllowedInterest = (typeof ALLOWED_INTERESTS)[number]

export async function POST(request: NextRequest) {
  try {
    const result = await handleApiRequest(request, {
      rateLimit: 'write',
      requireAuth: true,
      endpoint: '/api/onboarding/user',
    })
    if (result instanceof Response) return result

    const { session, rateLimitHeaders } = result
    const body = await request.json()
    const interestsRaw = Array.isArray(body?.interests) ? body.interests : []
    const interests = Array.from(new Set(interestsRaw.map((v: unknown) => String(v).trim()))).filter(
      (v): v is AllowedInterest => ALLOWED_INTERESTS.includes(v as AllowedInterest),
    )

    if (interests.length < 1) {
      return withRateLimitHeaders(errorResponse('Ən azı 1 maraq sahəsi seçin.', 'API_ERROR', {}, 400), rateLimitHeaders)
    }
    if (interests.length > 5) {
      return withRateLimitHeaders(errorResponse('Maksimum 5 maraq sahəsi seçilə bilər.', 'API_ERROR', {}, 400), rateLimitHeaders)
    }

    const supabase = createSupabaseAdminClient()

    const providedName = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : null
    const fallbackName = session!.user.name || session!.user.email?.split('@')[0] || 'İstifadəçi'
    const userName = providedName || fallbackName

    const { error: userUpsertError } = await supabase
      .from('users')
      .upsert(
        { id: session!.user.id, email: session!.user.email, name: userName, role: 'user' },
        { onConflict: 'id' },
      )
    if (userUpsertError) {
      return withRateLimitHeaders(errorResponse(userUpsertError.message, 'API_ERROR', {}, 500), rateLimitHeaders)
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert(
        { user_id: session!.user.id, interests, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
    if (profileError) {
      return withRateLimitHeaders(errorResponse(profileError.message, 'API_ERROR', {}, 500), rateLimitHeaders)
    }

    const { error: accountError } = await supabase
      .from('accounts')
      .update({ account_type: 'user', updated_at: new Date().toISOString() })
      .eq('id', session!.user.id)
    if (accountError) {
      return withRateLimitHeaders(errorResponse(accountError.message, 'API_ERROR', {}, 500), rateLimitHeaders)
    }

    return withRateLimitHeaders(successResponse({ message: 'User onboarding completed' }), rateLimitHeaders)
  } catch (error) {
    console.error('User onboarding error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}
