import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getOrganizationImagePath, resolveProfileImageUrl } from '@/lib/profileImageUrls'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 'API_ERROR', {}, 401)
    }

    if (session.user.accountType === 'organization') {
      return errorResponse('Organization accounts cannot access followed organizations list', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403)
    }

    const supabase = createSupabaseAdminClient()
    const { searchParams } = new URL(request.url)

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)))
    const search = (searchParams.get('search') || '').trim().toLowerCase()

    const { data: followRows, error: followsError } = await supabase
      .from('organization_followers')
      .select('organization_id, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (followsError) {
      return errorResponse('Failed to load followed organizations', 'API_ERROR', {}, 500)
    }

    const organizationIds = Array.from(
      new Set((followRows || []).map((row: any) => String(row.organization_id)).filter(Boolean))
    )

    if (organizationIds.length === 0) {
      return successResponse(
        { items: [] },
        {
          page,
          limit,
          total: 0,
          pages: 0,
        }
      )
    }

    const { data: profileRows, error: profilesError } = await supabase
      .from('organization_profiles')
      .select('account_id, url_handle, organization_name, profile_image, organization_type, description, focus_areas, address, website, moderation_status, updated_at')
      .in('account_id', organizationIds)
      .eq('moderation_status', 'approved')

    if (profilesError) {
      return errorResponse('Failed to load organization profiles', 'API_ERROR', {}, 500)
    }

    const followedAtByOrganization = new Map<string, string>(
      (followRows || []).map((row: any) => [String(row.organization_id), row.created_at])
    )

    const allItemsRaw = await Promise.all(
      (profileRows || []).map(async (row: any) => {
        const profileImagePath = getOrganizationImagePath(row.profile_image)
        const profileImageFallback = row.profile_image?.url || row.profile_image || ''
        const profileImageUrl = await resolveProfileImageUrl(supabase, profileImagePath, profileImageFallback)

        return {
        _id: String(row.account_id),
        id: String(row.account_id),
        slug: row.url_handle || String(row.account_id),
        urlHandle: row.url_handle || null,
        organizationName: row.organization_name || 'Təşkilat',
        profileImage: profileImageUrl || '',
        organizationType: row.organization_type || '',
        description: row.description || '',
        focusAreas: Array.isArray(row.focus_areas) ? row.focus_areas : [],
        address: row.address || '',
        website: row.website || '',
        followedAt: followedAtByOrganization.get(String(row.account_id)) || null,
        updatedAt: row.updated_at || null,
      }
    })
    )

    const allItems = allItemsRaw
      .filter((row: any) => {
        if (!search) return true
        const haystack = `${row.organizationName} ${row.description}`.toLowerCase()
        return haystack.includes(search)
      })
      .sort((a: any, b: any) => {
        const aDate = a.followedAt ? new Date(a.followedAt).getTime() : 0
        const bDate = b.followedAt ? new Date(b.followedAt).getTime() : 0
        return bDate - aDate
      })

    const total = allItems.length
    const pages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const end = start + limit
    const items = allItems.slice(start, end)

    return successResponse(
      { items },
      {
        page,
        limit,
        total,
        pages,
      }
    )
  } catch (error) {
    console.error('GET /api/users/organizations/followed error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}
