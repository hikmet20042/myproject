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
  const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'authenticatedRead', endpoint: '/api/organizations/me' })
  try {
    if (!rlResult.allowed) {
      return rlh(errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429), rlHeaders)
    }
    const session = await getServerSession()
    if (!session?.user?.id) {
      return rlh(errorResponse('İcazəsiz giriş', "API_ERROR", {}, 401), rlHeaders)
    }

    if (!isOrganization(session)) {
      return rlh(errorResponse('Təşkilat hesabı tələb olunur', "API_ERROR", {}, 403), rlHeaders)
    }

    const supabase = createSupabaseAdminClient()
    const { data: organizationProfile } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('account_id', session.user.id)
      .maybeSingle()

    if (!organizationProfile) {
      return rlh(errorResponse('Təşkilat tapılmadı', "API_ERROR", {}, 404), rlHeaders)
    }

    const { count: followerCount } = await supabase
      .from('organization_followers')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', session.user.id)

    return rlh(successResponse({ organization: { ...normalizeOrganizationProfile({ ...organizationProfile, follower_count: followerCount || 0, }), urlHandle: organizationProfile.url_handle || null, }, }), rlHeaders)
  } catch (error) {
    console.error('Organization profile fetch error:', error)
    return rlh(errorResponse('Daxili server xətası', "API_ERROR", {}, 500), rlHeaders)
  }
}

export async function PUT(request: NextRequest) {
  const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'authenticatedRead', endpoint: '/api/organizations/me' })
  try {
    if (!rlResult.allowed) {
      return rlh(errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429), rlHeaders)
    }
    const session = await getServerSession()
    if (!session?.user?.id) {
      return rlh(errorResponse('İcazəsiz giriş', "API_ERROR", {}, 401), rlHeaders)
    }

    if (!isOrganization(session)) {
      return rlh(errorResponse('Təşkilat hesabı tələb olunur', "API_ERROR", {}, 403), rlHeaders)
    }

    const supabase = createSupabaseAdminClient()
    const { data: organizationProfile } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('account_id', session.user.id)
      .maybeSingle()

    if (!organizationProfile) {
      return rlh(errorResponse('Təşkilat tapılmadı', "API_ERROR", {}, 404), rlHeaders)
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
      return rlh(errorResponse(validation.error || 'Yanlış məlumat', "API_ERROR", {}, 400), rlHeaders)
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
          return rlh(errorResponse(msg, 'HANDLE_UNAVAILABLE', {}, 400), rlHeaders)
        }
        return rlh(errorResponse('Handle yenilənə bilmədi', 'HANDLE_UPDATE_FAILED', {}, 500), rlHeaders)
      }
    }

    if (Object.keys(updateData).length === 0) {
      return successResponse({ message: 'Təşkilat profili dəyişikliyi təqdim edilməyib', organization: current, })
    }

    updateData.updated_at = new Date().toISOString()

    const { data: updatedOrganization, error: updateError } = await supabase
      .from('organization_profiles')
      .update(updateData)
      .eq('account_id', session.user.id)
      .select('*')
      .single()

    if (updateError || !updatedOrganization) {
      return rlh(errorResponse(updateError?.message || 'Təşkilat profili yenilənə bilmədi', "API_ERROR", {}, 500), rlHeaders)
    }

    return rlh(successResponse({ message: 'Təşkilat profili uğurla yeniləndi', organization: { ...normalizeOrganizationProfile(updatedOrganization), urlHandle: updatedOrganization.url_handle || null, }, }), rlHeaders)
  } catch (error) {
    console.error('Organization profile update error:', error)
    return rlh(errorResponse('Daxili server xətası', "API_ERROR", {}, 500), rlHeaders)
  }
}
