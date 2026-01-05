import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { leaveGroup, isUserMemberOfGroup } from "@/features/groups/repo";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { group_id } = body;

    // Validate required field
    if (!group_id) {
      return NextResponse.json(
        { error: "group_id is required" },
        { status: 400 }
      );
    }

    // Validate UUID
    if (!UUID_REGEX.test(group_id)) {
      return NextResponse.json(
        { error: "Invalid group_id format" },
        { status: 400 }
      );
    }

    // Check if user is member of the group
    const isMember = await isUserMemberOfGroup(supabase, user.id, group_id);
    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 404 }
      );
    }

    // Call RPC function
    const result = await leaveGroup(supabase, group_id);

    if (result.error) {
      // Map RPC errors to HTTP status codes
      const statusMap: Record<string, number> = {
        not_authenticated: 401,
        not_found: 404,
        cannot_leave_as_last_admin: 409,
      };
      const status = statusMap[result.error] ?? 500;
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      new_default_group_id: result.new_default_group_id,
      created_new_group: result.created_new_group,
    });
  } catch (error) {
    console.error("Error leaving group:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
