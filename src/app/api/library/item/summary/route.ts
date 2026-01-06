import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// =========================
// Types
// =========================

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
    watching: number;
    completed: number;
    dropped: number;
  };
}

// =========================
// GET /api/library/item/summary
// =========================

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const provider = searchParams.get("provider");
  const externalId = searchParams.get("externalId");

  if (!type || !provider || !externalId) {
    return NextResponse.json(
      { error: "Missing required params: type, provider, externalId" },
      { status: 400 }
    );
  }

  try {
    // Get user's current group
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_group_id")
      .eq("id", user.id)
      .single();

    if (!profile?.default_group_id) {
      return NextResponse.json({ error: "No group context" }, { status: 404 });
    }

    const groupId = profile.default_group_id;

    // Get group info
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, name")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Get group members with profiles using explicit FK
    const { data: membersData, error: membersError } = await supabase
      .from("group_members")
      .select(`
        user_id,
        role,
        profiles:profiles!group_members_user_id_profiles_fkey(display_name, avatar_url)
      `)
      .eq("group_id", groupId);

    if (membersError) {
      console.error("Error fetching members:", membersError);
      return NextResponse.json(
        { error: "Error fetching group members" },
        { status: 500 }
      );
    }

    // Get all library entries for this item in this group using explicit FK
    const { data: entriesData, error: entriesError } = await supabase
      .from("library_entries")
      .select(`
        user_id,
        rating,
        status,
        is_favorite,
        updated_at,
        profiles:profiles!library_entries_user_id_profiles_fkey(display_name, avatar_url)
      `)
      .eq("group_id", groupId)
      .eq("type", type)
      .eq("provider", provider)
      .eq("external_id", externalId);

    if (entriesError) {
      console.error("Error fetching entries:", entriesError);
      return NextResponse.json(
        { error: "Error fetching library entries" },
        { status: 500 }
      );
    }

    // Create a map of entries by user_id
    const entriesMap = new Map<string, {
      rating: number | null;
      status: string;
      is_favorite: boolean;
      updated_at: string;
    }>();

    for (const entry of entriesData ?? []) {
      entriesMap.set(entry.user_id, {
        rating: entry.rating,
        status: entry.status,
        is_favorite: entry.is_favorite,
        updated_at: entry.updated_at,
      });
    }

    // Build members array with their entries
    const members: MemberWithEntry[] = (membersData ?? []).map((member) => {
      // PostgREST returns single relation as object, not array
      const profiles = member.profiles as unknown as { display_name: string | null; avatar_url: string | null } | null;
      return {
        user_id: member.user_id,
        member_role: member.role,
        display_name: profiles?.display_name ?? null,
        avatar_url: profiles?.avatar_url ?? null,
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
      watching: 0,
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

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/library/item/summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
