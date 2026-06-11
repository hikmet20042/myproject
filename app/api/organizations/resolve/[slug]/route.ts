import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { resolveEntityBySlugOrId } from '@/lib/identifier'
import { applyRateLimit } from '@/lib/rateLimit'

const rlh = (r: Response, h: Record<string, string>) => { for (const [k,v] of Object.entries(h)) r.headers.set(k,v); return r }

export const dynamic = 'force-dynamic'

// GET /api/organizations/resolve/[slug] - Resolve organization slug/handle to account_id
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'publicRead', endpoint: '/api/organizations/resolve/[slug]' })
  if (!rlResult.allowed) {
    return rlh(errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429), rlHeaders)
  }
  try {
    const supabase = createSupabaseAdminClient()
    const slug = String(params?.slug || '').trim()

    if (!slug) {
      return rlh(errorResponse('Təşkilat slug tələb olunur', 'VALIDATION_ERROR', {}, 400), rlHeaders)
    }

    const { data, error } = await resolveEntityBySlugOrId(supabase, 'organization_profiles', slug, 'account_id,url_handle,slug')

    if (error || !data?.account_id) {
      return rlh(errorResponse('Təşkilat tapılmadı', 'ORG_NOT_FOUND', {}, 404), rlHeaders)
    }

    return rlh(successResponse({ id: data.account_id, slug: data.url_handle || data.slug }), rlHeaders)
  } catch (err) {
    console.error('GET /api/organizations/resolve/[slug] error:', err)
    return errorResponse('Təşkilat həll edilə bilmədi', 'RESOLVE_ORG_FAILED', {}, 500)
  }
}
