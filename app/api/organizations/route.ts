import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isOrganizationType } from '@/lib/organizationTypes'

// Force dynamic rendering due to request.url usage
export const dynamic = 'force-dynamic'

// GET /api/organizations - Get organizations
export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Use organization-specific endpoints for organization data' }, { status: 400 })
    } else {
      // For public access, only show approved organizations
    }
    
    // Filter by status if provided (for admin or own organizations)
    const effectiveStatus = status && ['pending', 'approved', 'rejected'].includes(status) && (session?.user?.role === 'admin' || myOrganizations)
      ? status
      : 'approved'
    
    // Category filter
    let query = supabase
      .from('organization_profiles')
      .select('account_id, organization_name, organization_type, description, focus_areas, address, website, contact_phone, contact_person, social_links, registration_number, moderation_status, created_at, updated_at, reviewed_by, reviewed_at', { count: 'exact' })
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
    const transformedOrganizations = organizationRows.map((organization: any) => ({
      // Keep field names consistent with frontend expectations
      _id: organization.account_id || organization.id,
      organizationName: organization.organization_name,
      organizationType: organization.organization_type,
      description: organization.description,
      focusAreas: organization.focus_areas || [],
      address: organization.address || 'Not specified',
      website: organization.website || '',
      contactPhone: organization.contact_phone || '',
      contactPerson: organization.contact_person,
      socialMedia: organization.social_links || {},
      registrationNumber: organization.registration_number,
      status: organization.moderation_status,
      createdAt: organization.created_at,
      updatedAt: organization.updated_at,
      approvedBy: organization.reviewed_by,
      approvedAt: organization.reviewed_at
    }))
    
    return NextResponse.json({
      organizations: transformedOrganizations,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
    
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}

// POST - Create new organization (This endpoint is deprecated for independent organizations)
export async function POST(request: NextRequest) {
  try {
    // This endpoint is no longer used for creating organizations
    // Organizations are now created through the registration process
    return NextResponse.json({
      error: 'Organization creation is handled through the registration process. Please use /api/auth/register with type=organization'
    }, { status: 400 })
  } catch (error) {
    console.error('Error in deprecated organization creation endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
