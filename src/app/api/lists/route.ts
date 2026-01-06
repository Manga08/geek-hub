import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import * as listsRepo from "@/features/lists/repo";
import { logActivityEvent } from "@/lib/activity-log";
import {
  ok,
  badRequest,
  unauthenticated,
  internal,
  createListBodySchema,
  validateBody,
  formatZodErrors,
} from "@/lib/api";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return unauthenticated();
  }

  try {
    const lists = await listsRepo.listLists();
    return ok({ lists });
  } catch (error) {
    console.error("GET /api/lists error:", error);
    return internal();
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return unauthenticated();
  }

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
      actorId: user.id,
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
