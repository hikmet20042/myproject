import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
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
      return errorResponse('Organization not found', 'ORG_NOT_FOUND', {}, 404)
    }

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

    return successResponse({
      organization: {
        id: orgProfile.account_id,
        organizationName: orgProfile.organization_name || 'Təşkilat',
        urlHandle: orgProfile.url_handle,
        description: orgProfile.description || '',
        organizationType: orgProfile.organization_type || '',
        website: orgProfile.website || null,
        contactPhone: orgProfile.contact_phone || null,
        address: orgProfile.address || null,
        profileImage: orgProfile.profile_image?.url || null,
        isVerified: orgProfile.is_verified || false,
        focusAreas: orgProfile.focus_areas || [],
        socialLinks: orgProfile.social_links || null,
        eventCount: eventCount || 0,
        vacancyCount: vacancyCount || 0,
      },
    })
  } catch (error) {
    console.error('Public org profile error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}
