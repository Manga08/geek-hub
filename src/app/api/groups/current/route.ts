import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getCurrentGroupForUser,
  isUserMemberOfGroup,
  setDefaultGroupForUser,
  getGroupById,
  getUserRoleInGroup,
} from "@/features/groups/repo";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getCurrentGroupForUser(supabase, user.id);

    if (!result) {
      return NextResponse.json({ error: "No group found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching current group:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { group_id } = body as { group_id?: string };

    if (!group_id || typeof group_id !== "string") {
      return NextResponse.json(
        { error: "group_id is required" },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(group_id)) {
      return NextResponse.json(
        { error: "Invalid group_id format" },
        { status: 400 }
      );
    }

    // Check if group exists
    const group = await getGroupById(supabase, group_id);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if user is member of the group
    const isMember = await isUserMemberOfGroup(supabase, user.id, group_id);
    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // Update default group
    await setDefaultGroupForUser(supabase, user.id, group_id);

    // Get role for response
    const role = await getUserRoleInGroup(supabase, user.id, group_id);

    return NextResponse.json({
      group,
      role: role ?? "member",
    });
  } catch (error) {
    console.error("Error setting current group:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
