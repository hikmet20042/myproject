import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { checkRateLimit, getRequestIp } from '@/lib/security/rateLimit'
import { NotificationService } from '@/features/notifications/services/notificationService'

type ProviderInfo = {
  providers: string[]
  hasPasswordProvider: boolean
  isGoogleOnly: boolean
}

const CHANGE_EMAIL_LIMIT = 5
const CHANGE_EMAIL_WINDOW_MS = 15 * 60 * 1000
const RECENT_REAUTH_WINDOW_MS = 5 * 60 * 1000

function getAuthProviderInfo(user: any): ProviderInfo {
  const identities = Array.isArray(user?.identities) ? user.identities : []
  const providers = new Set<string>()

  for (const identity of identities) {
    const provider = String(identity?.provider || '').trim().toLowerCase()
    if (provider) providers.add(provider)
  }

  const appProvider = String(user?.app_metadata?.provider || '').trim().toLowerCase()
  if (appProvider) providers.add(appProvider)

  const providerList = Array.from(providers)
  const hasPasswordProvider = providerList.includes('email')
  const isGoogleOnly = providerList.includes('google') && !hasPasswordProvider

  return {
    providers: providerList,
    hasPasswordProvider,
    isGoogleOnly,
  }
}

function hasRecentSignIn(user: any) {
  const lastSignInAtRaw = user?.last_sign_in_at
  if (!lastSignInAtRaw) return false
  const lastSignInAt = new Date(lastSignInAtRaw).getTime()
  if (Number.isNaN(lastSignInAt)) return false
  return Date.now() - lastSignInAt <= RECENT_REAUTH_WINDOW_MS
}

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const { data: authData } = await supabase.auth.getUser()

    if (!authData?.user?.id) {
      return errorResponse('Authentication required', 'API_ERROR', {}, 401)
    }

    const providerInfo = getAuthProviderInfo(authData.user)
    const recentlyReauthenticated = hasRecentSignIn(authData.user)

    return successResponse({
      currentEmail: authData.user.email || null,
      requiresCurrentPassword: !providerInfo.isGoogleOnly,
      requiresGoogleReauth: providerInfo.isGoogleOnly && !recentlyReauthenticated,
      providers: providerInfo.providers,
    })
  } catch (error) {
    console.error('GET /api/auth/change-email error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request.headers)
    const ipRateLimit = checkRateLimit(`auth:change-email:ip:${ip}`, CHANGE_EMAIL_LIMIT, CHANGE_EMAIL_WINDOW_MS)
    if (!ipRateLimit.allowed) {
      return errorResponse('Too many requests. Please try again later.', 'RATE_LIMITED', {}, 429)
    }

    const supabase = createSupabaseServerClient()
    const { data: authData } = await supabase.auth.getUser()

    if (!authData?.user?.id || !authData.user.email) {
      return errorResponse('Authentication required', 'API_ERROR', {}, 401)
    }

    const userRateLimit = checkRateLimit(
      `auth:change-email:user:${authData.user.id}`,
      CHANGE_EMAIL_LIMIT,
      CHANGE_EMAIL_WINDOW_MS,
    )
    if (!userRateLimit.allowed) {
      return errorResponse('Too many requests. Please try again later.', 'RATE_LIMITED', {}, 429)
    }

    const body = await request.json().catch(() => ({}))
    const newEmail = String(body?.newEmail || '').trim().toLowerCase()
    const currentPassword = String(body?.currentPassword || '').trim()

    if (!newEmail) {
      return errorResponse('New email is required', 'API_ERROR', {}, 400)
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return errorResponse('Invalid email format', 'API_ERROR', {}, 400)
    }

    if (newEmail === String(authData.user.email || '').toLowerCase()) {
      return errorResponse('Yeni e-poçt mövcud e-poçtla eyni ola bilməz', 'API_ERROR', {}, 400)
    }

    const providerInfo = getAuthProviderInfo(authData.user)
    const recentlyReauthenticated = hasRecentSignIn(authData.user)

    if (providerInfo.isGoogleOnly && !recentlyReauthenticated) {
      return errorResponse('E-poçtu dəyişmək üçün əvvəlcə Google ilə yenidən daxil ol.', 'REAUTH_REQUIRED', {}, 400)
    }

    if (!providerInfo.isGoogleOnly) {
      if (!currentPassword) {
        return errorResponse('Current password is required', 'API_ERROR', {}, 400)
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        return errorResponse('Supabase configuration missing', 'API_ERROR', {}, 500)
      }

      const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      const { error: signInError } = await anonClient.auth.signInWithPassword({
        email: authData.user.email,
        password: currentPassword,
      })

      if (signInError) {
        return errorResponse('Current password is incorrect', 'API_ERROR', {}, 400)
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const emailRedirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent('/profile/settings?emailChange=confirmed')}`

    const { error: updateError } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo },
    )

    if (updateError) {
      return errorResponse(updateError.message || 'E-poçt dəyişdirilə bilmədi', 'API_ERROR', {}, 400)
    }

    // Send email change notification
    try {
      await NotificationService.notifyEmailChangeInitiated(authData.user.id, authData.user.email || '', newEmail)
    } catch (notificationError) {
      console.error('Failed to send email change notification:', notificationError)
    }

    return successResponse({
      message: 'Təsdiq linki yeni e-poçta göndərildi. Dəyişikliyi tamamla və sonra yenidən daxil ol.',
    })
  } catch (error) {
    console.error('POST /api/auth/change-email error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}
