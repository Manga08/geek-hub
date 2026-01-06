import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * PATCH /api/groups/name
 * Update the group name. Only admins can do this.
 */
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
    const { group_id, name } = body;

    if (!group_id || typeof group_id !== "string") {
      return NextResponse.json(
        { error: "group_id is required" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "name is required and must be non-empty" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: "Group name must be 100 characters or less" },
        { status: 400 }
      );
    }

    // Check if user is an admin of the group
    const { data: membership, error: membershipError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", group_id)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    if (membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can update the group name" },
        { status: 403 }
      );
    }

    // Update the group name
    const { data: updatedGroup, error: updateError } = await supabase
      .from("groups")
      .update({ name: trimmedName })
      .eq("id", group_id)
      .select("id, name, created_by, created_at")
      .single();

    if (updateError) {
      console.error("Error updating group name:", updateError);
      return NextResponse.json(
        { error: "Failed to update group name" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedGroup);
  } catch (err) {
    console.error("Error in PATCH /api/groups/name:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
