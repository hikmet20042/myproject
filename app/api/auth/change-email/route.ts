import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { getAuthProviderInfo, hasRecentSignIn } from '@/lib/auth/provider-info'

export async function GET(request: NextRequest) {
  const { result: rateLimitResult, headers: rateLimitHeaders } = await applyRateLimit({
    request,
    preset: 'auth',
    endpoint: '/api/auth/change-email',
  })

  if (!rateLimitResult.allowed) {
    const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }

  try {
    const supabase = createSupabaseServerClient()
    const { data: authData } = await supabase.auth.getUser()

    if (!authData?.user?.id) {
      const response = errorResponse('Autentifikasiya tələb olunur', 'API_ERROR', {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const providerInfo = getAuthProviderInfo(authData.user)
    const recentlyReauthenticated = hasRecentSignIn(authData.user)

    const response = successResponse({
      currentEmail: authData.user.email || null,
      requiresCurrentPassword: !providerInfo.isGoogleOnly,
      requiresGoogleReauth: providerInfo.isGoogleOnly && !recentlyReauthenticated,
      providers: providerInfo.providers,
    })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    console.error('GET /api/auth/change-email error:', error)
    const response = errorResponse('Daxili server xətası', 'API_ERROR', {}, 500)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }
}

export async function POST(request: NextRequest) {
  const { result: rateLimitResult, headers: rateLimitHeaders } = await applyRateLimit({
    request,
    preset: 'auth',
    endpoint: '/api/auth/change-email',
  })

  if (!rateLimitResult.allowed) {
    const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }

  try {
    const supabase = createSupabaseServerClient()
    const { data: authData } = await supabase.auth.getUser()

    if (!authData?.user?.id || !authData.user.email) {
      const response = errorResponse('Autentifikasiya tələb olunur', 'API_ERROR', {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const body = await request.json().catch(() => ({}))
    const newEmail = String(body?.newEmail || '').trim().toLowerCase()
    const currentPassword = String(body?.currentPassword || '').trim()

    if (!newEmail) {
      const response = errorResponse('Yeni e-poçt tələb olunur', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      const response = errorResponse('Yanlış e-poçt formatı', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (newEmail === String(authData.user.email || '').toLowerCase()) {
      const response = errorResponse('Yeni e-poçt mövcud e-poçtla eyni ola bilməz', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const providerInfo = getAuthProviderInfo(authData.user)
    const recentlyReauthenticated = hasRecentSignIn(authData.user)

    if (providerInfo.isGoogleOnly && !recentlyReauthenticated) {
      const response = errorResponse('E-poçtu dəyişmək üçün əvvəlcə Google ilə yenidən daxil ol.', 'REAUTH_REQUIRED', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (!providerInfo.isGoogleOnly) {
      if (!currentPassword) {
        const response = errorResponse('Cari şifrə tələb olunur', 'API_ERROR', {}, 400)
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        const response = errorResponse('Supabase konfiqurasiyası tapılmadı', 'API_ERROR', {}, 500)
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }

      const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      const { error: signInError } = await anonClient.auth.signInWithPassword({
        email: authData.user.email,
        password: currentPassword,
      })

      if (signInError) {
        const response = errorResponse('Cari şifrə yanlışdır', 'API_ERROR', {}, 400)
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const emailRedirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent('/profile/settings?emailChange=confirmed')}`

    const { error: updateError } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo },
    )

    if (updateError) {
      const response = errorResponse(updateError.message || 'E-poçt dəyişdirilə bilmədi', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    // Send email change notification
    try {
      await NotificationService.notifyEmailChangeInitiated(authData.user.id, authData.user.email || '', newEmail)
    } catch (notificationError) {
      console.error('Failed to send email change notification:', notificationError)
    }

    const response = successResponse({
      message: 'Təsdiq linki yeni e-poçta göndərildi. Dəyişikliyi tamamla və sonra yenidən daxil ol.',
    })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    console.error('POST /api/auth/change-email error:', error)
    const response = errorResponse('Daxili server xətası', 'API_ERROR', {}, 500)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }
}
