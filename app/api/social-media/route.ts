import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isApprovedOrganization } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { handleApiRequest, withRateLimitHeaders } from '@/lib/apiHelpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const result = await handleApiRequest(request, {
    rateLimit: 'authenticatedRead',
    requireAuth: true,
    endpoint: '/api/social-media',
  })
  if (result instanceof Response) return result

  const { session, rateLimitHeaders } = result
  const supabase = createSupabaseAdminClient()

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('social_media, role')
    .eq('id', session!.user.id)
    .single()

  if (userError || !user) {
    return withRateLimitHeaders(errorResponse('User not found', "API_ERROR", {}, 404), rateLimitHeaders)
  }

  let organizationSocialMedia = null
  if (isApprovedOrganization(session!)) {
    const { data: profile } = await supabase
      .from('organization_profiles')
      .select('social_links')
      .eq('account_id', session!.user.id)
      .maybeSingle()

    organizationSocialMedia = profile?.social_links || {}
  }

  return withRateLimitHeaders(successResponse({ socialMedia: user.social_media || {}, organizationSocialMedia }), rateLimitHeaders)
}

export async function PUT(request: NextRequest) {
  const result = await handleApiRequest(request, {
    rateLimit: 'write',
    requireAuth: true,
    endpoint: '/api/social-media',
  })
  if (result instanceof Response) return result

  const { session, rateLimitHeaders } = result
  const supabase = createSupabaseAdminClient()

  const body = await request.json()
  const { socialMedia, organizationSocialMedia, type } = body

  const validateUrl = (url: string) => {
    if (!url) return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const updateData: any = {}

  if (type === 'user' || !type) {
    if (socialMedia) {
      for (const [platform, url] of Object.entries(socialMedia)) {
        if (url && !validateUrl(url as string)) {
          return withRateLimitHeaders(errorResponse(`Invalid URL for ${platform}`, "API_ERROR", {}, 400), rateLimitHeaders)
        }
      }
      updateData.social_media = socialMedia
    }
  }

  if (type === 'organization' && isApprovedOrganization(session!)) {
    if (organizationSocialMedia) {
      for (const [platform, url] of Object.entries(organizationSocialMedia)) {
        if (url && !validateUrl(url as string)) {
          return withRateLimitHeaders(errorResponse(`Invalid URL for ${platform}`, "API_ERROR", {}, 400), rateLimitHeaders)
        }
      }
      
      const { data: organization, error: organizationError } = await supabase
        .from('organization_profiles')
        .update({ social_links: organizationSocialMedia, updated_at: new Date().toISOString() })
        .eq('account_id', session!.user.id)
        .select('social_links')
        .single()

      if (organizationError || !organization) {
        return withRateLimitHeaders(errorResponse('Organization not found', "API_ERROR", {}, 404), rateLimitHeaders)
      }

      return withRateLimitHeaders(successResponse({ 
        message: 'Social media updated successfully',
        socialMedia: {},
        organizationSocialMedia: organization.social_links || {}
      }), rateLimitHeaders)
    }
  }

  if (Object.keys(updateData).length === 0) {
    return withRateLimitHeaders(errorResponse('No valid social media data provided', "API_ERROR", {}, 400), rateLimitHeaders)
  }

  const { data: updatedUser, error: updatedUserError } = await supabase
    .from('users')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', session!.user.id)
    .select('social_media, role')
    .single()

  if (updatedUserError || !updatedUser) {
    return withRateLimitHeaders(errorResponse('User not found', "API_ERROR", {}, 404), rateLimitHeaders)
  }

  return withRateLimitHeaders(successResponse({
    message: 'Social media accounts updated successfully',
    socialMedia: updatedUser.social_media || {},
    organizationSocialMedia: null
  }), rateLimitHeaders)
}
