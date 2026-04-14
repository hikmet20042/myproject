import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import cloudinaryService from "@/lib/services/cloudinaryService";
import { canAccessAdmin, canCreateEvent, isApprovedOrganization } from "@/lib/auth/permissions";
import { NotificationService } from "@/features/notifications/services/notificationService";
import {
  applyEventLifecycleRules,
  errorResponse,
  getEventsByOwner,
  mapEventInputToDbPayload,
  mapEventToResponse,
  successResponse,
  validateEventInput,
} from "@/app/api/events/helpers";

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const limitParam = parseInt(searchParams.get("limit") || "20", 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 20;
    const category = searchParams.get("category");
    const eventType = searchParams.get("eventType");
    const trainingType = searchParams.get("trainingType");
    const location = searchParams.get("location");
    const month = searchParams.get("month");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const createdBy = searchParams.get("createdBy");
    const organizationId = searchParams.get("organizationId");
    const author = searchParams.get("author");
    const adminView = searchParams.get("adminView") === "true";
    const sortBy = searchParams.get("sortBy") || "eventDate";
    const sortOrder = searchParams.get("sortOrder") === "desc" ? -1 : 1;
    const skip = (page - 1) * limit;

    let session = null;
    let actualCreatedBy = createdBy;

    if (author === "me") {
      session = await getServerSession();
      const ownerResult = getEventsByOwner(session);
      if (ownerResult.error) {
        return ownerResult.error;
      }
      actualCreatedBy = ownerResult.ownerId;
    }

    if (adminView) {
      session = session || (await getServerSession());
      if (!session?.user?.id || !canAccessAdmin(session)) {
        return errorResponse("Admin access required", 403);
      }
    }

    const sortFieldMap: Record<string, string> = {
      eventDate: "event_date",
      createdAt: "created_at",
      updatedAt: "updated_at",
    };
    const orderField = sortFieldMap[sortBy] || "event_date";
    const ascending = sortOrder !== -1;

    let query = supabase
      .from("events")
      .select("*, created_by (id, name, email), created_by_organization (id, organization_name, url_handle), approved_by (id, name)", {
        count: "exact",
      })
      .order(orderField, { ascending })
      .range(skip, skip + limit - 1);

    if (adminView) {
      if (status === "approved" || status === "pending" || status === "rejected") {
        query = query.eq("status", status);
      }
    } else if (actualCreatedBy) {
      if (status === "approved" || status === "pending" || status === "rejected") {
        query = query.eq("status", status);
      }
    } else {
      query = query.eq("status", "approved").eq("is_published", true);
    }

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (eventType && eventType !== "all") {
      query = query.eq("event_type", eventType);
    }

    if (trainingType && trainingType !== "all") {
      if (trainingType === "online") {
        query = query.or("location->>type.eq.online,location->>type.eq.hybrid");
      } else if (trainingType === "in-person") {
        query = query.or("location->>type.eq.physical,location->>type.eq.hybrid");
      }
    }

    if (location && location !== "all") {
      if (location === "online") {
        query = query.or("location->>type.eq.online,location->>type.eq.hybrid");
      } else if (location === "physical") {
        query = query.or("location->>type.eq.physical,location->>type.eq.hybrid");
      } else {
        query = query.or(`location->>city.ilike.%${location}%`);
      }
    }

    if (month && month !== "all") {
      const year = new Date().getFullYear();
      const monthNum = parseInt(month);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59);
      query = query.gte("event_date", startDate.toISOString()).lte("event_date", endDate.toISOString());
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (actualCreatedBy) {
      query = query.or(`created_by.eq.${actualCreatedBy},created_by_organization.eq.${actualCreatedBy}`);
    }

    if (organizationId) {
      query = query.eq("created_by_organization", organizationId);
    }

    const { data: eventRows, error, count } = await query;

    if (error) {
      return errorResponse("Failed to fetch events", 500);
    }

    const events = (eventRows || []).map(mapEventToResponse);
    
    // Fetch organization names for events created by organizations
    const orgIds = eventRows
      .filter((e: any) => e.created_by_organization)
      .map((e: any) => e.created_by_organization.id)
    
    let orgNames: any[] = []
    if (orgIds.length > 0) {
      const { data: orgData } = await supabase
        .from('organization_profiles')
        .select('account_id, organization_name, email')
        .in('account_id', orgIds)
      orgNames = orgData || []
    }
    
    // Merge organization names into events
    const eventsWithOrgNames = events.map((event: any) => {
      if (!event.createdByOrganization) return event
      const orgProfile = orgNames.find((o: any) => o.account_id === event.createdByOrganization.id)
      return {
        ...event,
        createdByOrganization: {
          ...event.createdByOrganization,
          organizationName: orgProfile?.organization_name || 'Unknown organization',
          email: orgProfile?.email || event.createdByOrganization.email || null,
        }
      }
    })
    
    const total = count || 0;
    const payload: Record<string, any> = {
      events: eventsWithOrgNames,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    if (adminView) {
      const [pendingResult, approvedResult, rejectedResult, totalResult] = await Promise.all([
        supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "rejected"),
        supabase.from("events").select("id", { count: "exact", head: true }),
      ]);

      payload.stats = {
        pending: pendingResult.count || 0,
        approved: approvedResult.count || 0,
        rejected: rejectedResult.count || 0,
        total: totalResult.count || 0,
      };
    }

    return successResponse(payload);
  } catch (error) {
    return errorResponse("Failed to fetch events", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse("Authentication required", 401);
    }

    if (!canCreateEvent(session)) {
      return errorResponse("Only approved organizations can create events", 403);
    }

    const supabase = createSupabaseAdminClient();
    const contentType = request.headers.get("content-type") || "";
    let body: Record<string, any> = {};
    let imageFiles: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const eventDataStr = formData.get("eventData") as string;
      body = eventDataStr ? JSON.parse(eventDataStr) : {};
      const files = formData.getAll("images");
      imageFiles = files.filter((file): file is File => file instanceof File);
    } else {
      body = await request.json();
    }

    const validation = validateEventInput(body);
    if (!validation.valid) {
      return errorResponse(validation.error || "Invalid event data", 400);
    }

    const organization = isApprovedOrganization(session)
      ? await supabase
          .from("organization_profiles")
          .select("organization_name")
          .eq("account_id", session.user.id)
          .single()
      : { data: null, error: null };

    if (isApprovedOrganization(session) && (organization.error || !organization.data)) {
      return errorResponse("Organization profile not found", 404);
    }

    const insertPayload = mapEventInputToDbPayload(body);
    const lifecycleResult = applyEventLifecycleRules(null, "create", { role: "system" });
    if (!lifecycleResult.ok) {
      return errorResponse(lifecycleResult.error || "Failed to initialize lifecycle", 400);
    }

    const { data: eventRow, error: insertError } = await supabase
      .from("events")
      .insert({
        ...insertPayload,
        created_by: isApprovedOrganization(session) ? null : session.user.id,
        created_by_organization: isApprovedOrganization(session) ? session.user.id : null,
        organization_name: isApprovedOrganization(session) ? organization.data?.organization_name || "Unknown Organization" : null,
        ...lifecycleResult.updateData,
        current_participants: 0,
        images: [],
      })
      .select("*")
      .single();

    if (insertError || !eventRow) {
      return errorResponse("Failed to create event", 500);
    }

    if (imageFiles.length > 0) {
      const uploadedImages = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const validationResult = cloudinaryService.validateImageFile(file, 10);
        if (!validationResult.valid) {
          continue;
        }

        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const uploadResult = await cloudinaryService.uploadEventImage(buffer, eventRow.id, i);
          if (uploadResult.success && uploadResult.secureUrl && uploadResult.publicId) {
            uploadedImages.push({
              url: uploadResult.secureUrl,
              publicId: uploadResult.publicId,
              alt: body.title || "Event image",
              isPrimary: i === 0,
            });
          }
        } catch (uploadError) {}
      }

      if (uploadedImages.length > 0) {
        await supabase
          .from("events")
          .update({
            images: uploadedImages,
            image_url: uploadedImages[0].url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", eventRow.id);
      }
    }

    const { data: updatedEventRow, error: fetchError } = await supabase
      .from("events")
      .select("*, created_by (id, name, email), created_by_organization (id, organization_name, email), approved_by (id, name)")
      .eq("id", eventRow.id)
      .single();

    if (fetchError) {
      return errorResponse("Failed to create event", 500);
    }

    if (isApprovedOrganization(session) && organization?.data?.organization_name) {
      await NotificationService.notifyOrganizationFollowersAboutNewContent({
        organizationId: session.user.id,
        organizationName: organization.data.organization_name,
        contentType: "event",
        contentId: updatedEventRow.id,
        contentTitle: updatedEventRow.title,
      });
    }

    if (updatedEventRow.status === 'pending') {
      await NotificationService.notifyAdminsAboutSubmission(
        'event',
        updatedEventRow.id,
        updatedEventRow.title,
        isApprovedOrganization(session)
          ? organization?.data?.organization_name || 'Unknown organization'
          : session.user.name || 'Unknown submitter'
      )
    }

    if (updatedEventRow.status === 'approved' && updatedEventRow.is_published) {
      await NotificationService.notifyUsersAboutRelevantItem({
        itemType: 'event',
        itemId: updatedEventRow.id,
        title: updatedEventRow.title,
        description: updatedEventRow.description,
        tags: Array.isArray(updatedEventRow.tags) ? updatedEventRow.tags : [],
        actionUrl: `/resources/events/${updatedEventRow.id}`,
      })
    }

    return successResponse(
      { event: mapEventToResponse(updatedEventRow || eventRow) },
      { message: "Event created successfully. Awaiting admin approval.", status: 201 }
    );
  } catch (error) {
    return errorResponse("Failed to create event", 500);
  }
}
