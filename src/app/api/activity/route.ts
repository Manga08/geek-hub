import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Get current group from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("default_group_id")
    .eq("id", user.id)
    .single();

  if (!profile?.default_group_id) {
    return NextResponse.json({ message: "No group context" }, { status: 400 });
  }

  const groupId = profile.default_group_id;

  // Parse query params
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const before = searchParams.get("before"); // ISO timestamp for cursor
  const entityType = searchParams.get("entity_type"); // Optional filter

  try {
    // First, fetch activity events
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
    if (entityType && ["group", "list", "list_item", "library_entry", "invite", "member"].includes(entityType)) {
      query = query.eq("entity_type", entityType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("GET /api/activity error:", error);
      return NextResponse.json(
        { message: "Error fetching activity" },
        { status: 500 }
      );
    }

    // Determine if there are more results (for pagination)
    const hasMore = data?.length === limit;
    const nextCursor = hasMore && data?.length ? data[data.length - 1].created_at : null;

    return NextResponse.json({
      events: data ?? [],
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("GET /api/activity error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
