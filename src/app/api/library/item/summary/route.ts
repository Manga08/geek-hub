import { NextRequest } from "next/server";
import {
  requireSessionUserId,
  requireApiContext,
} from "@/lib/auth/request-context";
import { ok, badRequest, notFound, internal } from "@/lib/api/respond";
import { z } from "zod";

// =========================
// Types
// =========================

// PostgREST response types
type ProfileMini = { display_name: string | null; avatar_url: string | null };
// PostgREST may return single relation as object or array depending on FK
type GroupMemberRow = {
  user_id: string;
  role: string;
  profiles: ProfileMini | ProfileMini[] | null;
};
type EntryRow = {
  user_id: string;
  status: "planned" | "in_progress" | "completed" | "dropped";
  rating: number | null;
  is_favorite: boolean;
  updated_at: string;
};

interface MemberWithEntry {
  user_id: string;
  member_role: string;
  display_name: string | null;
  avatar_url: string | null;
  entry: {
    rating: number | null;
    status: string;
    is_favorite: boolean;
    updated_at: string;
  } | null;
}

interface ItemSummaryResponse {
  group: {
    id: string;
    name: string;
  };
  members: MemberWithEntry[];
  average_rating: number | null;
  counts: {
    planned: number;
    in_progress: number;
    completed: number;
    dropped: number;
  };
}

// Query params schema
const summaryQuerySchema = z.object({
  type: z.string().min(1),
  provider: z.string().min(1),
  externalId: z.string().min(1),
  group_id: z.string().uuid().optional(),
});

// =========================
// GET /api/library/item/summary
// =========================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = summaryQuerySchema.safeParse({
    type: searchParams.get("type"),
    provider: searchParams.get("provider"),
    externalId: searchParams.get("externalId"),
    group_id: searchParams.get("group_id") ?? undefined,
  });

  if (!parsed.success) {
    return badRequest("Missing required params: type, provider, externalId");
  }

  const { type, provider, externalId, group_id } = parsed.data;

  let supabase;
  let groupId: string;

  // If group_id provided, use lightweight auth (no profiles query)
  if (group_id) {
    const result = await requireSessionUserId();
    if (!result.ok) return result.response;
    supabase = result.supabase;
    groupId = group_id;
  } else {
    // No group_id: get defaultGroupId from context
    const result = await requireApiContext();
    if (!result.ok) return result.response;
    supabase = result.ctx.supabase;
    groupId = result.ctx.defaultGroupId;
  }

  try {
    // Execute queries in parallel for performance
    const [groupResult, membersResult, entriesResult] = await Promise.all([
      // Get group info
      supabase
        .from("groups")
        .select("id, name")
        .eq("id", groupId)
        .single(),
      // Get group members with profiles
      supabase
        .from("group_members")
        .select(`
          user_id,
          role,
          profiles:profiles!group_members_user_id_profiles_fkey(display_name, avatar_url)
        `)
        .eq("group_id", groupId),
      // Get library entries for this item
      supabase
        .from("library_entries")
        .select("user_id, status, rating, is_favorite, updated_at")
        .eq("group_id", groupId)
        .eq("type", type)
        .eq("provider", provider)
        .eq("external_id", externalId),
    ]);

    if (groupResult.error || !groupResult.data) {
      return notFound("Group not found");
    }

    if (membersResult.error) {
      console.error("Error fetching members:", membersResult.error);
      return internal("Error fetching group members");
    }

    if (entriesResult.error) {
      console.error("Error fetching entries:", entriesResult.error);
      return internal("Error fetching library entries");
    }

    const group = groupResult.data;
    // Cast through unknown for PostgREST's dynamic return types
    const membersData = membersResult.data as unknown as GroupMemberRow[];
    const entriesData = entriesResult.data as unknown as EntryRow[];

    // Create a map of entries by user_id
    const entriesMap = new Map<string, {
      rating: number | null;
      status: string;
      is_favorite: boolean;
      updated_at: string;
    }>();

    for (const entry of entriesData) {
      entriesMap.set(entry.user_id, {
        rating: entry.rating,
        status: entry.status,
        is_favorite: entry.is_favorite,
        updated_at: entry.updated_at,
      });
    }

    // Build members array with their entries
    const members: MemberWithEntry[] = membersData.map((member: GroupMemberRow) => {
      // PostgREST may return single relation as object or array
      const profileData = member.profiles;
      const profile = Array.isArray(profileData) ? profileData[0] : profileData;
      return {
        user_id: member.user_id,
        member_role: member.role,
        display_name: profile?.display_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        entry: entriesMap.get(member.user_id) ?? null,
      };
    });

    // Calculate average rating (only from entries with ratings)
    const ratings = Array.from(entriesMap.values())
      .map((e) => e.rating)
      .filter((r): r is number => r !== null);

    const averageRating = ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;

    // Count statuses
    const counts = {
      planned: 0,
      in_progress: 0,
      completed: 0,
      dropped: 0,
    };

    for (const entry of entriesMap.values()) {
      if (entry.status in counts) {
        counts[entry.status as keyof typeof counts]++;
      }
    }

    const response: ItemSummaryResponse = {
      group: { id: group.id, name: group.name },
      members,
      average_rating: averageRating,
      counts,
    };

    return ok(response);
  } catch (error) {
    console.error("GET /api/library/item/summary error:", error);
    return internal();
  }
}
