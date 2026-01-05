import type {
  GroupRow,
  CurrentGroupResponse,
  GroupMemberWithProfile,
  CreateInviteParams,
  CreateInviteResponse,
  RedeemInviteResponse,
  SetMemberRoleParams,
  RemoveMemberParams,
  LeaveGroupParams,
  LeaveGroupResponse,
  RevokeInviteParams,
  RpcResult,
  GroupInviteRow,
} from "./types";

export const groupKeys = {
  all: ["groups"] as const,
  current: () => [...groupKeys.all, "current"] as const,
  list: () => [...groupKeys.all, "list"] as const,
  detail: (id: string) => [...groupKeys.all, "detail", id] as const,
  members: (groupId: string) => [...groupKeys.all, "members", groupId] as const,
  invites: (groupId: string) => [...groupKeys.all, "invites", groupId] as const,
};

export async function fetchCurrentGroup(): Promise<CurrentGroupResponse | null> {
  const res = await fetch("/api/groups/current");

  if (!res.ok) {
    if (res.status === 401) return null;
    throw new Error("Error fetching current group");
  }

  return res.json();
}

export async function fetchGroupsList(): Promise<GroupRow[]> {
  const res = await fetch("/api/groups/list");

  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error("Error fetching groups list");
  }

  return res.json();
}

export async function setCurrentGroup(
  groupId: string
): Promise<CurrentGroupResponse> {
  const res = await fetch("/api/groups/current", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ group_id: groupId }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Error setting current group");
  }

  return res.json();
}

export async function fetchGroupMembers(
  groupId: string
): Promise<GroupMemberWithProfile[]> {
  const res = await fetch(`/api/groups/members?group_id=${groupId}`);

  if (!res.ok) {
    throw new Error("Error fetching group members");
  }

  return res.json();
}

export async function createInvite(
  params: CreateInviteParams
): Promise<CreateInviteResponse> {
  const res = await fetch("/api/groups/invites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      group_id: params.groupId,
      expires_in_hours: params.expiresInHours,
      max_uses: params.maxUses,
      invite_role: params.inviteRole,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Error creating invite");
  }

  return res.json();
}

export async function redeemInvite(
  token: string
): Promise<RedeemInviteResponse> {
  const res = await fetch("/api/groups/invites/redeem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.message || error.error || "Error redeeming invite");
  }

  return res.json();
}

// ================================
// Phase 3Q: Membership Management
// ================================

export async function setMemberRole(
  params: SetMemberRoleParams
): Promise<RpcResult> {
  const res = await fetch("/api/groups/members/role", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      group_id: params.groupId,
      user_id: params.userId,
      role: params.role,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.message || error.error || "Error changing role");
  }

  return res.json();
}

export async function removeMember(
  params: RemoveMemberParams
): Promise<RpcResult> {
  const res = await fetch("/api/groups/members/remove", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      group_id: params.groupId,
      user_id: params.userId,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.message || error.error || "Error removing member");
  }

  return res.json();
}

export async function leaveGroup(
  params: LeaveGroupParams
): Promise<LeaveGroupResponse> {
  const res = await fetch("/api/groups/leave", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ group_id: params.groupId }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.message || error.error || "Error leaving group");
  }

  return res.json();
}

export async function fetchGroupInvites(
  groupId: string
): Promise<GroupInviteRow[]> {
  const res = await fetch(`/api/groups/invites?group_id=${groupId}`);

  if (!res.ok) {
    throw new Error("Error fetching invites");
  }

  return res.json();
}

export async function revokeInvite(
  params: RevokeInviteParams
): Promise<RpcResult> {
  const res = await fetch("/api/groups/invites/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invite_id: params.inviteId }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.message || error.error || "Error revoking invite");
  }

  return res.json();
}
