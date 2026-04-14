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

export const fetchOrganizationBySlug = async (slug: string) => {
  const endpoint = `/api/organizations/${slug}`;
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

/** @deprecated Use fetchOrganizationBySlug instead */
export const fetchOrganizationById = fetchOrganizationBySlug;

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
