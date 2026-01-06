import { NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getUserRoleInGroup,
  getGroupById,
  createGroupInvite,
  listGroupInvites,
} from "@/features/groups/repo";
import { logActivityEvent } from "@/lib/activity-log";
import {
  ok,
  badRequest,
  unauthenticated,
  forbidden,
  notFound,
  internal,
  uuidSchema,
  createInviteBodySchema,
  validateBody,
  formatZodErrors,
} from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthenticated();
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("group_id");

    if (!groupId) {
      return badRequest("group_id is required");
    }

    const uuidResult = uuidSchema.safeParse(groupId);
    if (!uuidResult.success) {
      return badRequest("Invalid group_id format");
    }

    // Check if user is admin of the group (only admins can see invites)
    const role = await getUserRoleInGroup(supabase, user.id, groupId);
    if (role !== "admin") {
      return forbidden("Only group admins can view invites");
    }

    const invites = await listGroupInvites(supabase, groupId);

    return ok(invites);
  } catch (error) {
    console.error("Error fetching invites:", error);
    return internal();
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthenticated();
    }

    const body = await request.json();
    const parsed = validateBody(createInviteBodySchema, body);

    if (!parsed.success) {
      return badRequest("Invalid request body", formatZodErrors(parsed.error));
    }

    const { group_id, expires_in_hours, max_uses, invite_role } = parsed.data;

    // Check if group exists
    const group = await getGroupById(supabase, group_id);
    if (!group) {
      return notFound("Group not found");
    }

    // Check if user is admin of the group
    const role = await getUserRoleInGroup(supabase, user.id, group_id);
    if (role !== "admin") {
      return forbidden("Only group admins can create invites");
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
      inviteRole: invite_role,
      expiresAt,
      maxUses: max_uses,
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
        invite_role,
        max_uses,
      },
    });

    return ok({
      token: invite.token,
      invite_url: inviteUrl,
      expires_at: invite.expires_at,
      max_uses: invite.max_uses,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating invite:", error);
    return internal();
  }
}
