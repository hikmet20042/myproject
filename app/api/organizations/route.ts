import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isOrganizationType } from '@/lib/organizationTypes'
import { canAccessAdmin } from '@/lib/auth/permissions'
import { normalizeOrganizationProfile } from '@/lib/organizationProfile'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getOrganizationImagePath, resolveProfileImageUrl } from '@/lib/profileImageUrls'
import { applyRateLimit } from '@/lib/rateLimit'

// Force dynamic rendering due to request.url usage
export const dynamic = 'force-dynamic'

// GET /api/organizations - Get organizations
export async function GET(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'publicRead',
      endpoint: '/api/organizations',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse(
        'Too many requests. Please try again later.',
        'RATE_LIMIT_EXCEEDED',
        { retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000) },
        429
      )
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const supabase = createSupabaseAdminClient()
    const session = await getServerSession()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const search = searchParams.get('search')
    const organizationType = searchParams.get('organizationType')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const myOrganizations = searchParams.get('myOrganizations') === 'true'
    const status = searchParams.get('status')
    
    const start = (page - 1) * limit
    const end = start + limit - 1
    
    // If requesting user's organizations (not applicable for independent organizations)
    if (myOrganizations) {
      // This endpoint is not used for independent organizations
      // Organizations should use their own dashboard API
      return errorResponse('Use organization-specific endpoints for organization data', "API_ERROR", {}, 400)
    } else {
      // For public access, only show approved organizations
    }
    
    // Filter by status if provided (for admin or own organizations)
    const effectiveStatus = status && ['pending', 'approved', 'rejected'].includes(status) && (canAccessAdmin(session) || myOrganizations)
      ? status
      : 'approved'
    
    // Category filter
    let query = supabase
      .from('organization_profiles')
      .select('account_id, url_handle, organization_name, profile_image, organization_type, description, focus_areas, address, website, contact_phone, contact_person, social_links, registration_number, moderation_status, created_at, updated_at, reviewed_by, reviewed_at', { count: 'exact' })
      .eq('moderation_status', effectiveStatus)
    
    // Location filter
    if (category && category !== 'all') {
      query = query.contains('focus_areas', [category])
    }

    if (location && location !== 'all') {
      query = query.ilike('address', `%${location}%`)
    }

    // Organization type filter
    if (organizationType && organizationType !== 'all') {
      if (isOrganizationType(organizationType)) {
        query = query.eq('organization_type', organizationType)
      }
    }
    
    // Search filter
    if (search) {
      query = query.or(
        `organization_name.ilike.%${search}%,description.ilike.%${search}%,contact_person->>name.ilike.%${search}%`
      )
    }
    
    // Build sort object using valid DB column names
    const sortColumnMap: Record<string, string> = {
      name: 'organization_name',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
    const sortColumn = sortColumnMap[sortBy] || 'created_at'
    query = query.order(sortColumn, { ascending: sortOrder !== 'desc' })
    query = query.range(start, end)

    const { data: organizations = [], count, error } = await query
    if (error) {
      throw error
    }
    const organizationRows = organizations || []
    
    // Transform data for frontend
    const transformedOrganizations = await Promise.all(organizationRows.map(async (organization: any) => {
      const profileImagePath = getOrganizationImagePath(organization.profile_image)
      const profileImageFallback = organization.profile_image?.url || organization.profile_image || null
      const profileImageUrl = await resolveProfileImageUrl(supabase, profileImagePath, profileImageFallback)

      const normalized = normalizeOrganizationProfile(organization)
      return {
        ...normalized,
        profileImage: profileImageUrl || normalized.profileImage,
        _id: normalized.id,
        slug: organization.url_handle || normalized.id,
        urlHandle: organization.url_handle || null,
      }
    }))

    const successResp = successResponse(
      {
        items: transformedOrganizations,
      },
      {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      }
    )
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      successResp.headers.set(key, value)
    }
    return successResp
    
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return errorResponse('Failed to fetch organizations', "API_ERROR", {}, 500)
  }
}

// POST - Create new organization (This endpoint is deprecated for independent organizations)
export async function POST(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'auth',
      endpoint: '/api/organizations',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse(
        'Too many requests. Please try again later.',
        'RATE_LIMIT_EXCEEDED',
        { retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000) },
        429
      )
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    // This endpoint is no longer used for creating organizations
    // Organizations are now created through the registration process
    const response = errorResponse('Organization creation is handled through the registration process. Please use /api/auth/register with type=organization', "API_ERROR", {}, 400)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    console.error('Error in deprecated organization creation endpoint:', error)
    return errorResponse('Internal server error', "API_ERROR", {}, 500)
  }
}
