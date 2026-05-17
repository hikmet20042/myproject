import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isApprovedOrganization } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getOrganizationImagePath, getUserAvatarPath, resolveProfileImageUrl } from '@/lib/profileImageUrls'
import { applyRateLimit } from '@/lib/rateLimit'

// Force dynamic rendering due to session usage
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'authenticatedRead',
      endpoint: '/api/profile',
    })

    const session = await getServerSession()
    
    if (!session?.user?.id) {
      const response = errorResponse('Unauthorized', "API_ERROR", {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMITED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const supabase = createSupabaseAdminClient()

    if (isApprovedOrganization(session)) {
      const { data: organizationProfile } = await supabase
        .from('organization_profiles')
        .select('account_id, organization_name, email, moderation_status, created_at, profile_image')
        .eq('account_id', session.user.id)
        .maybeSingle()

      if (!organizationProfile) {
        const response = errorResponse('Organization not found', "API_ERROR", {}, 404)
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }

      const profileImagePath = getOrganizationImagePath(organizationProfile.profile_image)
      const profileImageFallback =
        typeof organizationProfile.profile_image === 'string'
          ? organizationProfile.profile_image
          : (organizationProfile.profile_image as any)?.url || null
      const profileImageUrl = await resolveProfileImageUrl(supabase, profileImagePath, profileImageFallback)

      const response = successResponse({
        user: {
          _id: organizationProfile.account_id,
          name: organizationProfile.organization_name,
          email: organizationProfile.email,
          role: undefined,
          organizationStatus: organizationProfile.moderation_status,
          createdAt: organizationProfile.created_at,
          profileImage: profileImageUrl ? { url: profileImageUrl, path: profileImagePath, storage: 'supabase_storage' } : null,
          image: profileImageUrl || undefined
        }
      })
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      const response = errorResponse('User not found', 'USER_NOT_FOUND', {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('avatar, avatar_metadata')
      .eq('user_id', session.user.id)
      .single()

    const avatarPath = getUserAvatarPath((userProfile as any)?.avatar_metadata)
    const avatarUrl = await resolveProfileImageUrl(supabase, avatarPath, userProfile?.avatar || null)

    const response = successResponse({
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        profileImage: avatarUrl
          ? { url: avatarUrl, path: avatarPath, storage: (userProfile as any)?.avatar_metadata?.storage || 'supabase_storage' }
          : null,
        image: avatarUrl || null
      }
    })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response

  } catch (error) {
    console.error('Error fetching user profile:', error)
    const response = errorResponse('Failed to fetch profile', 'FETCH_PROFILE_FAILED', {}, 500)
    return response
  }
}
