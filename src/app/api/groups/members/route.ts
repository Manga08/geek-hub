import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listGroupMembers, getUserRoleInGroup } from "@/features/groups/repo";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("group_id");

    if (!groupId) {
      return NextResponse.json(
        { error: "group_id is required" },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(groupId)) {
      return NextResponse.json(
        { error: "Invalid group_id format" },
        { status: 400 }
      );
    }

    // Check if user is member of the group
    const role = await getUserRoleInGroup(supabase, user.id, groupId);
    if (!role) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    const members = await listGroupMembers(supabase, groupId);

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching group members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
