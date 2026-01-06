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
  details?: unknown
): NextResponse<FailResponse> {
  const body: FailResponse = { ok: false, code, message };
  if (details !== undefined) {
    body.details = details;
  }
  return NextResponse.json(body, { status });
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

/** 500 Internal Server Error */
export function internal(message = "Internal server error") {
  return fail("INTERNAL", message, 500);
}
