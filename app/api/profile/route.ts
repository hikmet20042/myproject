import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isApprovedOrganization } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getOrganizationImagePath, getUserAvatarPath, resolveProfileImageUrl } from '@/lib/profileImageUrls'

// Force dynamic rendering due to session usage
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401)
    }

    const supabase = createSupabaseAdminClient()

    // If session is organization, fetch from Organization collection
    if (isApprovedOrganization(session)) {
      const { data: organizationProfile } = await supabase
        .from('organization_profiles')
        .select('account_id, organization_name, email, moderation_status, created_at, profile_image')
        .eq('account_id', session.user.id)
        .maybeSingle()

      if (!organizationProfile) {
        return errorResponse('Organization not found', "API_ERROR", {}, 404)
      }

      const profileImagePath = getOrganizationImagePath(organizationProfile.profile_image)
      const profileImageFallback =
        typeof organizationProfile.profile_image === 'string'
          ? organizationProfile.profile_image
          : (organizationProfile.profile_image as any)?.url || null
      const profileImageUrl = await resolveProfileImageUrl(supabase, profileImagePath, profileImageFallback)

      return successResponse({
        user: {
          _id: organizationProfile.account_id,
          name: organizationProfile.organization_name,
          email: organizationProfile.email,
          role: undefined, // Organizations don't have role in User collection
          organizationStatus: organizationProfile.moderation_status,
          createdAt: organizationProfile.created_at,
          profileImage: profileImageUrl ? { url: profileImageUrl, path: profileImagePath, storage: 'supabase_storage' } : null,
          image: profileImageUrl || undefined
        }
      })
    }

    // Fetch regular user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      return errorResponse('User not found', 'USER_NOT_FOUND', {}, 404)
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('avatar, avatar_metadata')
      .eq('user_id', session.user.id)
      .single()

    const avatarPath = getUserAvatarPath((userProfile as any)?.avatar_metadata)
    const avatarUrl = await resolveProfileImageUrl(supabase, avatarPath, userProfile?.avatar || null)

    return successResponse({
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

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return errorResponse('Failed to fetch profile', 'FETCH_PROFILE_FAILED', {}, 500)
  }
}
