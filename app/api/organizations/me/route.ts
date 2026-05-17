import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { normalizeOrganizationProfile, validateOrganizationUpdatePayload } from '@/lib/organizationProfile'
import { isOrganization } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

const rlh = (r: Response, h: Record<string, string>) => { for (const [k,v] of Object.entries(h)) r.headers.set(k,v); return r }

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'authenticatedRead', endpoint: '/api/organizations/me' })
    if (!rlResult.allowed) {
      return errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    }
    const session = await getServerSession()
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401)
    }

    if (!isOrganization(session)) {
      return errorResponse('Organization account required', "API_ERROR", {}, 403)
    }

    const supabase = createSupabaseAdminClient()
    const { data: organizationProfile } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('account_id', session.user.id)
      .maybeSingle()

    if (!organizationProfile) {
      return errorResponse('Organization not found', "API_ERROR", {}, 404)
    }

    if (organizationProfile.account_id !== session.user.id) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 403)
    }

    const { count: followerCount } = await supabase
      .from('organization_followers')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', session.user.id)

    return rlh(successResponse({ organization: { ...normalizeOrganizationProfile({ ...organizationProfile, follower_count: followerCount || 0, }), urlHandle: organizationProfile.url_handle || null, }, }), rlHeaders)
  } catch (error) {
    console.error('Organization profile fetch error:', error)
    return errorResponse('Internal server error', "API_ERROR", {}, 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'authenticatedRead', endpoint: '/api/organizations/me' })
    if (!rlResult.allowed) {
      return errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    }
    const session = await getServerSession()
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401)
    }

    if (!isOrganization(session)) {
      return errorResponse('Organization account required', "API_ERROR", {}, 403)
    }

    const supabase = createSupabaseAdminClient()
    const { data: organizationProfile } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('account_id', session.user.id)
      .maybeSingle()

    if (!organizationProfile) {
      return errorResponse('Organization not found', "API_ERROR", {}, 404)
    }

    if (organizationProfile.account_id !== session.user.id) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 403)
    }

    const body = await request.json()
    const hasOwn = (key: string) => Object.prototype.hasOwnProperty.call(body, key)
    const current = normalizeOrganizationProfile(organizationProfile)
    const mergedPayload = {
      ...current,
      ...body,
      contactPerson:
        body?.contactPerson && typeof body.contactPerson === 'object'
          ? { ...current.contactPerson, ...body.contactPerson }
          : current.contactPerson,
      socialMedia:
        body?.socialMedia && typeof body.socialMedia === 'object'
          ? { ...current.socialMedia, ...body.socialMedia }
          : current.socialMedia,
      focusAreas: hasOwn('focusAreas') ? body.focusAreas : current.focusAreas,
    }

    const validation = validateOrganizationUpdatePayload(mergedPayload)
    if (validation.error || !validation.data) {
      return errorResponse(validation.error || 'Invalid payload', "API_ERROR", {}, 400)
    }

    const updateData: Record<string, any> = {}
    if (hasOwn('organizationName')) updateData.organization_name = validation.data.organizationName
    if (hasOwn('organizationType')) updateData.organization_type = validation.data.organizationType || null
    if (hasOwn('description')) updateData.description = validation.data.description
    if (hasOwn('website')) updateData.website = validation.data.website
    if (hasOwn('contactPhone')) updateData.contact_phone = validation.data.contactPhone
    if (hasOwn('address')) updateData.address = validation.data.address
    if (hasOwn('registrationNumber')) updateData.registration_number = validation.data.registrationNumber
    if (hasOwn('contactPerson')) updateData.contact_person = validation.data.contactPerson
    if (hasOwn('focusAreas')) updateData.focus_areas = validation.data.focusAreas
    if (hasOwn('socialMedia')) updateData.social_links = validation.data.socialMedia

    // Handle URL handle update
    if (hasOwn('urlHandle')) {
      const normalizedHandle = body.urlHandle === '' ? null : String(body.urlHandle).toLowerCase().trim()
      const { error: handleError } = await supabase
        .from('organization_profiles')
        .update({ url_handle: normalizedHandle, updated_at: new Date().toISOString() })
        .eq('account_id', session.user.id)
      if (handleError) {
        const msg = handleError.message || ''
        if (msg.includes('reserved') || msg.includes('Handle') || msg.includes('duplicate') || msg.includes('unique')) {
          return errorResponse(msg, 'HANDLE_UNAVAILABLE', {}, 400)
        }
        return errorResponse('Failed to update handle', 'HANDLE_UPDATE_FAILED', {}, 500)
      }
    }

    if (Object.keys(updateData).length === 0) {
      return successResponse({ message: 'No organization profile changes provided', organization: current, })
    }

    updateData.updated_at = new Date().toISOString()

    const { data: updatedOrganization, error: updateError } = await supabase
      .from('organization_profiles')
      .update(updateData)
      .eq('account_id', session.user.id)
      .select('*')
      .single()

    if (updateError || !updatedOrganization) {
      return errorResponse(updateError?.message || 'Failed to update organization profile', "API_ERROR", {}, 500)
    }

    return rlh(successResponse({ message: 'Organization profile updated successfully', organization: { ...normalizeOrganizationProfile(updatedOrganization), urlHandle: updatedOrganization.url_handle || null, }, }), rlHeaders)
  } catch (error) {
    console.error('Organization profile update error:', error)
    return errorResponse('Internal server error', "API_ERROR", {}, 500)
  }
}
