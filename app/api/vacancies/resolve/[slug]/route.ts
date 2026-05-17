import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveEntityBySlugOrId } from "@/lib/identifier";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { applyRateLimit } from '@/lib/rateLimit'

const rlh = (r: Response, h: Record<string, string>) => { for (const [k,v] of Object.entries(h)) r.headers.set(k,v); return r }

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'publicRead', endpoint: '/api/vacancies/resolve/[slug]' })
  if (!rlResult.allowed) {
    return rlh(errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429), rlHeaders)
  }
  try {
    const supabase = createSupabaseAdminClient();
    const slug = String(params?.slug || "").trim();

    const { data, error } = await resolveEntityBySlugOrId(supabase, "vacancies", slug, "id, slug");

    if (error || !data?.id) {
      return rlh(errorResponse("Vacancy not found", "API_ERROR", {}, 404), rlHeaders)
    }

    return rlh(successResponse({ id: data.id, slug: data.slug || slug }), rlHeaders)
  } catch (error) {
    return errorResponse("Failed to resolve vacancy", "API_ERROR", {}, 500)
  }
}
