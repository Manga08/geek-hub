import { NextRequest, NextResponse } from "next/server";

import { requireSessionUserId } from "@/lib/auth/request-context";
import {
  getCurrentGroupForUser,
  isUserMemberOfGroup,
  setDefaultGroupForUser,
  getGroupById,
  getUserRoleInGroup,
} from "@/features/groups/repo";

export async function GET() {
  try {
    // Single auth call via getSession()
    const result = await requireSessionUserId();
    if (!result.ok) return result.response;

    const { supabase, userId } = result;

    const group = await getCurrentGroupForUser(supabase, userId);

    if (!group) {
      return NextResponse.json({ error: "No group found" }, { status: 404 });
    }

    return NextResponse.json(group);
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
    // Single auth call via getSession()
    const result = await requireSessionUserId();
    if (!result.ok) return result.response;

    const { supabase, userId } = result;

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
    const isMember = await isUserMemberOfGroup(supabase, userId, group_id);
    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // Update default group
    await setDefaultGroupForUser(supabase, userId, group_id);

    // Get role for response
    const role = await getUserRoleInGroup(supabase, userId, group_id);

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
