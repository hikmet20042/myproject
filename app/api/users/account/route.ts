import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isApprovedOrganization } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'

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

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return errorResponse('Authentication required', 'API_ERROR', {}, 401)
    }

    const supabaseServer = createSupabaseServerClient()
    const { data: authData } = await supabaseServer.auth.getUser()

    if (!authData?.user?.id || authData.user.id !== session.user.id) {
      return errorResponse('Authentication required', 'API_ERROR', {}, 401)
    }

    const providerInfo = getAuthProviderInfo(authData.user)
    const recentlyReauthenticated = hasRecentSignIn(authData.user)
    const requiresGoogleReauth = providerInfo.isGoogleOnly && !recentlyReauthenticated

    return successResponse({
      requiresCurrentPassword: !providerInfo.isGoogleOnly,
      requiresPasswordSetup: false,
      requiresGoogleReauth,
      recentlyReauthenticated,
      providers: providerInfo.providers,
      deleteConfirmationText: 'DELETE',
    })
  } catch (error) {
    console.error('GET /api/users/account error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return errorResponse('Authentication required', 'API_ERROR', {}, 401)
    }

    // Block ALL organizations - account deletion is for regular users only
    if (session.user.accountType === 'organization') {
      return errorResponse('Organization accounts must be deleted through organization settings', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403);
    }

    const body = await request.json().catch(() => ({}))
    const confirmText = String(body?.confirmText || '').trim().toUpperCase()
    const currentPassword = String(body?.currentPassword || '').trim()

    if (confirmText !== 'DELETE') {
      return errorResponse('Confirmation text is invalid', 'API_ERROR', {}, 400)
    }

    if (!currentPassword) {
      return errorResponse('Current password is required', 'API_ERROR', {}, 400)
    }

    const supabaseServer = createSupabaseServerClient()
    const { data: authData } = await supabaseServer.auth.getUser()

    if (!authData?.user?.id || authData.user.id !== session.user.id) {
      return errorResponse('Authentication required', 'API_ERROR', {}, 401)
    }

    const providerInfo = getAuthProviderInfo(authData.user)
    if (providerInfo.isGoogleOnly && !hasRecentSignIn(authData.user)) {
      return errorResponse('Hesabı silmək üçün Google ilə yenidən daxil ol və yenidən cəhd et.', 'API_ERROR', {}, 400)
    }

    if (!providerInfo.isGoogleOnly) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey || !authData.user.email) {
        return errorResponse('Password verification is currently unavailable', 'API_ERROR', {}, 500)
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

    const supabase = createSupabaseAdminClient()
    const userId = session.user.id

    // Comprehensive cleanup of ALL user-related data
    // Execute in order to respect foreign key constraints
    
    // 1. Delete user's reactions (likes/dislikes) on blogs
    await supabase.from('blog_reactions').delete().eq('user_id', userId)

    // 2. Delete user's saved content (bookmarks)
    await supabase.from('content_saves').delete().eq('user_id', userId)

    // 3. Delete user's organization follows
    await supabase.from('organization_followers').delete().eq('user_id', userId)

    // 4. Delete user's notifications
    await supabase.from('notifications').delete().eq('user_id', userId)

    // 5. Delete user's profile image object from Supabase Storage (if any)
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

    // 6. Delete user's blogs and their related data
    const { data: userBlogs } = await supabase
      .from('blogs')
      .select('id')
      .eq('author_id', userId)
    
    if (userBlogs && userBlogs.length > 0) {
      const blogIds = userBlogs.map(b => b.id)
      
      // Delete reactions and views on user's own blogs
      await supabase.from('blog_reactions').delete().in('blog_id', blogIds)
      await supabase.from('blog_views').delete().in('blog_id', blogIds)
      
      // Delete saves of user's blogs by other users
      await supabase.from('content_saves').delete().in('content_id', blogIds).eq('content_type', 'blog')
      
      // Delete the blogs themselves
      await supabase.from('blogs').delete().eq('author_id', userId)
    }

    // 7. Delete user's profile (extended data)
    await supabase.from('user_profiles').delete().eq('user_id', userId)

    // 8. Delete user's events (if any)
    await supabase.from('events').delete().eq('created_by', userId)

    // 9. Delete user's vacancies (if any)
    await supabase.from('vacancies').delete().eq('created_by', userId)

    // 10. Delete user's materials (if any)
    await supabase.from('materials').delete().eq('created_by', userId)

    // 11. Finally, delete the user's auth account (this cascades to accounts table)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error('Failed to delete auth user:', deleteError)
      return errorResponse(deleteError.message || 'Failed to delete account', 'API_ERROR', {}, 500)
    }

    return successResponse({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/users/account error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}