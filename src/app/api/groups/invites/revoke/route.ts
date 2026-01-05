import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revokeInvite } from "@/features/groups/repo";

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
    const { invite_id } = body;

    // Validate required field
    if (!invite_id) {
      return NextResponse.json(
        { error: "invite_id is required" },
        { status: 400 }
      );
    }

    // Validate UUID
    if (!UUID_REGEX.test(invite_id)) {
      return NextResponse.json(
        { error: "Invalid invite_id format" },
        { status: 400 }
      );
    }

    // Call RPC function (handles admin check internally)
    const result = await revokeInvite(supabase, invite_id);

    if (result.error) {
      // Map RPC errors to HTTP status codes
      const statusMap: Record<string, number> = {
        not_authenticated: 401,
        forbidden: 403,
        not_found: 404,
      };
      const status = statusMap[result.error] ?? 500;
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking invite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
