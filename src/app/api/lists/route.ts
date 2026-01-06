import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/auth/request-context";
import * as listsRepo from "@/features/lists/repo";
import { logActivityEvent } from "@/lib/activity-log";
import {
  ok,
  badRequest,
  internal,
  createListBodySchema,
  validateBody,
  formatZodErrors,
} from "@/lib/api";

// =========================
// Supabase Error Mapper
// =========================

interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
}

function mapSupabaseError(error: unknown): { status: number; message: string; details?: unknown } {
  const err = error as SupabaseError;
  const code = err.code ?? "";
  const isDev = process.env.NODE_ENV === "development";
  const details = isDev ? { code: err.code, message: err.message } : undefined;

  // PostgreSQL error codes
  if (code === "23505") {
    // unique_violation
    return { status: 409, message: "A list with this name already exists", details };
  }
  if (code === "23503") {
    // foreign_key_violation
    return { status: 400, message: "Invalid reference", details };
  }
  if (code === "42501" || code === "42000") {
    // insufficient_privilege / RLS
    return { status: 403, message: "Permission denied", details };
  }
  if (code === "22P02" || code === "22001") {
    // invalid_text_representation / string_data_right_truncation
    return { status: 400, message: "Invalid input data", details };
  }

  // Default: internal error
  return { status: 500, message: "Internal server error", details };
}

export async function GET() {
  // Get full context (supabase + userId + groupId) - single profiles query
  const result = await requireApiContext();
  if (!result.ok) return result.response;

  const { supabase, userId, defaultGroupId } = result.ctx;

  try {
    // Pass context to avoid re-doing auth
    const ctx = { supabase, userId, groupId: defaultGroupId };
    const lists = await listsRepo.listLists(undefined, ctx);
    return ok({ lists });
  } catch (error) {
    console.error("GET /api/lists error:", error);
    return internal();
  }
}

export async function POST(request: NextRequest) {
  // Get full context (supabase + userId + groupId) - single profiles query
  const result = await requireApiContext();
  if (!result.ok) return result.response;

  const { supabase, userId, defaultGroupId } = result.ctx;

  try {
    const body = await request.json();
    const parsed = validateBody(createListBodySchema, body);

    if (!parsed.success) {
      return badRequest("Invalid request body", formatZodErrors(parsed.error));
    }

    // Pass context to avoid re-doing auth
    const ctx = { supabase, userId, groupId: defaultGroupId };
    const list = await listsRepo.createList(parsed.data, ctx);

    // Log activity event
    await logActivityEvent({
      groupId: list.group_id,
      actorId: userId,
      eventType: "list_created",
      entityType: "list",
      entityId: list.id,
      metadata: { name: list.name, list_name: list.name },
    });

    return ok(list, { status: 201 });
  } catch (error) {
    console.error("POST /api/lists error:", error);
    const { status, message, details } = mapSupabaseError(error);
    return NextResponse.json(
      details ? { error: message, details } : { error: message },
      { status }
    );
  }
}
