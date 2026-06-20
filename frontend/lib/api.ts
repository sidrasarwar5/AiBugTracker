import { clearTokens, getAccessToken, getRefreshToken, setAccessToken } from "./tokens";
import type { ApiErrorBody } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";


const MEDIA_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000";

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${MEDIA_URL}${path}`;
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(extractMessage(body));
    this.status = status;
    this.body = body;
  }
}

/**
 * DRF error bodies vary in shape:
 *   {"email": ["User not found"]}
 *   {"detail": "Authentication credentials were not provided."}
 *   {"non_field_errors": ["..."]}
 * This pulls out something readable for all of them.
 */
function extractMessage(body: ApiErrorBody): string {
  if (!body || typeof body !== "object") return "Something went wrong.";
  if ("detail" in body && typeof body.detail === "string") return body.detail;

  const firstKey = Object.keys(body)[0];
  if (!firstKey) return "Something went wrong.";
  const value = (body as Record<string, string[] | string>)[firstKey];
  const message = Array.isArray(value) ? value[0] : value;
  // Prefix the field name unless it's a generic non-field error
  if (firstKey === "non_field_errors" || firstKey === "detail") return message;
  return message;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Avoid firing multiple parallel refresh requests if several API
  // calls 401 at the same time -- share one in-flight refresh.
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) return null;
    try {
      const res = await fetch(`${API_URL}/auth/login/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      setAccessToken(data.access);
      return data.access as string;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Set true for multipart/form-data uploads (screenshots) -- skips JSON.stringify and Content-Type. */
  isFormData?: boolean;
  /** Skip attaching the Authorization header (signup/login only). */
  skipAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, isFormData, skipAuth, headers, ...rest } = options;

  const doFetch = async (token: string | null): Promise<Response> => {
    const finalHeaders: HeadersInit = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    };

    return fetch(`${API_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    });
  };

  const token = skipAuth ? null : getAccessToken();
  let res = await doFetch(token);

  // Access token expired mid-session -- refresh once and retry.
  if (res.status === 401 && !skipAuth && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(newToken);
    } else {
      clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new ApiError(401, { detail: "Session expired. Please log in again." });
    }
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, data as ApiErrorBody);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
