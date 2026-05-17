import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

const ALLOWED_INTERESTS = ['IT', 'Təhsil', 'Könüllülük', 'Sosial fəaliyyət', 'Digər'] as const
type AllowedInterest = (typeof ALLOWED_INTERESTS)[number]

export async function POST(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'write',
      endpoint: '/api/onboarding/user',
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
    const interestsRaw = Array.isArray(body?.interests) ? body.interests : []
    const interests = Array.from(new Set(interestsRaw.map((v: unknown) => String(v).trim()))).filter(
      (v): v is AllowedInterest => ALLOWED_INTERESTS.includes(v as AllowedInterest),
    )

    if (interests.length < 1) {
      const response = errorResponse('Ən azı 1 maraq sahəsi seçin.', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }
    if (interests.length > 5) {
      const response = errorResponse('Maksimum 5 maraq sahəsi seçilə bilər.', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const supabase = createSupabaseAdminClient()

    const providedName = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : null
    const fallbackName = session.user.name || session.user.email?.split('@')[0] || 'İstifadəçi'
    const userName = providedName || fallbackName

    const { error: userUpsertError } = await supabase
      .from('users')
      .upsert(
        { id: session.user.id, email: session.user.email, name: userName, role: 'user' },
        { onConflict: 'id' },
      )
    if (userUpsertError) {
      const response = errorResponse(userUpsertError.message, 'API_ERROR', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert(
        { user_id: session.user.id, interests, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
    if (profileError) {
      const response = errorResponse(profileError.message, 'API_ERROR', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const { error: accountError } = await supabase
      .from('accounts')
      .update({ account_type: 'user', updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
    if (accountError) {
      const response = errorResponse(accountError.message, 'API_ERROR', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const response = successResponse({ message: 'User onboarding completed' })
    for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
    return response
  } catch (error) {
    console.error('User onboarding error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}
