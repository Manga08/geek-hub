import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listGroupsForUser } from "@/features/groups/repo";

/**
 * GET /api/groups/list
 * Returns all groups the user belongs to, including their role in each group
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Now returns GroupWithRole[] (includes role)
    const groups = await listGroupsForUser(supabase, user.id);

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching groups list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
