import type { SupabaseServerClient, GroupRole, GroupRow, GroupWithRole, GroupMemberWithProfile, GroupInviteRow, RpcResult } from "./types";

export async function getFirstGroupIdForUser(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(`Error fetching group membership: ${error.message}`);
  }

  return data?.[0]?.group_id ?? null;
}

export async function getCurrentGroupForUser(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<{ group: GroupRow; role: GroupRole } | null> {
  // 1. Check if user has a default_group_id set
  const { data: profile } = await supabase
    .from("profiles")
    .select("default_group_id")
    .eq("id", userId)
    .maybeSingle();

  const defaultGroupId = profile?.default_group_id;

  // 2. If default_group_id exists, verify membership and return that group
  if (defaultGroupId) {
    const { data: membership } = await supabase
      .from("group_members")
      .select(`
        member_role,
        groups (
          id,
          name,
          created_by,
          created_at
        )
      `)
      .eq("user_id", userId)
      .eq("group_id", defaultGroupId)
      .maybeSingle();

    if (membership?.groups) {
      const groupData = membership.groups as unknown as GroupRow;
      return {
        group: {
          id: groupData.id,
          name: groupData.name,
          created_by: groupData.created_by,
          created_at: groupData.created_at ?? null,
        },
        role: membership.member_role as GroupRole,
      };
    }
  }

  // 3. Fallback: get first group by joined_at (for new users or invalid default)
  const { data, error } = await supabase
    .from("group_members")
    .select(`
      member_role,
      groups (
        id,
        name,
        created_by,
        created_at
      )
    `)
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Error fetching current group: ${error.message}`);
  }

  if (!data?.groups) return null;

  const groupData = data.groups as unknown as GroupRow;

  return {
    group: {
      id: groupData.id,
      name: groupData.name,
      created_by: groupData.created_by,
      created_at: groupData.created_at ?? null,
    },
    role: data.member_role as GroupRole,
  };
}

export async function listGroupsForUser(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<GroupWithRole[]> {
  const { data, error } = await supabase
    .from("group_members")
    .select(`
      member_role,
      groups (
        id,
        name,
        created_by,
        created_at
      )
    `)
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error(`Error fetching groups list: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => {
      const group = row.groups as unknown as GroupRow;
      if (!group) return null;
      return {
        ...group,
        role: row.member_role as GroupRole,
      };
    })
    .filter((g): g is GroupWithRole => g !== null);
}

export async function createGroup(
  supabase: SupabaseServerClient,
  { name, createdBy }: { name: string; createdBy: string },
): Promise<string> {
  const { data, error } = await supabase
    .from("groups")
    .insert({ name, created_by: createdBy })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Error creating group: ${error?.message ?? "unknown"}`);
  }

  return data.id;
}

export async function addMember(
  supabase: SupabaseServerClient,
  { groupId, userId, role }: { groupId: string; userId: string; role: GroupRole },
): Promise<void> {
  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: userId, member_role: role })
    .select("group_id")
    .single();

  if (error) {
    throw new Error(`Error adding member to group: ${error.message}`);
  }
}

export async function isUserMemberOfGroup(
  supabase: SupabaseServerClient,
  userId: string,
  groupId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .maybeSingle();

  if (error) {
    throw new Error(`Error checking membership: ${error.message}`);
  }

  return !!data;
}

export async function setDefaultGroupForUser(
  supabase: SupabaseServerClient,
  userId: string,
  groupId: string,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ default_group_id: groupId })
    .eq("id", userId);

  if (error) {
    throw new Error(`Error setting default group: ${error.message}`);
  }
}

export async function getGroupById(
  supabase: SupabaseServerClient,
  groupId: string,
): Promise<GroupRow | null> {
  const { data, error } = await supabase
    .from("groups")
    .select("id, name, created_by, created_at")
    .eq("id", groupId)
    .maybeSingle();

  if (error) {
    throw new Error(`Error fetching group: ${error.message}`);
  }

  return data;
}

export async function getUserRoleInGroup(
  supabase: SupabaseServerClient,
  userId: string,
  groupId: string,
): Promise<GroupRole | null> {
  const { data, error } = await supabase
    .from("group_members")
    .select("member_role")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .maybeSingle();

  if (error) {
    throw new Error(`Error fetching role: ${error.message}`);
  }

  return data?.member_role as GroupRole | null;
}

// ================================
// Members
// ================================

export async function listGroupMembers(
  supabase: SupabaseServerClient,
  groupId: string,
): Promise<GroupMemberWithProfile[]> {
  const { data, error } = await supabase
    .from("group_members")
    .select(`
      user_id,
      member_role,
      joined_at,
      profiles (
        display_name,
        avatar_url
      )
    `)
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error(`Error fetching group members: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const profile = row.profiles as unknown as { display_name: string | null; avatar_url: string | null } | null;
    return {
      user_id: row.user_id,
      role: row.member_role as GroupRole,
      joined_at: row.joined_at,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    };
  });
}

