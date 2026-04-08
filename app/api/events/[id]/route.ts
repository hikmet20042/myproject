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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: eventRow, error } = await supabase
      .from("events")
      .select("*, created_by (id, name, email), created_by_organization (id, organization_name, email), approved_by (id, name)")
      .eq("id", params.id)
      .single();

    if (error || !eventRow) {
      return errorResponse("Event not found", 404);
    }

    const session = await getServerSession();
    if (!canViewEventRecord(session, eventRow)) {
      return errorResponse("Unauthorized", 403);
    }

    return successResponse({ event: mapEventToResponse(eventRow) });
  } catch (error) {
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

    const { data: eventRow, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", params.id)
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
      .eq("id", params.id)
      .select("*, created_by (id, name, email), created_by_organization (id, organization_name, email), approved_by (id, name)")
      .single();

    if (updateError || !updatedRow) {
      return errorResponse("Failed to update event", 500);
    }

    return successResponse(
      { event: mapEventToResponse(updatedRow) },
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
    const { data: eventRow, error: eventError } = await supabase
      .from("events")
      .select("id, created_by, created_by_organization")
      .eq("id", params.id)
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
      .eq("id", params.id);

    if (deleteError) {
      return errorResponse("Failed to delete event", 500);
    }

    return successResponse(
      { id: params.id },
      { message: "Event deleted successfully" }
    );
  } catch (error) {
    return errorResponse("Failed to delete event", 500);
  }
}
