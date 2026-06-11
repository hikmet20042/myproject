import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveEntityBySlugOrId } from "@/lib/identifier";
import { errorResponse, successResponse } from "@/app/api/events/helpers";
import { applyRateLimit } from '@/lib/rateLimit'

const rlh = (r: Response, h: Record<string, string>) => { for (const [k,v] of Object.entries(h)) r.headers.set(k,v); return r }

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'publicRead', endpoint: '/api/events/resolve/[slug]' })
  if (!rlResult.allowed) {
    return rlh(errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 429), rlHeaders)
  }
  try {
    const supabase = createSupabaseAdminClient();
    const slug = String(params?.slug || "").trim();

    const { data, error } = await resolveEntityBySlugOrId(supabase, "events", slug, "id, slug");

    if (error || !data?.id) {
      return rlh(errorResponse("Tədbir tapılmadı", 404), rlHeaders)
    }

    return rlh(successResponse({ id: data.id, slug: data.slug || slug }), rlHeaders)
  } catch (error) {
    return rlh(errorResponse("Tədbir həll edilə bilmədi", 500), rlHeaders)
  }
}
