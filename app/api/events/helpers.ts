import { isAdminOrOwner, type Session } from "@/lib/auth/permissions";
import { mapEventToResponse } from "@/lib/events/mapEventToResponse";
import {
  successResponse as baseSuccessResponse,
  errorResponse as baseErrorResponse,
} from "@/lib/apiResponse";

type ValidationOptions = {
  partial?: boolean;
};

type LifecycleActorRole = "owner" | "admin" | "system";
type LifecycleAction = "create" | "ownerEditApproved" | "approve" | "reject";
type LifecycleActor = {
  role: LifecycleActorRole;
  id?: string | null;
  rejectionReason?: string | null;
  adminComment?: string | null;
};

const validEventTypes = ["event", "training", "workshop", "conference", "seminar"];
const validLifecycleStatuses = ["pending", "approved", "rejected"] as const;

export { mapEventToResponse };

export const validateLifecycleState = (eventRow: any) => {
  if (!eventRow) {
    return { valid: true };
  }

  const status = eventRow.status;
  const isPublished = eventRow.is_published;

  if (!validLifecycleStatuses.includes(status)) {
    return { valid: false, error: "Invalid lifecycle status" };
  }

  if (status === "approved" && isPublished !== true) {
    return { valid: false, error: "Invalid lifecycle state: approved events must be published" };
  }

  if ((status === "pending" || status === "rejected") && isPublished !== false) {
    return { valid: false, error: "Invalid lifecycle state: pending/rejected events cannot be published" };
  }

  return { valid: true };
};

export const applyEventLifecycleRules = (
  eventRow: any,
  action: LifecycleAction,
  actor: LifecycleActor
) => {
  const currentState = validateLifecycleState(eventRow);
  if (!currentState.valid) {
    return { ok: false, error: currentState.error };
  }

  const now = new Date().toISOString();

  if (action === "create") {
    return {
      ok: true,
      updateData: {
        status: "pending",
        is_published: false,
        approved_at: null,
        approved_by: null,
        rejected_at: null,
        rejection_reason: null,
      },
    };
  }

  if (action === "ownerEditApproved") {
    if (actor.role !== "owner") {
      return { ok: false, error: "Only owner can trigger approved-edit lifecycle transition" };
    }

    return {
      ok: true,
      updateData: {
        status: "pending",
        is_published: false,
        approved_at: null,
        approved_by: null,
      },
    };
  }

  if (action === "approve") {
    if (actor.role !== "admin") {
      return { ok: false, error: "Only admin can approve events" };
    }

    if (eventRow?.status === "approved" && eventRow?.is_published === true) {
      return { ok: false, error: "Cannot approve already approved event" };
    }

    return {
      ok: true,
      updateData: {
        status: "approved",
        is_published: true,
        approved_at: now,
        approved_by: actor.id || null,
        rejected_at: null,
        rejection_reason: null,
        admin_comment: actor.adminComment || null,
      },
    };
  }

  if (action === "reject") {
    if (actor.role !== "admin") {
      return { ok: false, error: "Only admin can reject events" };
    }

    if (eventRow?.status === "rejected" && eventRow?.is_published === false) {
      return { ok: false, error: "Cannot reject already rejected event" };
    }

    const rejectionReason = actor.rejectionReason?.trim() || "";
    if (!rejectionReason) {
      return { ok: false, error: "rejectionReason is required for reject action" };
    }

    return {
      ok: true,
      updateData: {
        status: "rejected",
        is_published: false,
        rejected_at: now,
        rejection_reason: rejectionReason,
        admin_comment: actor.adminComment?.trim() || rejectionReason,
        approved_at: null,
        approved_by: null,
      },
    };
  }

  return { ok: false, error: "Unsupported lifecycle action" };
};

export const successResponse = (data: any, options?: { message?: string; status?: number }) => {
  const meta = options?.message ? { message: options.message } : {};
  return baseSuccessResponse(data, meta, options?.status || 200);
};

export const errorResponse = (error: string, status = 400, data: any = null) => {
  return baseErrorResponse(error, "EVENTS_API_ERROR", data, status);
};

