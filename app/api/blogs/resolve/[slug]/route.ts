import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

export const dynamic = 'force-dynamic'

// GET /api/blogs/resolve/[slug] - Resolve blog slug to id
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    const slug = String(params?.slug || '').trim()

    if (!slug) {
      return errorResponse('Blog slug is required', 'VALIDATION_ERROR', {}, 400)
    }

    const { data, error } = await resolveEntityBySlugOrId(
      supabase,
      'blogs',
      slug,
      'id,slug'
    )

    if (error || !data?.id) {
      return errorResponse('Blog not found', 'BLOG_NOT_FOUND', {}, 404)
    }

    return successResponse({ id: data.id, slug: data.slug })
  } catch (err) {
    console.error('GET /api/blogs/resolve/[slug] error:', err)
    return errorResponse('Failed to resolve blog', 'RESOLVE_BLOG_FAILED', {}, 500)
  }
}
