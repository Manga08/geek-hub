import { NextRequest } from "next/server";
import { requireSessionUserId } from "@/lib/auth/request-context";
import { ok, badRequest, internal, validateQuery, formatZodErrors } from "@/lib/api";
import { z } from "zod";
import {
  listGroupsForUser,
  getCurrentGroupForUser,
} from "@/features/groups/repo";
import type { GroupRow, GroupRole } from "@/features/groups/types";
import type { UserProfile } from "@/features/profile/types";
import type { ActivityFeedResponse, ActivityEvent } from "@/features/activity/types";

// =========================
// Types
// =========================

interface AppInitResponse {
  profile: UserProfile;
  groupsList: GroupRow[];
  currentGroup: { group: GroupRow; role: GroupRole } | null;
  unreadCount: number;
  activityFeed: ActivityFeedResponse;
}

// Query params schema
const initQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(8),
  group_id: z.string().uuid().optional(),
});

// =========================
// GET /api/init - Bootstrap endpoint
// =========================
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = validateQuery(initQuerySchema, searchParams);

  if (!parsed.success) {
    return badRequest("Invalid query parameters", formatZodErrors(parsed.error));
  }

  const { limit, group_id } = parsed.data;

  // Lightweight auth - no profiles query roundtrip
  const authResult = await requireSessionUserId();
  if (!authResult.ok) return authResult.response;

  const { supabase, userId, email } = authResult;

  try {
    // Execute all queries in parallel
    const [profileResult, groupsListResult, currentGroupResult] = await Promise.all([
      // a) Profile
      supabase
        .from("profiles")
        .select("id, display_name, avatar_url, default_group_id, created_at, updated_at")
        .eq("id", userId)
        .single(),
      // b) Groups list
      listGroupsForUser(supabase, userId),
      // c) Current group
      getCurrentGroupForUser(supabase, userId),
    ]);

    // Build profile (even if not found, construct minimal)
    const profile: UserProfile = profileResult.data
      ? { ...profileResult.data, email }
      : {
        id: userId,
        display_name: null,
        avatar_url: null,
        default_group_id: null,
        email,
      };

    const groupsList = groupsListResult;

    // Determine which group to use
    let currentGroup = currentGroupResult;

    // If group_id provided and user belongs to it, use that instead
    if (group_id && groupsList.some((g) => g.id === group_id)) {
      // Find the group and determine role
      const memberResult = await supabase
        .from("group_members")
        .select("member_role")
        .eq("group_id", group_id)
        .eq("user_id", userId)
        .single();

      if (memberResult.data) {
        const targetGroup = groupsList.find((g) => g.id === group_id)!;
        currentGroup = {
          group: targetGroup,
          role: memberResult.data.member_role as GroupRole,
        };
      }
    }

    const groupId = currentGroup?.group.id ?? null;

    // d) & e) Fetch unread count and activity feed in parallel (if group exists)
    let unreadCount = 0;
    let activityFeed: ActivityFeedResponse = {
      events: [],
      hasMore: false,
      nextCursor: null,
    };

    if (groupId) {
      const [unreadResult, feedResult] = await Promise.all([
        // Unread count logic
        (async () => {
          // Get last read timestamp
          const { data: readRecord } = await supabase
            .from("activity_reads")
            .select("last_read_at")
            .eq("user_id", userId)
            .eq("group_id", groupId)
            .single();

          const lastReadAt = readRecord?.last_read_at ?? new Date(0).toISOString();

          // Count unread (exclude own events)
          const { count, error } = await supabase
            .from("activity_events")
            .select("*", { count: "exact", head: true })
            .eq("group_id", groupId)
            .gt("created_at", lastReadAt)
            .neq("actor_id", userId);

          if (error) {
            console.error("Error fetching unread count:", error);
            return 0;
          }
          return count ?? 0;
        })(),
        // Activity feed (first page)
        (async () => {
          const { data, error } = await supabase
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

          if (error) {
            console.error("Error fetching activity feed:", error);
            return { events: [], hasMore: false, nextCursor: null };
          }

          const events = (data ?? []) as unknown as ActivityEvent[];
          const hasMore = events.length === limit;
          const nextCursor = hasMore && events.length > 0
            ? events[events.length - 1].created_at
            : null;

          return { events, hasMore, nextCursor };
        })(),
      ]);

      unreadCount = unreadResult;
      activityFeed = feedResult;
    }

    const response: AppInitResponse = {
      profile,
      groupsList,
      currentGroup,
      unreadCount,
      activityFeed,
    };

    return ok(response);
  } catch (error) {
    console.error("GET /api/init error:", error);
    return internal();
  }
}
