import { NextRequest } from "next/server";
import {
  requireSessionUserId,
  requireApiContext,
} from "@/lib/auth/request-context";
import {
  ok,
  badRequest,
  internal,
  validateQuery,
  formatZodErrors,
} from "@/lib/api";
import { z } from "zod";

// Schema for activity query params
const activityQuerySchema = z.object({
  group_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().optional(), // ISO timestamp cursor
  entity_type: z.enum(["group", "list", "list_item", "library_entry", "invite", "member"]).optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = validateQuery(activityQuerySchema, searchParams);

  if (!parsed.success) {
    return badRequest("Invalid query parameters", formatZodErrors(parsed.error));
  }

  const { group_id, limit, before, entity_type } = parsed.data;

  let supabase;
  let groupId: string;

  // If group_id is provided, use lightweight auth (no profiles query)
  if (group_id) {
    const result = await requireSessionUserId();
    if (!result.ok) return result.response;
    supabase = result.supabase;
    groupId = group_id;
  } else {
    // No group_id: get defaultGroupId from context (1 extra query)
    const result = await requireApiContext();
    if (!result.ok) return result.response;
    supabase = result.ctx.supabase;
    groupId = result.ctx.defaultGroupId;
  }

  try {
    let query = supabase
      .from("activity_events")
      .select(`
        id,
        group_id,
        actor_id,
        event_type,
        entity_type,
        entity_id,
        metadata,
        created_at,
        profiles!activity_events_actor_id_fkey (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Cursor-based pagination
    if (before) {
      query = query.lt("created_at", before);
    }

    // Optional filter by entity type
    if (entity_type) {
      query = query.eq("entity_type", entity_type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("GET /api/activity error:", error);
      return internal("Error fetching activity");
    }

    // Determine if there are more results (for pagination)
    const hasMore = data?.length === limit;
    const nextCursor = hasMore && data?.length ? data[data.length - 1].created_at : null;

    return ok({
      events: data ?? [],
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("GET /api/activity error:", error);
    return internal();
  }
}
