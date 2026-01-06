import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// =========================
// POST /api/activity/read - Mark activity as read
// =========================
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get group_id from body or user's default group
    const body = await request.json().catch(() => ({}));
    let groupId = body.group_id as string | undefined;

    if (!groupId) {
      // Get current group from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("default_group_id")
        .eq("id", user.id)
        .single();

      groupId = profile?.default_group_id ?? undefined;
    }

    if (!groupId) {
      return NextResponse.json(
        { error: "No group context" },
        { status: 400 }
      );
    }

    // Upsert the read record
    const { error } = await supabase
      .from("activity_reads")
      .upsert(
        {
          user_id: user.id,
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
      return NextResponse.json(
        { error: "Error marking as read" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/activity/read error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
