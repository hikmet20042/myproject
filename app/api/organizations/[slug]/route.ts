import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canAccessAdmin, isAdmin } from '@/lib/auth/permissions'
import { normalizeOrganizationProfile, validateOrganizationUpdatePayload } from '@/lib/organizationProfile'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

export const dynamic = 'force-dynamic'

// GET - Get single organization by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const supabase = createSupabaseAdminClient()
    const { data: resolvedOrg, error: resolveError } = await resolveEntityBySlugOrId(
      supabase,
      'organization_profiles',
      slug,
      'account_id'
    )

    if (resolveError || !resolvedOrg?.account_id) {
      return errorResponse('Organization not found', "API_ERROR", {}, 404)
    }

    const { data: profile, error: profileError } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('account_id', resolvedOrg.account_id)
      .eq('moderation_status', 'approved')
      .maybeSingle()

    if (profileError || !profile) {
      return errorResponse('Organization not found', "API_ERROR", {}, 404)
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

    return successResponse({
      organization: normalizeOrganizationProfile({
        ...profile,
        follower_count: followerCountResult.count || 0,
      }),
      featuredEvent: featuredEventResult.data
        ? {
            id: featuredEventResult.data.id,
            title: featuredEventResult.data.title,
            eventDate: featuredEventResult.data.event_date,
            applicationLink: featuredEventResult.data.application_link,
            createdAt: featuredEventResult.data.created_at,
          }
        : null,
      featuredVacancy: featuredVacancyResult.data
        ? {
            id: featuredVacancyResult.data.id,
            title: featuredVacancyResult.data.title,
            applicationDeadline: featuredVacancyResult.data.application_deadline,
            applicationMethod: featuredVacancyResult.data.application_method,
            applicationValue: featuredVacancyResult.data.application_value,
            createdAt: featuredVacancyResult.data.created_at,
          }
        : null,
    })
  } catch (error) {
    console.error('Error fetching organization:', error)
    return errorResponse('Internal server error', "API_ERROR", {}, 500)
  }
}

// PUT - Update organization by slug (admin-only).
// Organization self-edit must go through /api/organizations/me.
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const supabase = createSupabaseAdminClient()
    const { data: resolvedOrg, error: resolveError } = await resolveEntityBySlugOrId(
      supabase,
      'organization_profiles',
      slug,
      'account_id'
    )

    if (resolveError || !resolvedOrg?.account_id) {
      return errorResponse('Organization not found', "API_ERROR", {}, 404)
    }

    const { data: organization, error: fetchError } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('account_id', resolvedOrg.account_id)
      .maybeSingle()

    if (fetchError || !organization) {
      return errorResponse('Organization not found', "API_ERROR", {}, 404)
    }

    // Check permissions - organization owner or admin
    const session = await getServerSession()
    const admin = isAdmin(session)
    if (!admin) {
      return errorResponse('Use /api/organizations/me for organization self-edit. Admin access required for slug-based updates.', "API_ERROR", {}, 403)
    }

    const body = await request.json()
    const { status } = body
    const validation = validateOrganizationUpdatePayload(body)
    if (validation.error || !validation.data) {
      return errorResponse(validation.error || 'Invalid payload', "API_ERROR", {}, 400)
    }

    // Check if another organization with same name exists (excluding current organization)
    if (validation.data.organizationName !== organization.organization_name) {
      const { data: existingOrganization } = await supabase
        .from('organization_profiles')
        .select('account_id')
        .ilike('organization_name', validation.data.organizationName)
        .neq('account_id', organization.account_id)
        .maybeSingle()

      if (existingOrganization) {
        return errorResponse('An organization with this name already exists', "API_ERROR", {}, 400)
      }
    }

    // Prepare update data
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

    // Only admins can change status
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

    // `is_verified` column is not present in current schema.
    // Keep `isVerified` as derived frontend state from moderation status.

    const { data: updatedOrganization, error: updateError } = await supabase
      .from('organization_profiles')
      .update(profileUpdateData)
      .eq('account_id', resolvedOrg.account_id)
      .select('*')
      .single()

    if (updateError || !updatedOrganization) {
      return errorResponse(updateError?.message || 'Update failed', "API_ERROR", {}, 500)
    }

    return successResponse({
      message: 'Organization updated successfully',
      organization: normalizeOrganizationProfile(updatedOrganization)
    })
  } catch (error) {
    console.error('Error updating organization:', error)
    return errorResponse('Internal server error', "API_ERROR", {}, 500)
  }
}

// DELETE - Delete organization (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401)
    }

    if (!canAccessAdmin(session)) {
      return errorResponse('Admin access required', "API_ERROR", {}, 403)
    }

    const { slug } = params
    const supabase = createSupabaseAdminClient()

    const { data: resolvedOrg, error: resolveError } = await resolveEntityBySlugOrId(
      supabase,
      'organization_profiles',
      slug,
      'account_id'
    )

    if (resolveError || !resolvedOrg?.account_id) {
      return successResponse({ message: 'Organization deleted successfully' })
    }

    const { data: organization } = await supabase
      .from('organization_profiles')
      .select('account_id')
      .eq('account_id', resolvedOrg.account_id)
      .maybeSingle()

    if (organization) {
      await supabase
        .from('organization_profiles')
        .delete()
        .eq('account_id', resolvedOrg.account_id)

      await supabase.auth.admin.deleteUser(organization.account_id)
    }

    return successResponse({ message: 'Organization deleted successfully' })
  } catch (error) {
    console.error('Error deleting organization:', error)
    return errorResponse('Internal server error', "API_ERROR", {}, 500)
  }
}
