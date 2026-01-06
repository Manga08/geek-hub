import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getUserRoleInGroup,
  getGroupById,
  createGroupInvite,
  listGroupInvites,
} from "@/features/groups/repo";
import type { GroupRole } from "@/features/groups/types";
import { logActivityEvent } from "@/lib/activity-log";

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

    // Check if user is admin of the group (only admins can see invites)
    const role = await getUserRoleInGroup(supabase, user.id, groupId);
    if (role !== "admin") {
      return NextResponse.json(
        { error: "Only group admins can view invites" },
        { status: 403 }
      );
    }

    const invites = await listGroupInvites(supabase, groupId);

    return NextResponse.json(invites);
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const {
      group_id,
      expires_in_hours,
      max_uses,
      invite_role,
    } = body as {
      group_id?: string;
      expires_in_hours?: number;
      max_uses?: number;
      invite_role?: GroupRole;
    };

    // Validate group_id
    if (!group_id || typeof group_id !== "string") {
      return NextResponse.json(
        { error: "group_id is required" },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(group_id)) {
      return NextResponse.json(
        { error: "Invalid group_id format" },
        { status: 400 }
      );
    }

    // Validate invite_role if provided
    if (invite_role && !["admin", "member"].includes(invite_role)) {
      return NextResponse.json(
        { error: "invite_role must be 'admin' or 'member'" },
        { status: 400 }
      );
    }

    // Check if group exists
    const group = await getGroupById(supabase, group_id);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if user is admin of the group
    const role = await getUserRoleInGroup(supabase, user.id, group_id);
    if (role !== "admin") {
      return NextResponse.json(
        { error: "Only group admins can create invites" },
        { status: 403 }
      );
    }

    // Calculate expires_at
    let expiresAt: string | null = null;
    if (expires_in_hours && expires_in_hours > 0) {
      const date = new Date();
      date.setHours(date.getHours() + expires_in_hours);
      expiresAt = date.toISOString();
    }

    // Create invite
    const invite = await createGroupInvite(supabase, {
      groupId: group_id,
      createdBy: user.id,
      inviteRole: invite_role ?? "member",
      expiresAt,
      maxUses: max_uses ?? 1,
    });

    // Build invite URL
    const origin = request.headers.get("origin") ?? request.headers.get("host") ?? "";
    const protocol = origin.startsWith("localhost") ? "http" : "https";
    const baseUrl = origin.startsWith("http") ? origin : `${protocol}://${origin}`;
    const inviteUrl = `${baseUrl}/join?token=${invite.token}`;

    // Log activity event
    await logActivityEvent({
      groupId: group_id,
      actorId: user.id,
      eventType: "invite_created",
      entityType: "invite",
      entityId: invite.token,
      metadata: {
        invite_role: invite_role ?? "member",
        max_uses: max_uses ?? 1,
      },
    });

    return NextResponse.json({
      token: invite.token,
      invite_url: inviteUrl,
      expires_at: invite.expires_at,
      max_uses: invite.max_uses,
    });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
