import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { NotificationService } from '@/features/notifications/services/notificationService'

type OtpType = 'signup' | 'recovery' | 'email' | 'email_change' | 'invite' | 'magiclink'

function normalizeOtpType(value: string | null): OtpType | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (
    normalized === 'signup' ||
    normalized === 'recovery' ||
    normalized === 'email' ||
    normalized === 'email_change' ||
    normalized === 'invite' ||
    normalized === 'magiclink'
  ) {
    return normalized
  }
  return null
}

function getSafeNextPath(url: URL) {
  const next = url.searchParams.get('next')
  if (!next) return '/'

  try {
    const normalized = new URL(next, url.origin)
    if (normalized.origin !== url.origin) {
      return '/'
    }

    const safePath = `${normalized.pathname}${normalized.search}${normalized.hash}` || '/'
    if (safePath.startsWith('/auth/callback')) {
      return '/'
    }

    return safePath
  } catch {
    if (!next.startsWith('/')) return '/'
    if (next.startsWith('/auth/callback')) return '/'
    return next
  }
}

function redirectToSignIn(url: URL, params: Record<string, string>) {
  const signInUrl = new URL('/auth/signin', url.origin)
  Object.entries(params).forEach(([key, value]) => {
    signInUrl.searchParams.set(key, value)
  })
  return NextResponse.redirect(signInUrl)
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const safeNext = getSafeNextPath(url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const otpType = normalizeOtpType(url.searchParams.get('type'))
  const oauthError = url.searchParams.get('error')
  const oauthErrorDescription = url.searchParams.get('error_description')

  const supabase = createSupabaseServerClient()

  if (oauthError) {
    return redirectToSignIn(url, {
      error: 'OAuthSignin',
      message: oauthErrorDescription || 'Google ilə daxil olma alınmadı',
    })
  }

  if (!code && !(tokenHash && otpType)) {
    return redirectToSignIn(url, {
      error: 'OAuthCallback',
      message: 'Auth callback parametri tapılmadı',
    })
  }

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      return redirectToSignIn(url, {
        error: 'OAuthSignin',
        message: exchangeError.message || 'Sessiya yaradıla bilmədi',
      })
    }
  } else if (tokenHash && otpType) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    })

    if (verifyError) {
      return redirectToSignIn(url, {
        error: 'Verification',
        message: verifyError.message || 'Doğrulama keçidi etibarsızdır',
      })
    }
  }

  const { data } = await supabase.auth.getUser()
  if (!data?.user) {
    return redirectToSignIn(url, {
      error: 'OAuthSignin',
      message: 'Google istifadəçi məlumatı alınmadı',
    })
  }

  const provider = String(data.user.app_metadata?.provider || '').toLowerCase() || 'email'

  const adminSupabase = createSupabaseAdminClient()

  const { data: existingAccount } = await adminSupabase
    .from('accounts')
    .select('account_type, is_admin, is_active')
    .eq('id', data.user.id)
    .maybeSingle()

  const isFirstTimeUser = !existingAccount

  if (!existingAccount) {
    await adminSupabase
      .from('accounts')
      .upsert({
        id: data.user.id,
        account_type: null, // Let onboarding flow determine the account type
        is_admin: false,
        is_active: true,
      }, { onConflict: 'id' })
  }

  const { data: account } = existingAccount
    ? { data: existingAccount }
    : await adminSupabase
        .from('accounts')
        .select('account_type, is_admin, is_active')
        .eq('id', data.user.id)
        .maybeSingle()

  const accountType = (account?.account_type ?? null) as 'user' | 'organization' | null
  const role = account?.is_admin ? 'admin' : 'user'

  if (account?.is_active === false) {
    await supabase.auth.signOut()
    return redirectToSignIn(url, {
      error: 'OAuthSignin',
      message: 'Bu hesab deaktiv edilib',
    })
  }

  if (provider === 'google' && accountType === 'organization') {
    await supabase.auth.signOut()
    return redirectToSignIn(url, {
      error: 'OAuthSignin',
      message: 'Organization hesabları Google ilə daxil ola bilməz',
    })
  }

  const { data: existingUser } = await adminSupabase
    .from('users')
    .select('auth_provider')
    .eq('id', data.user.id)
    .maybeSingle()

  const isNewUserRow = !existingUser

  // Extract name from Google profile with comprehensive fallback chain
  const metadata = data.user.user_metadata || {}
  const googleName = metadata.name || metadata.full_name || metadata.display_name || ''
  const emailPrefix = data.user.email ? data.user.email.split('@')[0] : 'İstifadəçi'
  // Capitalize email prefix for better display
  const fallbackName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)

  await adminSupabase
    .from('users')
    .upsert({
      id: data.user.id,
      name: googleName || fallbackName,
      email: data.user.email,
      role,
      auth_provider: existingUser?.auth_provider || (provider === 'google' ? 'google' : 'email'),
    }, { onConflict: 'id' })

  // For Google OAuth users: automatically confirm email and send notifications on first signup
  if (provider === 'google' && isFirstTimeUser) {
    try {
      // Google users are auto-confirmed by Google, so send email confirmed notification
      await NotificationService.notifyEmailConfirmed(data.user.id, data.user.email || '')
      // Also send welcome notification
      await NotificationService.sendWelcomeNotification(data.user.id, 'user')
    } catch (notificationError) {
      console.error('Failed to send notifications for Google user:', notificationError)
    }
  }

  // Send email confirmation notification if this was an email confirmation
  if (otpType === 'signup' || otpType === 'email' || otpType === 'email_change') {
    try {
      await NotificationService.notifyEmailConfirmed(data.user.id, data.user.email || '')
    } catch (notificationError) {
      console.error('Failed to send email confirmation notification:', notificationError)
    }
  }

  return NextResponse.redirect(new URL(safeNext, url.origin))
}
