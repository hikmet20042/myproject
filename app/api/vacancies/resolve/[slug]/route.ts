import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveEntityBySlugOrId } from "@/lib/identifier";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const supabase = createSupabaseAdminClient();
    const slug = String(params?.slug || "").trim();

    const { data, error } = await resolveEntityBySlugOrId(
      supabase,
      "vacancies",
      slug,
      "id, slug",
    );

    if (error || !data?.id) {
      return errorResponse("Vacancy not found", "API_ERROR", {}, 404);
    }

    return successResponse({ id: data.id, slug: data.slug || slug });
  } catch (error) {
    return errorResponse("Failed to resolve vacancy", "API_ERROR", {}, 500);
  }
}