// ================================
// Invites
// ================================

export async function createGroupInvite(
  supabase: SupabaseServerClient,
  params: {
    groupId: string;
    createdBy: string;
    inviteRole?: GroupRole;
    expiresAt?: string | null;
    maxUses?: number;
  },
): Promise<GroupInviteRow> {
  const { data, error } = await supabase
    .from("group_invites")
    .insert({
      group_id: params.groupId,
      created_by: params.createdBy,
      invite_role: params.inviteRole ?? "member",
      expires_at: params.expiresAt ?? null,
      max_uses: params.maxUses ?? 1,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Error creating invite: ${error?.message ?? "unknown"}`);
  }

  return data as GroupInviteRow;
}

export async function listGroupInvites(
  supabase: SupabaseServerClient,
  groupId: string,
): Promise<GroupInviteRow[]> {
  const { data, error } = await supabase
    .from("group_invites")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Error fetching invites: ${error.message}`);
  }

  return (data ?? []) as GroupInviteRow[];
}

export async function revokeGroupInvite(
  supabase: SupabaseServerClient,
  inviteId: string,
): Promise<void> {
  const { error } = await supabase
    .from("group_invites")
    .update({ revoked: true })
    .eq("id", inviteId);

  if (error) {
    throw new Error(`Error revoking invite: ${error.message}`);
  }
}

export async function redeemGroupInvite(
  supabase: SupabaseServerClient,
  token: string,
): Promise<{ success: boolean; group_id?: string; role?: GroupRole; group?: GroupRow; error?: string; message?: string }> {
  const { data, error } = await supabase.rpc("redeem_group_invite", {
    invite_token: token,
  });

  if (error) {
    throw new Error(`Error redeeming invite: ${error.message}`);
  }

  return data as { success: boolean; group_id?: string; role?: GroupRole; group?: GroupRow; error?: string; message?: string };
}

// ================================
// Phase 3Q: Membership Management (RPC calls)
// ================================

export async function setMemberRole(
  supabase: SupabaseServerClient,
  groupId: string,
  targetUserId: string,
  newRole: GroupRole,
): Promise<RpcResult> {
  const { data, error } = await supabase.rpc("set_member_role", {
    gid: groupId,
    target_user: targetUserId,
    new_role: newRole,
  });

  if (error) {
    throw new Error(`Error setting member role: ${error.message}`);
  }

  return data as RpcResult;
}

export async function removeMember(
  supabase: SupabaseServerClient,
  groupId: string,
  targetUserId: string,
): Promise<RpcResult> {
  const { data, error } = await supabase.rpc("remove_member", {
    gid: groupId,
    target_user: targetUserId,
  });

  if (error) {
    throw new Error(`Error removing member: ${error.message}`);
  }

  return data as RpcResult;
}

export async function leaveGroup(
  supabase: SupabaseServerClient,
  groupId: string,
): Promise<RpcResult> {
  const { data, error } = await supabase.rpc("leave_group", {
    gid: groupId,
  });

  if (error) {
    throw new Error(`Error leaving group: ${error.message}`);
  }

  return data as RpcResult;
}

export async function revokeInvite(
  supabase: SupabaseServerClient,
  inviteId: string,
): Promise<RpcResult> {
  const { data, error } = await supabase.rpc("revoke_invite", {
    invite_id: inviteId,
  });

  if (error) {
    throw new Error(`Error revoking invite: ${error.message}`);
  }

  return data as RpcResult;
}
