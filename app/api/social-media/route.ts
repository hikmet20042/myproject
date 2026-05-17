import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isApprovedOrganization } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'authenticatedRead',
      endpoint: '/api/social-media',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const session = await getServerSession()
    
    if (!session?.user?.id) {
      const response = errorResponse('Unauthorized', "API_ERROR", {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const supabase = createSupabaseAdminClient()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('social_media, role')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      const response = errorResponse('User not found', "API_ERROR", {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    let organizationSocialMedia = null
    if (isApprovedOrganization(session)) {
      const { data: profile } = await supabase
        .from('organization_profiles')
        .select('social_links')
        .eq('account_id', session.user.id)
        .maybeSingle()

      organizationSocialMedia = profile?.social_links || {}
    }

    const response = successResponse({ socialMedia: user.social_media || {}, organizationSocialMedia })
    for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
    return response

  } catch (error) {
    console.error('Error fetching social media:', error)
    return errorResponse('Failed to fetch social media accounts', "API_ERROR", {}, 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'write',
      endpoint: '/api/social-media',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const session = await getServerSession()
    
    if (!session?.user?.id) {
      const response = errorResponse('Unauthorized', "API_ERROR", {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

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
            const response = errorResponse(`Invalid URL for ${platform}`, "API_ERROR", {}, 400)
            for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
            return response
          }
        }
        updateData.social_media = socialMedia
      }
    }

    if (type === 'organization' && isApprovedOrganization(session)) {
      if (organizationSocialMedia) {
        for (const [platform, url] of Object.entries(organizationSocialMedia)) {
          if (url && !validateUrl(url as string)) {
            const response = errorResponse(`Invalid URL for ${platform}`, "API_ERROR", {}, 400)
            for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
            return response
          }
        }
        
        const { data: organization, error: organizationError } = await supabase
          .from('organization_profiles')
          .update({ social_links: organizationSocialMedia, updated_at: new Date().toISOString() })
          .eq('account_id', session.user.id)
          .select('social_links')
          .single()

        if (organizationError || !organization) {
          const response = errorResponse('Organization not found', "API_ERROR", {}, 404)
          for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
          return response
        }

        const response = successResponse({ 
          message: 'Social media updated successfully',
          socialMedia: {},
          organizationSocialMedia: organization.social_links || {}
        })
        for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
        return response
      }
    }

    if (Object.keys(updateData).length === 0) {
      const response = errorResponse('No valid social media data provided', "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const { data: updatedUser, error: updatedUserError } = await supabase
      .from('users')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
      .select('social_media, role')
      .single()

    if (updatedUserError || !updatedUser) {
      const response = errorResponse('User not found', "API_ERROR", {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const response = successResponse({
      message: 'Social media accounts updated successfully',
      socialMedia: updatedUser.social_media || {},
      organizationSocialMedia: null
    })
    for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
    return response

  } catch (error) {
    console.error('Error updating social media:', error)
    return errorResponse('Failed to update social media accounts', "API_ERROR", {}, 500)
  }
}
