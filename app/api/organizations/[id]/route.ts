import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canAccessAdmin, isAdmin } from '@/lib/auth/permissions'
import { normalizeOrganizationProfile, validateOrganizationUpdatePayload } from '@/lib/organizationProfile'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

const rlh = (r: Response, h: Record<string, string>) => { for (const [k,v] of Object.entries(h)) r.headers.set(k,v); return r }

export const dynamic = 'force-dynamic'

// GET /api/organizations/[id] - Get single organization by account_id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'publicRead', endpoint: '/api/organizations/[id]' })
    if (!rlResult.allowed) {
      return errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    }
    const supabase = createSupabaseAdminClient()

    const { data: profile, error: profileError } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('account_id', params.id)
      .eq('moderation_status', 'approved')
      .maybeSingle()

    if (profileError || !profile) {
      return errorResponse('Təşkilat tapılmadı', "API_ERROR", {}, 404)
    }

    const [followerCountResult, featuredEventResult, featuredVacancyResult] = await Promise.all([
      supabase
        .from('organization_followers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', profile.account_id),
      supabase
        .from('events')
        .select('id, title, event_date, application_link, created_at')
        .eq('created_by_organization', profile.account_id)
        .eq('status', 'approved')
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('vacancies')
        .select('id, title, application_deadline, application_method, application_value, created_at')
        .eq('created_by_organization', profile.account_id)
        .eq('status', 'approved')
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    return rlh(successResponse({ organization: normalizeOrganizationProfile({ ...profile, follower_count: followerCountResult.count || 0, }), featuredEvent: featuredEventResult.data ? { id: featuredEventResult.data.id, title: featuredEventResult.data.title, eventDate: featuredEventResult.data.event_date, applicationLink: featuredEventResult.data.application_link, createdAt: featuredEventResult.data.created_at, } : null, featuredVacancy: featuredVacancyResult.data ? { id: featuredVacancyResult.data.id, title: featuredVacancyResult.data.title, applicationDeadline: featuredVacancyResult.data.application_deadline, applicationMethod: featuredVacancyResult.data.application_method, applicationValue: featuredVacancyResult.data.application_value, createdAt: featuredVacancyResult.data.created_at, } : null, }), rlHeaders)
  } catch (error) {
    console.error('Error fetching organization:', error)
    return errorResponse('Daxili server xətası', "API_ERROR", {}, 500)
  }
}

// PUT /api/organizations/[id] - Update organization by account_id (admin-only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'publicRead', endpoint: '/api/organizations/[id]' })
    if (!rlResult.allowed) {
      return errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    }
    const supabase = createSupabaseAdminClient()

    const { data: organization, error: fetchError } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('account_id', params.id)
      .maybeSingle()

    if (fetchError || !organization) {
      return errorResponse('Təşkilat tapılmadı', "API_ERROR", {}, 404)
    }

    const session = await getServerSession()
    const admin = isAdmin(session)
    if (!admin) {
      return errorResponse('Təşkilat öz redaktəsi üçün /api/organizations/me istifadə edin. ID əsaslı yeniləmələr üçün admin girişi tələb olunur.', "API_ERROR", {}, 403)
    }

    const body = await request.json()
    const { status } = body
    const validation = validateOrganizationUpdatePayload(body)
    if (validation.error || !validation.data) {
      return errorResponse(validation.error || 'Yanlış məlumat', "API_ERROR", {}, 400)
    }

    if (validation.data.organizationName !== organization.organization_name) {
      const { data: existingOrganization } = await supabase
        .from('organization_profiles')
        .select('account_id')
        .ilike('organization_name', validation.data.organizationName)
        .neq('account_id', organization.account_id)
        .maybeSingle()

      if (existingOrganization) {
        return errorResponse('Bu adla təşkilat artıq mövcuddur', "API_ERROR", {}, 400)
      }
    }

    const profileUpdateData: any = {
      organization_name: validation.data.organizationName,
      ...(validation.data.organizationType ? { organization_type: validation.data.organizationType } : {}),
      description: validation.data.description,
      website: validation.data.website,
      contact_phone: validation.data.contactPhone,
      address: validation.data.address,
      registration_number: validation.data.registrationNumber,
      contact_person: validation.data.contactPerson,
      focus_areas: validation.data.focusAreas,
      social_links: validation.data.socialMedia,
      updated_at: new Date().toISOString()
    }

    if (admin && status) {
      profileUpdateData.moderation_status = status
      if (status === 'approved') {
        profileUpdateData.reviewed_by = session?.user?.id
        profileUpdateData.reviewed_at = new Date().toISOString()
        profileUpdateData.admin_comment = null
      }
      if (status === 'rejected') {
        profileUpdateData.reviewed_by = null
        profileUpdateData.reviewed_at = null
      }
    }

    const { data: updatedOrganization, error: updateError } = await supabase
      .from('organization_profiles')
      .update(profileUpdateData)
      .eq('account_id', organization.account_id)
      .select('*')
      .single()

    if (updateError || !updatedOrganization) {
      return errorResponse(updateError?.message || 'Yeniləmə uğursuz oldu', "API_ERROR", {}, 500)
    }

    return rlh(successResponse({ message: 'Təşkilat uğurla yeniləndi', organization: normalizeOrganizationProfile(updatedOrganization) }), rlHeaders)
  } catch (error) {
    console.error('Error updating organization:', error)
    return errorResponse('Daxili server xətası', "API_ERROR", {}, 500)
  }
}

// DELETE /api/organizations/[id] - Delete organization (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'publicRead', endpoint: '/api/organizations/[id]' })
    if (!rlResult.allowed) {
      return errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    }
    const session = await getServerSession()
    if (!session?.user?.id) {
      return errorResponse('İcazəsiz giriş', "API_ERROR", {}, 401)
    }

    if (!canAccessAdmin(session)) {
      return errorResponse('Admin girişi tələb olunur', "API_ERROR", {}, 403)
    }

    const supabase = createSupabaseAdminClient()

    const { data: organization } = await supabase
      .from('organization_profiles')
      .select('account_id')
      .eq('account_id', params.id)
      .maybeSingle()

    if (organization) {
      await supabase
        .from('organization_profiles')
        .delete()
        .eq('account_id', organization.account_id)

      await supabase.auth.admin.deleteUser(organization.account_id)
    }

    return successResponse({ message: 'Təşkilat uğurla silindi' })
  } catch (error) {
    console.error('Error deleting organization:', error)
    return errorResponse('Daxili server xətası', "API_ERROR", {}, 500)
  }
}
