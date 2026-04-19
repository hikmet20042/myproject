export const mapEventToResponse = (row: any) => {
  const location = row?.location && typeof row.location === "object" ? row.location : {};
  const createdBy = row?.created_by && typeof row.created_by === "object" ? row.created_by : null;
  const createdByOrganization =
    row?.created_by_organization && typeof row.created_by_organization === "object" ? row.created_by_organization : null;
  const approvedBy = row?.approved_by && typeof row.approved_by === "object" ? row.approved_by : null;
  const tags = Array.isArray(row?.tags) ? row.tags : [];
  const images = Array.isArray(row?.images) ? row.images : [];
  const viewedBy = Array.isArray(row?.viewed_by) ? row.viewed_by : [];
  const sessions = Array.isArray(row?.sessions) ? row.sessions : [];

  return {
    _id: row?.id ?? null,
    id: row?.id ?? null,
    slug: row?.slug ?? null,
    title: row?.title ?? null,
    description: row?.description ?? null,
    eventType: row?.event_type ?? null,
    eventDate: row?.event_date ?? null,
    sessions,
    location: {
      type: location?.type ?? null,
      address: location?.address ?? null,
      city: location?.city ?? null,
      country: location?.country ?? null,
      onlineLink: location?.onlineLink ?? null,
    },
    applicationLink: row?.application_link ?? null,
    applicationDeadline: row?.application_deadline ?? null,
    maxParticipants: row?.max_participants ?? null,
    createdBy: {
      _id: createdBy?.id ?? null,
      id: createdBy?.id ?? null,
      name: createdBy?.name ?? null,
      email: createdBy?.email ?? null,
      slug: createdBy?.slug ?? null,
      urlHandle: createdBy?.url_handle ?? createdBy?.urlHandle ?? null,
    },
    createdByOrganization: {
      _id: createdByOrganization?.id ?? null,
      id: createdByOrganization?.id ?? null,
      organizationName: createdByOrganization?.organization_name ?? null,
      email: createdByOrganization?.email ?? null,
      slug: createdByOrganization?.slug ?? null,
      urlHandle:
        createdByOrganization?.url_handle ??
        createdByOrganization?.urlHandle ??
        null,
    },
    status: row?.status ?? null,
    isPublished: row?.is_published ?? null,
    images,
    tags,
    analytics: {
      views: row?.real_views ?? row?.views ?? 0,
      uniqueViews: row?.real_unique_views ?? row?.unique_views ?? 0,
      viewedBy,
      engagementScore: row?.engagement_score ?? 0,
    },
    category: row?.category ?? null,
    endDate: row?.end_date ?? null,
    certification: row?.certification ?? null,
    audienceAgeMin: row?.audience_age_min ?? null,
    audienceAgeMax: row?.audience_age_max ?? null,
    requirements: Array.isArray(row?.requirements) ? row.requirements : [],
    participantBenefits: Array.isArray(row?.participant_benefits) ? row.participant_benefits : [],
    imageUrl: row?.image_url ?? null,
    organizationName: row?.organization_name ?? null,
    approvedAt: row?.approved_at ?? null,
    approvedBy: {
      _id: approvedBy?.id ?? null,
      id: approvedBy?.id ?? null,
      name: approvedBy?.name ?? null,
    },
    rejectedAt: row?.rejected_at ?? null,
    rejectionReason: row?.rejection_reason ?? null,
    adminComment: row?.admin_comment ?? null,
    isFeatured: row?.is_featured ?? null,
    views: row?.real_views ?? row?.views ?? 0,
    uniqueViews: row?.real_unique_views ?? row?.unique_views ?? 0,
    saves: row?.real_saves ?? row?.saves ?? 0,
    viewedBy,
    engagementScore: row?.engagement_score ?? 0,
    createdAt: row?.created_at ?? null,
    updatedAt: row?.updated_at ?? null,
  };
};
