/**
 * API Response helpers for consistent error/success responses
 *
 * @example
 * ```ts
 * import { ok, fail, ErrorCode } from "@/lib/api/respond";
 *
 * // Success
 * return ok({ users: [] });
 * return ok(null, { status: 201 });
 *
 * // Errors
 * return fail("BAD_REQUEST", "Invalid input", 400, { field: "email" });
 * return fail("UNAUTHENTICATED", "Must be logged in", 401);
 * ```
 */
import { NextResponse } from "next/server";
import { generateErrorId, pushServerLog } from "@/lib/debug/server-log";

/** Standard error codes */
export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL";

/** Success response shape */
export interface OkResponse<T = unknown> {
  ok: true;
  data: T;
}

/** Error response shape */
export interface FailResponse {
  ok: false;
  code: ErrorCode;
  message: string;
  details?: unknown;
  errorId?: string;
}

/**
 * Return a successful JSON response
 */
export function ok<T>(data?: T, init?: ResponseInit): NextResponse<OkResponse<T>> {
  return NextResponse.json(
    { ok: true, data: data ?? null } as OkResponse<T>,
    { status: 200, ...init }
  );
}

/**
 * Return a failed JSON response with standard error shape
 */
export function fail(
  code: ErrorCode,
  message: string,
  status: number,
  details?: unknown,
  errorId?: string
): NextResponse<FailResponse> {
  const body: FailResponse = { ok: false, code, message };
  if (details !== undefined) {
    body.details = details;
  }
  if (errorId) {
    body.errorId = errorId;
  }

  const headers: HeadersInit = {};
  if (errorId) {
    headers["x-gh-error-id"] = errorId;
  }

  return NextResponse.json(body, { status, headers });
}

// ---------- Shorthand helpers ----------

/** 400 Bad Request */
export function badRequest(message: string, details?: unknown) {
  return fail("BAD_REQUEST", message, 400, details);
}

/** 401 Unauthenticated */
export function unauthenticated(message = "Authentication required") {
  return fail("UNAUTHENTICATED", message, 401);
}

/** 403 Forbidden */
export function forbidden(message = "Permission denied") {
  return fail("FORBIDDEN", message, 403);
}

/** 404 Not Found */
export function notFound(message = "Resource not found") {
  return fail("NOT_FOUND", message, 404);
}

/** 409 Conflict */
export function conflict(message: string, details?: unknown) {
  return fail("CONFLICT", message, 409, details);
}

/** 500 Internal Server Error with error tracking */
export function internal(message = "Internal server error", error?: unknown) {
  const errorId = generateErrorId();

  // Log to server buffer in dev
  if (error) {
    const err = error as { message?: string; stack?: string; code?: string };
    pushServerLog({
      level: "error",
      message: err.message ?? message,
      stack: err.stack,
      errorId,
    });
  } else {
    pushServerLog({
      level: "error",
      message,
      errorId,
    });
  }

  return fail("INTERNAL", message, 500, undefined, errorId);
}
