import {
  adminConfig,
  AdminApiParams,
  AdminResourceKey,
  AdminAction,
  AdminItemFor,
} from "@/lib/admin-config";

const readApiErrorMessage = (payload: any) =>
  payload?.error?.message || payload?.error || "Request failed";

const normalizeEnvelopeData = (payload: any) => {
  const data = payload?.data ?? {};

  // Compatibility: some admin list endpoints still return `results` in data.
  if (!("items" in data) && Array.isArray(data?.results)) {
    return { ...data, items: data.results };
  }

  return data;
};

const buildQuery = (params?: AdminApiParams) => {
  const searchParams = new URLSearchParams();
  if (!params) return searchParams;
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && value.trim() === "") return;
    searchParams.append(key, String(value));
  });
  return searchParams;
};

const buildUrl = (endpoint: string, params?: AdminApiParams) => {
  const [path, existingQuery] = endpoint.split("?");
  const searchParams = new URLSearchParams(existingQuery || "");
  if (params) {
    buildQuery(params).forEach((value, key) => {
      searchParams.set(key, value);
    });
  }
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
};

const resolveEndpoint = (endpoint: string, options?: { id?: string }) => {
  if (!options?.id) return endpoint;
  return endpoint.replace(":id", options.id);
};

export const getAdminList = async (
  resource: AdminResourceKey,
  params?: AdminApiParams,
  options?: { signal?: AbortSignal },
) => {
  const config = adminConfig[resource];
  const url = buildUrl(config.listEndpoint, {
    ...config.listParams,
    ...params,
  });
  const response = await fetch(url, { signal: options?.signal });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(readApiErrorMessage(payload));
  }
  return {
    ...payload,
    data: normalizeEnvelopeData(payload),
  };
};

export const runAdminAction = async <K extends AdminResourceKey>(
  resource: K,
  action: AdminAction<AdminItemFor<K>>,
  options?: {
    id?: string;
    params?: AdminApiParams;
    body?: Record<string, unknown>;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  },
) => {
  const config = adminConfig[resource];
  const endpoint = resolveEndpoint(
    action.endpoint || config.listEndpoint,
    { id: options?.id },
  );
  const url = buildUrl(endpoint, options?.params);
  const method = options?.method || action.method || "PUT";
  const body = {
    ...(action.apiAction ? { action: action.apiAction } : {}),
    ...(options?.body || {}),
  };
  const shouldSendBody = method !== "GET" && method !== "DELETE";
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(shouldSendBody && { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(readApiErrorMessage(payload));
  }
  return {
    ...payload,
    data: normalizeEnvelopeData(payload),
  };
};
