import { isAdminOrOwner, type Session } from "@/lib/auth/permissions";
import { mapEventToResponse } from "@/lib/events/mapEventToResponse";
import {
  successResponse as baseSuccessResponse,
  errorResponse as baseErrorResponse,
} from "@/lib/apiResponse";
import { EVENT_TYPE_VALUES } from "@/lib/events/eventConfig";

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

const validEventTypes = [...EVENT_TYPE_VALUES];
const validLifecycleStatuses = ["pending", "approved", "rejected"] as const;

const isValidTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const normalizeStringArray = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
};

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
    const requiredFields = ["title", "description", "category", "location", "eventType"];
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

  if (!partial && (!Array.isArray(data.sessions) || data.sessions.length === 0)) {
    return { valid: false, error: "At least one session is required" };
  }

  if (data.sessions !== undefined) {
    if (!Array.isArray(data.sessions) || data.sessions.length === 0) {
      return { valid: false, error: "sessions must include at least one item" };
    }

    for (const session of data.sessions) {
      if (!session || typeof session !== "object") {
        return { valid: false, error: "Each session must be an object" };
      }

      const { date, startTime, endTime } = session as {
        date?: string;
        startTime?: string;
        endTime?: string;
      };

      if (!date || !startTime || !endTime) {
        return { valid: false, error: "Each session requires date, startTime, and endTime" };
      }

      if (Number.isNaN(Date.parse(date))) {
        return { valid: false, error: "Session date must be a valid date" };
      }

      if (!isValidTime(startTime) || !isValidTime(endTime)) {
        return { valid: false, error: "Session startTime and endTime must be in HH:mm format" };
      }

      if (startTime >= endTime) {
        return { valid: false, error: "Session startTime must be earlier than endTime" };
      }
    }
  }

  if (data.location !== undefined) {
    const locationType = data.location?.type;
    if (!locationType || !["online", "physical", "hybrid"].includes(locationType)) {
      return { valid: false, error: "Valid location type is required" };
    }

    if (["physical", "hybrid"].includes(locationType) && !data.location?.city) {
      return { valid: false, error: "location.city is required for physical or hybrid events" };
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

  const ageMinProvided = data.audienceAgeMin !== undefined && data.audienceAgeMin !== null && data.audienceAgeMin !== "";
  const ageMaxProvided = data.audienceAgeMax !== undefined && data.audienceAgeMax !== null && data.audienceAgeMax !== "";

  if (!partial && (!ageMinProvided || !ageMaxProvided)) {
    return { valid: false, error: "audienceAgeMin and audienceAgeMax are required" };
  }

  if (ageMinProvided || ageMaxProvided) {
    const min = Number(data.audienceAgeMin);
    const max = Number(data.audienceAgeMax);

    if (!Number.isInteger(min) || !Number.isInteger(max)) {
      return { valid: false, error: "audienceAgeMin and audienceAgeMax must be integers" };
    }

    if (min < 0 || min > 99 || max < 0 || max > 99) {
      return { valid: false, error: "Audience age range must be between 0 and 99" };
    }

    if (min > max) {
      return { valid: false, error: "audienceAgeMin cannot be greater than audienceAgeMax" };
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
    "sessions",
    "certification",
    "audienceAgeMin",
    "audienceAgeMax",
    "requirements",
    "participantBenefits",
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
        eventType: data.eventType,
        eventDate: data.eventDate || null,
        endDate: data.endDate || null,
        sessions: Array.isArray(data.sessions) ? data.sessions : [],
        certification: data.certification || null,
        audienceAgeMin: data.audienceAgeMin ?? null,
        audienceAgeMax: data.audienceAgeMax ?? null,
        requirements: normalizeStringArray(data.requirements),
        participantBenefits: normalizeStringArray(data.participantBenefits),
        location: data.location,
        applicationLink: data.applicationLink,
        applicationDeadline: data.applicationDeadline || null,
        maxParticipants: data.maxParticipants || null,
        tags: data.tags || [],
        imageUrl: data.imageUrl || null,
      };

  if (Array.isArray(source.sessions) && source.sessions.length > 0 && !source.eventDate) {
    const sorted = [...source.sessions].sort((a, b) => {
      const left = `${a.date}T${a.startTime}:00Z`;
      const right = `${b.date}T${b.startTime}:00Z`;
      return new Date(left).getTime() - new Date(right).getTime();
    });
    source.eventDate = `${sorted[0].date}T${sorted[0].startTime}:00.000Z`;
    source.endDate = `${sorted[sorted.length - 1].date}T${sorted[sorted.length - 1].endTime}:00.000Z`;
  }

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
  if (mapped.sessions !== undefined) {
    mapped.sessions = mapped.sessions;
  }
  if (mapped.audienceAgeMin !== undefined) {
    mapped.audience_age_min = mapped.audienceAgeMin;
    delete mapped.audienceAgeMin;
  }
  if (mapped.audienceAgeMax !== undefined) {
    mapped.audience_age_max = mapped.audienceAgeMax;
    delete mapped.audienceAgeMax;
  }
  if (mapped.participantBenefits !== undefined) {
    mapped.participant_benefits = mapped.participantBenefits;
    delete mapped.participantBenefits;
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
