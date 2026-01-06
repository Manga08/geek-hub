import { NextRequest } from "next/server";
import {
  requireSessionUserId,
  requireApiContext,
} from "@/lib/auth/request-context";
import {
  ok,
  internal,
  validateQuery,
  formatZodErrors,
  badRequest,
} from "@/lib/api";
import { z } from "zod";

// Schema for unread query params
const unreadQuerySchema = z.object({
  group_id: z.string().uuid().optional(),
});

// =========================
// GET /api/activity/unread - Get unread activity count
// =========================
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = validateQuery(unreadQuerySchema, searchParams);

  if (!parsed.success) {
    return badRequest("Invalid query parameters", formatZodErrors(parsed.error));
  }

  const { group_id } = parsed.data;

  let supabase;
  let userId: string;
  let groupId: string | null;

  // If group_id is provided, use lightweight auth (no profiles query)
  if (group_id) {
    const result = await requireSessionUserId();
    if (!result.ok) return result.response;
    supabase = result.supabase;
    userId = result.userId;
    groupId = group_id;
  } else {
    // No group_id: try to get defaultGroupId from context
    const result = await requireApiContext();
    if (!result.ok) {
      // If no group context, return 0 count (graceful fallback)
      return ok({ count: 0 });
    }
    supabase = result.ctx.supabase;
    userId = result.ctx.userId;
    groupId = result.ctx.defaultGroupId;
  }

  if (!groupId) {
    return ok({ count: 0 });
  }

  try {
    // Get last read timestamp for this user/group
    const { data: readRecord } = await supabase
      .from("activity_reads")
      .select("last_read_at")
      .eq("user_id", userId)
      .eq("group_id", groupId)
      .single();

    // If no read record exists, use epoch (count all events)
    const lastReadAt = readRecord?.last_read_at ?? new Date(0).toISOString();

    // Count unread events (exclude user's own events)
    const { count, error } = await supabase
      .from("activity_events")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId)
      .gt("created_at", lastReadAt)
      .neq("actor_id", userId);

    if (error) {
      console.error("GET /api/activity/unread error:", error);
      return internal("Error fetching unread count");
    }

    return ok({ count: count ?? 0 });
  } catch (error) {
    console.error("GET /api/activity/unread error:", error);
    return internal();
  }
}
