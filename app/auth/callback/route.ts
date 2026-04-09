import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

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
  const oauthError = url.searchParams.get('error')
  const oauthErrorDescription = url.searchParams.get('error_description')

  const supabase = createSupabaseServerClient()

  if (oauthError) {
    return redirectToSignIn(url, {
      error: 'OAuthSignin',
      message: oauthErrorDescription || 'Google ilə daxil olma alınmadı',
    })
  }

  if (!code) {
    return redirectToSignIn(url, {
      error: 'OAuthCallback',
      message: 'Google callback kodu tapılmadı',
    })
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    return redirectToSignIn(url, {
      error: 'OAuthSignin',
      message: exchangeError.message || 'Google sessiyası yaradıla bilmədi',
    })
  }

  const { data } = await supabase.auth.getUser()
  if (!data?.user) {
    return redirectToSignIn(url, {
      error: 'OAuthSignin',
      message: 'Google istifadəçi məlumatı alınmadı',
    })
  }

  const provider = data.user.app_metadata?.provider
  if (provider && provider !== 'google') {
    return redirectToSignIn(url, {
      error: 'OAuthSignin',
      message: 'Bu hesab Google ilə əlaqəli deyil',
    })
  }

  const adminSupabase = createSupabaseAdminClient()

  await adminSupabase
    .from('accounts')
    .upsert({
      id: data.user.id,
      account_type: 'user',
      is_admin: false,
      is_active: true,
    }, { onConflict: 'id' })

  const { data: account } = await adminSupabase
    .from('accounts')
    .select('account_type, is_admin, is_active')
    .eq('id', data.user.id)
    .maybeSingle()

  const accountType = account?.account_type as 'user' | 'organization' | undefined
  const role = account?.is_admin ? 'admin' : 'user'

  if (account?.is_active === false) {
    await supabase.auth.signOut()
    return redirectToSignIn(url, {
      error: 'OAuthSignin',
      message: 'Bu hesab deaktiv edilib',
    })
  }

  if (accountType === 'organization') {
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

  await adminSupabase
    .from('users')
    .upsert({
      id: data.user.id,
      name: data.user.user_metadata?.name || data.user.email,
      email: data.user.email,
      role,
      auth_provider: existingUser?.auth_provider || 'google',
    }, { onConflict: 'id' })

  return NextResponse.redirect(new URL(safeNext, url.origin))
}
