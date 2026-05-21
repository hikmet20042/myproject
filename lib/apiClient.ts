type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: {
    code?: string;
    message?: string;
    details?: any;
  } | null;
  meta?: any;
};

export class ApiError extends Error {
  code?: string;
  details?: any;

  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T; meta: any }> {
  const res = await fetch(url, options);
  const json = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok || !json?.success) {
    throw new ApiError(
      json?.error?.message || "Naməlum xəta",
      json?.error?.code,
      json?.error?.details
    );
  }

  return {
    data: json.data,
    meta: json.meta ?? {},
  };
}
