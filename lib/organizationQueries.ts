import { apiFetch } from "@/lib/apiClient";

type OrganizationListParams = {
  page?: number;
  limit?: number;
  category?: string;
  location?: string;
  search?: string;
  organizationType?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
};

type FollowedOrganizationsParams = {
  page?: number;
  limit?: number;
  search?: string;
};

const toQueryString = (params: OrganizationListParams = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
};

const withLegacyId = <T extends { id?: string; _id?: string }>(item: T): T => {
  if (!item || typeof item !== "object") return item;
  if (!item._id && item.id) {
    return { ...item, _id: item.id };
  }
  return item;
};

const assertItems = (data: any, endpoint: string) => {
  if (!Array.isArray(data?.items)) {
    throw new Error(`Invalid API contract from ${endpoint}: expected data.items[]`);
  }
  return data.items;
};

const assertOrganization = (data: any, endpoint: string) => {
  if (!data?.organization || typeof data.organization !== "object" || Array.isArray(data.organization)) {
    throw new Error(`Invalid API contract from ${endpoint}: expected data.organization object`);
  }
  return data.organization;
};

export const resolveOrganizationIdentifier = async (identifier: string) => {
  const { data } = await apiFetch<{ id?: string; slug?: string }>(`/api/organizations/resolve/${identifier}`);
  return { id: data?.id || '', slug: data?.slug || '' };
};

export const fetchOrganizations = async (params: OrganizationListParams = {}) => {
  const endpoint = `/api/organizations${toQueryString(params) ? `?${toQueryString(params)}` : ""}`;
  const query = toQueryString(params);
  const { data, meta } = await apiFetch<{ items: any[] }>(`/api/organizations${query ? `?${query}` : ""}`);
  const rawItems = assertItems(data, endpoint);

  return {
    items: rawItems.map((item: any) => withLegacyId(item)),
    meta: meta || {},
  };
};

export const fetchOrganizationById = async (id: string) => {
  const endpoint = `/api/organizations/${id}`;
  const { data } = await apiFetch<{
    organization: any;
    featuredEvent?: any;
    featuredVacancy?: any;
  }>(endpoint);

  const organization = assertOrganization(data, endpoint);

  return {
    organization: withLegacyId(organization),
    featuredEvent: data?.featuredEvent || null,
    featuredVacancy: data?.featuredVacancy || null,
  };
};

export const fetchOrganizationBySlug = async (slug: string) => {
  const { id } = await resolveOrganizationIdentifier(slug);
  if (!id) throw new Error('Organization not found');
  return fetchOrganizationById(id);
};

/** @deprecated Use fetchOrganizationById instead */
export const fetchOrganizationBySlugDeprecated = fetchOrganizationBySlug;

export const fetchMyOrganization = async () => {
  const endpoint = "/api/organizations/me";
  const { data } = await apiFetch<{ organization: any }>(endpoint);
  return withLegacyId(assertOrganization(data, endpoint));
};

export const updateMyOrganization = async (payload: Record<string, any>) => {
  const endpoint = "/api/organizations/me";
  const { data } = await apiFetch<{ organization?: any; message?: string }>(
    endpoint,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  return {
    organization: withLegacyId(assertOrganization(data, endpoint)),
    message: data?.message || "",
  };
};

export const fetchOrganizationFollowState = async (organizationId: string) => {
  const endpoint = `/api/organizations/${organizationId}/follow`;
  const { data } = await apiFetch<{
    organizationId: string;
    isFollowing: boolean;
    followerCount: number;
  }>(endpoint);

  return {
    organizationId: data.organizationId,
    isFollowing: Boolean(data.isFollowing),
    followerCount: Number(data.followerCount || 0),
  };
};

export const toggleOrganizationFollow = async (
  organizationId: string,
  action: 'follow' | 'unfollow' | 'toggle' = 'toggle'
) => {
  const endpoint = `/api/organizations/${organizationId}/follow`;
  const { data } = await apiFetch<{
    organizationId: string;
    isFollowing: boolean;
    followerCount: number;
  }>(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });

  return {
    organizationId: data.organizationId,
    isFollowing: Boolean(data.isFollowing),
    followerCount: Number(data.followerCount || 0),
  };
};

export const fetchFollowedOrganizations = async (params: FollowedOrganizationsParams = {}) => {
  const query = toQueryString(params);
  const endpoint = `/api/users/organizations/followed${query ? `?${query}` : ''}`;

  const { data, meta } = await apiFetch<{ items: any[] }>(endpoint);
  const rawItems = assertItems(data, endpoint);

  return {
    items: rawItems.map((item: any) => withLegacyId(item)),
    meta: meta || {},
  };
};
