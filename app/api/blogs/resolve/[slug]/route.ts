import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { resolveEntityBySlugOrId } from '@/lib/identifier'
import { applyRateLimit } from '@/lib/rateLimit'

const rlh = (r: Response, h: Record<string, string>) => { for (const [k,v] of Object.entries(h)) r.headers.set(k,v); return r }

export const dynamic = 'force-dynamic'

// GET /api/blogs/resolve/[slug] - Resolve blog slug to id
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'publicRead', endpoint: '/api/blogs/resolve/[slug]' })
  if (!rlResult.allowed) {
    return rlh(errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429), rlHeaders)
  }
  try {
    const supabase = createSupabaseAdminClient()
    const slug = String(params?.slug || '').trim()

    if (!slug) {
      return rlh(errorResponse('Blog slug is required', 'VALIDATION_ERROR', {}, 400), rlHeaders)
    }

    const { data, error } = await resolveEntityBySlugOrId(supabase, 'blogs', slug, 'id,slug')

    if (error || !data?.id) {
      return rlh(errorResponse('Blog not found', 'BLOG_NOT_FOUND', {}, 404), rlHeaders)
    }

    return rlh(successResponse({ id: data.id, slug: data.slug }), rlHeaders)
  } catch (err) {
    console.error('GET /api/blogs/resolve/[slug] error:', err)
    return errorResponse('Failed to resolve blog', 'RESOLVE_BLOG_FAILED', {}, 500)
  }
}
