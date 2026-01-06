import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// =========================
// GET /api/activity/unread - Get unread activity count
// =========================
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get group_id from query params or user's default group
  const { searchParams } = new URL(request.url);
  let groupId = searchParams.get("group_id");

  if (!groupId) {
    // Get current group from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_group_id")
      .eq("id", user.id)
      .single();

    groupId = profile?.default_group_id ?? null;
  }

  if (!groupId) {
    return NextResponse.json({ count: 0 });
  }

  try {
    // Get last read timestamp for this user/group
    const { data: readRecord } = await supabase
      .from("activity_reads")
      .select("last_read_at")
      .eq("user_id", user.id)
      .eq("group_id", groupId)
      .single();

    // If no read record exists, use epoch (count all events)
    // Or use a reasonable default like 30 days ago
    const lastReadAt = readRecord?.last_read_at ?? new Date(0).toISOString();

    // Count unread events (exclude user's own events)
    const { count, error } = await supabase
      .from("activity_events")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId)
      .gt("created_at", lastReadAt)
      .neq("actor_id", user.id); // Don't count own actions

    if (error) {
      console.error("GET /api/activity/unread error:", error);
      return NextResponse.json(
        { error: "Error fetching unread count" },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (error) {
    console.error("GET /api/activity/unread error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
