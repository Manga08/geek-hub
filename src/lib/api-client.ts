/**
 * Frontend API client helper for consuming the new API contract
 *
 * Handles both new contract ({ ok: true, data } | { ok: false, code, message })
 * and legacy responses for backward compatibility.
 *
 * @example
 * ```ts
 * const data = await readApiJson<MyType>(response);
 * ```
 */

export class ApiError extends Error {
  code: string;
  details?: unknown;
  status: number;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

interface OkResponse<T> {
  ok: true;
  data: T;
}

interface FailResponse {
  ok: false;
  code: string;
  message: string;
  details?: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ApiResponse<T> = OkResponse<T> | FailResponse;

/**
 * Read and parse JSON from a fetch Response, handling both new and legacy API formats.
 *
 * - New format: { ok: true, data } => returns data
 * - New format: { ok: false, code, message } => throws ApiError
 * - Legacy format: checks res.ok, extracts error/message field
 *
 * @throws {ApiError} When the API returns an error response
 */
export async function readApiJson<T>(res: Response): Promise<T> {
  const json = await res.json();

  // New contract format
  if (typeof json.ok === "boolean") {
    if (json.ok === true) {
      return (json as OkResponse<T>).data;
    }
    // ok === false
    const fail = json as FailResponse;
    throw new ApiError(
      fail.message || "Unknown error",
      fail.code || "UNKNOWN",
      res.status,
      fail.details
    );
  }

  // Legacy format fallback
  if (!res.ok) {
    // Try to extract error message from various legacy shapes
    const errorMsg =
      json.error ||
      json.message ||
      json.error?.message ||
      `Request failed with status ${res.status}`;
    throw new ApiError(errorMsg, "LEGACY_ERROR", res.status);
  }

  // Legacy success - return the whole json as data
  return json as T;
}

/**
 * Convenience wrapper for fetch + readApiJson
 */
export async function fetchApi<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, init);
  return readApiJson<T>(res);
}

/**
 * POST helper with JSON body
 */
export async function postApi<T>(
  url: string,
  body: unknown,
  init?: RequestInit
): Promise<T> {
  return fetchApi<T>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    body: JSON.stringify(body),
    ...init,
  });
}

/**
 * PATCH helper with JSON body
 */
export async function patchApi<T>(
  url: string,
  body: unknown,
  init?: RequestInit
): Promise<T> {
  return fetchApi<T>(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    body: JSON.stringify(body),
    ...init,
  });
}

/**
 * DELETE helper with optional JSON body
 */
export async function deleteApi<T>(
  url: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  return fetchApi<T>(url, {
    method: "DELETE",
    headers: body
      ? {
        "Content-Type": "application/json",
        ...init?.headers,
      }
      : init?.headers,
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });
}
