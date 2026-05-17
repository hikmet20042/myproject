import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

export const dynamic = 'force-dynamic'

// GET /api/organizations/resolve/[slug] - Resolve organization slug/handle to account_id
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    const slug = String(params?.slug || '').trim()

    if (!slug) {
      return errorResponse('Organization slug is required', 'VALIDATION_ERROR', {}, 400)
    }

    const { data, error } = await resolveEntityBySlugOrId(
      supabase,
      'organization_profiles',
      slug,
      'account_id,url_handle,slug'
    )

    if (error || !data?.account_id) {
      return errorResponse('Organization not found', 'ORG_NOT_FOUND', {}, 404)
    }

    return successResponse({
      id: data.account_id,
      slug: data.url_handle || data.slug,
    })
  } catch (err) {
    console.error('GET /api/organizations/resolve/[slug] error:', err)
    return errorResponse('Failed to resolve organization', 'RESOLVE_ORG_FAILED', {}, 500)
  }
}
