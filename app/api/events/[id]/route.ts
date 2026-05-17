import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdmin, isAdminOrOwner, isOwner } from "@/lib/auth/permissions";
import {
  applyEventLifecycleRules,
  canViewEventRecord,
  errorResponse,
  mapEventInputToDbPayload,
  mapEventToResponse,
  successResponse,
  validateLifecycleState,
  validateEventInput,
} from "@/app/api/events/helpers";
import { getContentViewCounts } from "@/lib/viewTracking";

const hydrateEventRowWithOrganizationHandles = async (supabase: any, eventRow: any) => {
  const orgId = eventRow?.created_by_organization
    ? String(
        typeof eventRow.created_by_organization === 'object'
          ? eventRow.created_by_organization.id
          : eventRow.created_by_organization
      )
    : null

  if (!orgId) {
    return eventRow
  }

  const { data: orgProfile } = await supabase
    .from('organization_profiles')
    .select('account_id, organization_name, email, slug, url_handle')
    .eq('account_id', orgId)
    .maybeSingle()

  if (!orgProfile) {
    return eventRow
  }

  return {
    ...eventRow,
    created_by_organization: {
      id: orgId,
      organization_name:
        orgProfile.organization_name ||
        eventRow?.organization_name ||
        eventRow?.created_by_organization?.organization_name ||
        null,
      email:
        orgProfile.email ||
        eventRow?.created_by_organization?.email ||
        null,
      slug: orgProfile.slug || null,
      url_handle: orgProfile.url_handle || null,
    },
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();
    const eventId = String(params.id || '').trim()

    const { data: eventRow, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error || !eventRow) {
      return errorResponse("Event not found", 404);
    }

    const session = await getServerSession();
    if (!canViewEventRecord(session, eventRow)) {
      return errorResponse("Unauthorized", 403);
    }

    const stats = await getContentViewCounts(supabase, 'event', eventRow.id);
    const { count: savesCount } = await supabase
      .from('content_saves')
      .select('*', { count: 'exact', head: true })
      .eq('content_type', 'event')
      .eq('content_id', eventRow.id)

    const hydratedEventRow = await hydrateEventRowWithOrganizationHandles(supabase, eventRow)
    const event = mapEventToResponse(hydratedEventRow);

    return successResponse({ 
      event: { 
        ...event, 
        views: stats.views,
        uniqueViews: stats.uniqueViews,
        saves: savesCount || 0,
        analytics: {
          ...event.analytics,
          views: stats.views,
          uniqueViews: stats.uniqueViews
        }
      } 
    });
  } catch (error) {
    console.error('GET /api/events/[id] error:', error);
    return errorResponse("Failed to fetch event", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse("Authentication required", 401);
    }

    const supabase = createSupabaseAdminClient();
    const eventId = String(params.id || '').trim()

    const { data: eventRow, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !eventRow) {
      return errorResponse("Event not found", 404);
    }

    const owner = isOwner(session, eventRow);
    const admin = isAdmin(session);

    if (!owner && !admin) {
      return errorResponse("Permission denied", 403);
    }

    const lifecycleState = validateLifecycleState(eventRow);
    if (!lifecycleState.valid) {
      return errorResponse(lifecycleState.error || "Invalid lifecycle state", 409);
    }

    const body = await request.json();
    const validation = validateEventInput(body, { partial: true });
    if (!validation.valid) {
      return errorResponse(validation.error || "Invalid event data", 400);
    }

    const updateData = mapEventInputToDbPayload(body, { partial: true }) as Record<string, any>;
    const nextApplicationLink = updateData.application_link ?? eventRow.application_link;
    if (!nextApplicationLink) {
      return errorResponse("applicationLink is required", 400);
    }
    if (eventRow.status === "approved" && eventRow.is_published === true && owner) {
      const lifecycleResult = applyEventLifecycleRules(eventRow, "ownerEditApproved", { role: "owner", id: session.user.id });
      if (!lifecycleResult.ok) {
        return errorResponse(lifecycleResult.error || "Invalid lifecycle transition", 409);
      }
      Object.assign(updateData, lifecycleResult.updateData);
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updatedRow, error: updateError } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", eventId)
      .select("*")
      .single();

    if (updateError || !updatedRow) {
      return errorResponse("Failed to update event", 500);
    }

    const hydratedUpdatedRow = await hydrateEventRowWithOrganizationHandles(supabase, updatedRow)

    return successResponse(
      { event: mapEventToResponse(hydratedUpdatedRow) },
      { message: "Event updated successfully" }
    );
  } catch (error) {
    return errorResponse("Failed to update event", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse("Authentication required", 401);
    }

    const supabase = createSupabaseAdminClient();
    const eventId = String(params.id || '').trim()

    const { data: eventRow, error: eventError } = await supabase
      .from("events")
      .select("id, created_by, created_by_organization")
      .eq("id", eventId)
      .single();

    if (eventError || !eventRow) {
      return errorResponse("Event not found", 404);
    }

    if (!isAdminOrOwner(session, eventRow)) {
      return errorResponse("Permission denied", 403);
    }

    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (deleteError) {
      return errorResponse("Failed to delete event", 500);
    }

    return successResponse(
      { id: eventId },
      { message: "Event deleted successfully" }
    );
  } catch (error) {
    return errorResponse("Failed to delete event", 500);
  }
}