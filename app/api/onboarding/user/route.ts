import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { handleApiRequest, withRateLimitHeaders } from '@/lib/apiHelpers'
import { ALLOWED_INTERESTS, MAX_INTERESTS, MIN_INTERESTS } from '@/lib/constants/onboarding'

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
    if (!session?.user) {
      return withRateLimitHeaders(errorResponse('Auth session tapılmadı.', 'AUTH_ERROR', {}, 401), rateLimitHeaders)
    }
    const body = await request.json()
    const interestsRaw = Array.isArray(body?.interests) ? body.interests : []
    const interests = Array.from(new Set(interestsRaw.map((v: unknown) => String(v).trim()))).filter(
      (v): v is AllowedInterest => ALLOWED_INTERESTS.includes(v as AllowedInterest),
    )

    if (interests.length < MIN_INTERESTS) {
      return withRateLimitHeaders(errorResponse(`Ən azı ${MIN_INTERESTS} maraq sahəsi seçin.`, 'VALIDATION_ERROR', {}, 400), rateLimitHeaders)
    }
    if (interests.length > MAX_INTERESTS) {
      return withRateLimitHeaders(errorResponse(`Maksimum ${MAX_INTERESTS} maraq sahəsi seçilə bilər.`, 'VALIDATION_ERROR', {}, 400), rateLimitHeaders)
    }

    const supabase = createSupabaseAdminClient()
    const userId = session.user.id

    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('account_type')
      .eq('id', userId)
      .maybeSingle()

    if (existingAccount?.account_type === 'user') {
      return withRateLimitHeaders(successResponse({ message: 'User onboarding already completed', redirect: '/' }), rateLimitHeaders)
    }

    const providedName = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : null
    const fallbackName = session.user.name || session.user.email?.split('@')[0] || 'İstifadəçi'
    const userName = providedName || fallbackName

    const { error: userUpsertError } = await supabase
      .from('users')
      .upsert(
        { id: userId, email: session.user.email, name: userName, role: 'user' },
        { onConflict: 'id' },
      )
    if (userUpsertError) {
      console.error('User upsert error:', userUpsertError)
      return withRateLimitHeaders(errorResponse('İstifadəçi profili yaradıla bilmədi.', 'DATABASE_ERROR', {}, 500), rateLimitHeaders)
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert(
        { user_id: userId, interests, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
    if (profileError) {
      console.error('Profile error:', profileError)
      return withRateLimitHeaders(errorResponse('Profil yenilənə bilmədi.', 'DATABASE_ERROR', {}, 500), rateLimitHeaders)
    }

    const { error: accountError } = await supabase
      .from('accounts')
      .update({ account_type: 'user', updated_at: new Date().toISOString() })
      .eq('id', userId)
    if (accountError) {
      console.error('Account update error:', accountError)
      return withRateLimitHeaders(errorResponse('Hesab yenilənə bilmədi.', 'DATABASE_ERROR', {}, 500), rateLimitHeaders)
    }

    return withRateLimitHeaders(successResponse({ message: 'User onboarding completed', redirect: '/' }), rateLimitHeaders)
  } catch (error) {
    console.error('User onboarding error:', error)
    return errorResponse('Daxili server xətası', 'INTERNAL_ERROR', {}, 500)
  }
}
