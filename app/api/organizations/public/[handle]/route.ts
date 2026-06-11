import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getOrganizationImagePath, resolveProfileImageUrl } from '@/lib/profileImageUrls'
import { applyRateLimit } from '@/lib/rateLimit'

const rlh = (r: Response, h: Record<string, string>) => { for (const [k,v] of Object.entries(h)) r.headers.set(k,v); return r }

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'publicRead', endpoint: '/api/organizations/public/[handle]' })
  try {
    if (!rlResult.allowed) {
      return rlh(errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429), rlHeaders)
    }
    const supabase = createSupabaseAdminClient()
    const handle = decodeURIComponent(params.handle).toLowerCase().trim()

    // Look up organization_profiles by url_handle
    const { data: orgProfile, error: orgError } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('url_handle', handle)
      .eq('moderation_status', 'approved')
      .maybeSingle()

    if (orgError || !orgProfile) {
      return rlh(errorResponse('Təşkilat tapılmadı', 'ORG_NOT_FOUND', {}, 404), rlHeaders)
    }

    const profileImagePath = getOrganizationImagePath(orgProfile.profile_image)
    const profileImageFallback = orgProfile.profile_image?.url || null
    const profileImageUrl = await resolveProfileImageUrl(supabase, profileImagePath, profileImageFallback)

    // Count events
    const { count: eventCount } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('created_by_organization', orgProfile.account_id)
      .eq('status', 'approved')
      .eq('is_published', true)

    // Count vacancies
    const { count: vacancyCount } = await supabase
      .from('vacancies')
      .select('id', { count: 'exact', head: true })
      .eq('created_by_organization', orgProfile.account_id)
      .eq('status', 'approved')
      .eq('is_published', true)

    const { count: followerCount } = await supabase
      .from('organization_followers')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgProfile.account_id)

    return successResponse({ organization: { id: orgProfile.account_id, organizationName: orgProfile.organization_name || 'Təşkilat', urlHandle: orgProfile.url_handle, description: orgProfile.description || '', organizationType: orgProfile.organization_type || '', website: orgProfile.website || null, contactPhone: orgProfile.contact_phone || null, address: orgProfile.address || null, profileImage: profileImageUrl, isVerified: orgProfile.is_verified || false, focusAreas: orgProfile.focus_areas || [], socialLinks: orgProfile.social_links || null, eventCount: eventCount || 0, vacancyCount: vacancyCount || 0, followerCount: followerCount || 0, }, })
  } catch (error) {
    console.error('Public org profile error:', error)
    return rlh(errorResponse('Daxili server xətası', 'INTERNAL_SERVER_ERROR', {}, 500), rlHeaders)
  }
}
