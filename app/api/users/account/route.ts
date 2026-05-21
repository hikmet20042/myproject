import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isApprovedOrganization } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

const RECENT_REAUTH_WINDOW_MS = 5 * 60 * 1000
const PROFILE_BUCKET = process.env.SUPABASE_PROFILE_IMAGES_BUCKET || 'profile-images'

function getAuthProviderInfo(user: any) {
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

export async function GET(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'authenticatedRead',
      endpoint: '/api/users/account',
    })

    const session = await getServerSession()
    if (!session?.user?.id) {
      const response = errorResponse('Autentifikasiya tələb olunur', 'API_ERROR', {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMITED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const supabaseServer = createSupabaseServerClient()
    const { data: authData } = await supabaseServer.auth.getUser()

    if (!authData?.user?.id || authData.user.id !== session.user.id) {
      const response = errorResponse('Autentifikasiya tələb olunur', 'API_ERROR', {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const providerInfo = getAuthProviderInfo(authData.user)
    const recentlyReauthenticated = hasRecentSignIn(authData.user)
    const requiresGoogleReauth = providerInfo.isGoogleOnly && !recentlyReauthenticated

    const response = successResponse({
      requiresCurrentPassword: !providerInfo.isGoogleOnly,
      requiresPasswordSetup: false,
      requiresGoogleReauth,
      recentlyReauthenticated,
      providers: providerInfo.providers,
      deleteConfirmationText: 'SİL',
    })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    console.error('GET /api/users/account error:', error)
    const response = errorResponse('Daxili server xətası', 'API_ERROR', {}, 500)
    return response
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'write',
      endpoint: '/api/users/account',
    })

    const session = await getServerSession()
    if (!session?.user?.id) {
      const response = errorResponse('Autentifikasiya tələb olunur', 'API_ERROR', {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMITED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (session.user.accountType === 'organization') {
      const response = errorResponse('Təşkilat hesabları təşkilat tənzimləmələrindən silinməlidir', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response;
    }

    const body = await request.json().catch(() => ({}))
    const confirmText = String(body?.confirmText || '').trim().toUpperCase()
    const currentPassword = String(body?.currentPassword || '').trim()

    if (confirmText !== 'DELETE') {
      const response = errorResponse('Təsdiq mətni yanlışdır', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (!currentPassword) {
      const response = errorResponse('Cari şifrə tələb olunur', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const supabaseServer = createSupabaseServerClient()
    const { data: authData } = await supabaseServer.auth.getUser()

    if (!authData?.user?.id || authData.user.id !== session.user.id) {
      const response = errorResponse('Autentifikasiya tələb olunur', 'API_ERROR', {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const providerInfo = getAuthProviderInfo(authData.user)
    if (providerInfo.isGoogleOnly && !hasRecentSignIn(authData.user)) {
      const response = errorResponse('Hesabı silmək üçün Google ilə yenidən daxil ol və yenidən cəhd et.', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (!providerInfo.isGoogleOnly) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey || !authData.user.email) {
        const response = errorResponse('Şifrə doğrulaması hazırda mövcud deyil', 'API_ERROR', {}, 500)
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

    const supabase = createSupabaseAdminClient()
    const userId = session.user.id
    
    await supabase.from('blog_reactions').delete().eq('user_id', userId)
    await supabase.from('content_saves').delete().eq('user_id', userId)
    await supabase.from('organization_followers').delete().eq('user_id', userId)
    await supabase.from('notifications').delete().eq('user_id', userId)

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('avatar_metadata')
      .eq('user_id', userId)
      .maybeSingle()

    const profilePath =
      userProfile?.avatar_metadata && typeof userProfile.avatar_metadata === 'object'
        ? (userProfile.avatar_metadata as any).path
        : null

    if (typeof profilePath === 'string' && profilePath.length > 0) {
      await supabase.storage.from(PROFILE_BUCKET).remove([profilePath])
    }

    const { data: userBlogs } = await supabase
      .from('blogs')
      .select('id')
      .eq('author_id', userId)
    
    if (userBlogs && userBlogs.length > 0) {
      const blogIds = userBlogs.map(b => b.id)
      
      await supabase.from('blog_reactions').delete().in('blog_id', blogIds)
      await supabase.from('blog_views').delete().in('blog_id', blogIds)
      await supabase.from('content_saves').delete().in('content_id', blogIds).eq('content_type', 'blog')
      await supabase.from('blogs').delete().eq('author_id', userId)
    }

    await supabase.from('user_profiles').delete().eq('user_id', userId)
    await supabase.from('events').delete().eq('created_by', userId)
    await supabase.from('vacancies').delete().eq('created_by', userId)
    await supabase.from('materials').delete().eq('created_by', userId)

    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error('Failed to delete auth user:', deleteError)
      const response = errorResponse(deleteError.message || 'Failed to delete account', 'API_ERROR', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const response = successResponse({ message: 'Hesab uğurla silindi' })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    console.error('DELETE /api/users/account error:', error)
    const response = errorResponse('Daxili server xətası', 'API_ERROR', {}, 500)
    return response
  }
}