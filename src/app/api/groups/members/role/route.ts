import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { setMemberRole, getUserRoleInGroup } from "@/features/groups/repo";
import type { GroupRole } from "@/features/groups/types";
import { logActivityEvent } from "@/lib/activity-log";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const { group_id, user_id, role } = body;

    // Validate required fields
    if (!group_id || !user_id || !role) {
      return NextResponse.json(
        { error: "group_id, user_id, and role are required" },
        { status: 400 }
      );
    }

    // Validate UUIDs
    if (!UUID_REGEX.test(group_id) || !UUID_REGEX.test(user_id)) {
      return NextResponse.json(
        { error: "Invalid UUID format" },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== "admin" && role !== "member") {
      return NextResponse.json(
        { error: "Role must be 'admin' or 'member'" },
        { status: 400 }
      );
    }

    // Check if caller is admin of the group
    const callerRole = await getUserRoleInGroup(supabase, user.id, group_id);
    if (callerRole !== "admin") {
      return NextResponse.json(
        { error: "Only admins can change member roles" },
        { status: 403 }
      );
    }

    // Call RPC function
    const result = await setMemberRole(supabase, group_id, user_id, role as GroupRole);

    if (result.error) {
      // Map RPC errors to HTTP status codes
      const statusMap: Record<string, number> = {
        not_authenticated: 401,
        invalid_role: 400,
        forbidden: 403,
        not_found: 404,
        cannot_demote_last_admin: 409,
      };
      const status = statusMap[result.error] ?? 500;
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status }
      );
    }

    // Log activity event
    await logActivityEvent({
      groupId: group_id,
      actorId: user.id,
      eventType: "member_role_changed",
      entityType: "member",
      entityId: user_id,
      metadata: {
        new_role: role,
        target_user_id: user_id,
      },
    });

    return NextResponse.json({ success: true, new_role: result.new_role });
  } catch (error) {
    console.error("Error setting member role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
