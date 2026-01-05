import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redeemGroupInvite } from "@/features/groups/repo";
import { logActivityEvent } from "@/lib/activity-log";

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
    const { token } = body as { token?: string };

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "token is required" },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(token)) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    // Call the redeem function
    const result = await redeemGroupInvite(supabase, token);

    if (!result.success) {
      // Map error codes to HTTP status
      const errorStatusMap: Record<string, number> = {
        not_authenticated: 401,
        not_found: 404,
        revoked: 410,
        expired: 410,
        exhausted: 410,
        already_member: 409,
      };

      const status = errorStatusMap[result.error ?? ""] ?? 400;
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status }
      );
    }

    // Log activity events: invite_redeemed and member_joined
    if (result.group) {
      await logActivityEvent({
        groupId: result.group.id,
        actorId: user.id,
        eventType: "invite_redeemed",
        entityType: "invite",
        entityId: token,
        metadata: {
          group_name: result.group.name,
        },
      });

      await logActivityEvent({
        groupId: result.group.id,
        actorId: user.id,
        eventType: "member_joined",
        entityType: "member",
        entityId: user.id,
        metadata: {
          role: result.role,
        },
      });
    }

    return NextResponse.json({
      group: result.group,
      role: result.role,
    });
  } catch (error) {
    console.error("Error redeeming invite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
