import { NextRequest } from "next/server";
import {
  requireSessionUserId,
  requireApiContext,
} from "@/lib/auth/request-context";
import {
  ok,
  badRequest,
  internal,
} from "@/lib/api";
import { z } from "zod";

// Schema for read body
const readBodySchema = z.object({
  group_id: z.string().uuid().optional(),
});

// =========================
// POST /api/activity/read - Mark activity as read
// =========================
export async function POST(request: NextRequest) {
  let supabase;
  let userId: string;
  let groupId: string | undefined;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = readBodySchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid request body");
    }

    const { group_id } = parsed.data;

    // If group_id is provided, use lightweight auth (no profiles query)
    if (group_id) {
      const result = await requireSessionUserId();
      if (!result.ok) return result.response;
      supabase = result.supabase;
      userId = result.userId;
      groupId = group_id;
    } else {
      // No group_id: get defaultGroupId from context
      const result = await requireApiContext();
      if (!result.ok) return result.response;
      supabase = result.ctx.supabase;
      userId = result.ctx.userId;
      groupId = result.ctx.defaultGroupId;
    }

    if (!groupId) {
      return badRequest("No group context");
    }

    // Upsert the read record
    const { error } = await supabase
      .from("activity_reads")
      .upsert(
        {
          user_id: userId,
          group_id: groupId,
          last_read_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,group_id",
        }
      );

    if (error) {
      console.error("POST /api/activity/read error:", error);
      return internal("Error marking as read");
    }

    return ok({ success: true });
  } catch (error) {
    console.error("POST /api/activity/read error:", error);
    return internal();
  }
}
