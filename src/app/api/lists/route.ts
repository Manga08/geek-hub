import { NextRequest } from "next/server";
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
    return internal();
  }
}