export const validateEventInput = (data: any, options: ValidationOptions = {}) => {
  const partial = options.partial === true;

  if (!data || typeof data !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  if (!partial) {
    const requiredFields = ["title", "description", "category", "eventDate", "location", "eventType"];
    for (const field of requiredFields) {
      if (!data[field]) {
        return { valid: false, error: `${field} is required` };
      }
    }

    if (!data.applicationLink) {
      return { valid: false, error: "applicationLink is required" };
    }
  }

  if (data.description !== undefined) {
    const descText = typeof data.description === "string" ? data.description.replace(/<[^>]*>/g, "").trim() : "";
    if (!descText || descText.length < 50) {
      return { valid: false, error: "Description must be at least 50 characters long" };
    }
  }

  if (data.eventType !== undefined && !validEventTypes.includes(data.eventType)) {
    return { valid: false, error: "Invalid event type" };
  }

  if (data.eventType === "training") {
    if (data.duration && (!data.duration.value || !data.duration.unit)) {
      return { valid: false, error: "Duration must include both value and unit for training events" };
    }

    if (data.cost && !Object.prototype.hasOwnProperty.call(data.cost, "isFree")) {
      return { valid: false, error: "Cost information must specify if training is free" };
    }
  }

  if (data.location !== undefined) {
    const locationType = data.location?.type;
    if (!locationType || !["online", "physical", "hybrid"].includes(locationType)) {
      return { valid: false, error: "Valid location type is required" };
    }
  }

  if (data.applicationLink !== undefined) {
    if (!data.applicationLink || typeof data.applicationLink !== "string") {
      return { valid: false, error: "applicationLink must be a valid URL" };
    }

    try {
      const parsed = new URL(data.applicationLink);
      if (!parsed.protocol.startsWith("http")) {
        return { valid: false, error: "applicationLink must start with http or https" };
      }
    } catch {
      return { valid: false, error: "applicationLink must be a valid URL" };
    }
  }

  return { valid: true };
};

export const mapEventInputToDbPayload = (data: any, options: ValidationOptions = {}) => {
  const partial = options.partial === true;
  const allowedFields = [
    "title",
    "description",
    "category",
    "eventType",
    "eventDate",
    "endDate",
    "duration",
    "schedule",
    "prerequisites",
    "learningOutcomes",
    "certification",
    "cost",
    "targetAudience",
    "syllabus",
    "location",
    "applicationLink",
    "applicationDeadline",
    "maxParticipants",
    "tags",
    "imageUrl",
  ];

  const source = partial
    ? allowedFields.reduce((acc, field) => {
        if (data[field] !== undefined) {
          acc[field] = data[field];
        }
        return acc;
      }, {} as Record<string, any>)
    : {
        title: data.title,
        description: data.description,
        category: data.category,
        eventType: data.eventType || "event",
        eventDate: data.eventDate,
        endDate: data.endDate || null,
        duration: data.duration || null,
        schedule: data.schedule || null,
        prerequisites: data.prerequisites || [],
        learningOutcomes: data.learningOutcomes || [],
        certification: data.certification || null,
        cost: data.cost || null,
        targetAudience: data.targetAudience || [],
        syllabus: data.syllabus || null,
        location: data.location,
        applicationLink: data.applicationLink || null,
        applicationDeadline: data.applicationDeadline || null,
        maxParticipants: data.maxParticipants || null,
        tags: data.tags || [],
        imageUrl: data.imageUrl || null,
      };

  const mapped = { ...source } as Record<string, any>;

  if (mapped.eventType !== undefined) {
    mapped.event_type = mapped.eventType;
    delete mapped.eventType;
  }
  if (mapped.eventDate !== undefined) {
    mapped.event_date = mapped.eventDate;
    delete mapped.eventDate;
  }
  if (mapped.endDate !== undefined) {
    mapped.end_date = mapped.endDate;
    delete mapped.endDate;
  }
  if (mapped.learningOutcomes !== undefined) {
    mapped.learning_outcomes = mapped.learningOutcomes;
    delete mapped.learningOutcomes;
  }
  if (mapped.targetAudience !== undefined) {
    mapped.target_audience = mapped.targetAudience;
    delete mapped.targetAudience;
  }
  if (mapped.applicationLink !== undefined) {
    mapped.application_link = mapped.applicationLink;
    delete mapped.applicationLink;
  }
  if (mapped.applicationDeadline !== undefined) {
    mapped.application_deadline = mapped.applicationDeadline;
    delete mapped.applicationDeadline;
  }
  if (mapped.maxParticipants !== undefined) {
    mapped.max_participants = mapped.maxParticipants;
    delete mapped.maxParticipants;
  }
  if (mapped.imageUrl !== undefined) {
    mapped.image_url = mapped.imageUrl;
    delete mapped.imageUrl;
  }

  return mapped;
};

export const getEventsByOwner = (session: Session) => {
  if (!session?.user?.id) {
    return {
      ownerId: null,
      error: errorResponse("Authentication required", 401),
    };
  }

  return {
    ownerId: session.user.id,
    error: null,
  };
};

export const canViewEventRecord = (session: Session, eventRow: any) => {
  const isPublic = eventRow?.status === "approved" && eventRow?.is_published === true;
  if (isPublic) {
    return true;
  }

  return isAdminOrOwner(session, eventRow);
};
