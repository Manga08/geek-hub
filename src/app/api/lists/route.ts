import { NextRequest } from "next/server";
import { requireSessionUserId } from "@/lib/auth/request-context";
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
  // Single auth call via getSession()
  const result = await requireSessionUserId();
  if (!result.ok) return result.response;

  try {
    const lists = await listsRepo.listLists();
    return ok({ lists });
  } catch (error) {
    console.error("GET /api/lists error:", error);
    return internal();
  }
}

export async function POST(request: NextRequest) {
  // Single auth call via getSession()
  const result = await requireSessionUserId();
  if (!result.ok) return result.response;

  const { userId } = result;

  try {
    const body = await request.json();
    const parsed = validateBody(createListBodySchema, body);

    if (!parsed.success) {
      return badRequest("Invalid request body", formatZodErrors(parsed.error));
    }

    const list = await listsRepo.createList(parsed.data);

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
