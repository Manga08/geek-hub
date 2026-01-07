import { readApiJson } from "@/lib/api-client";
import type {
  GroupRow,
  GroupWithRole,
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
  UpdateGroupNameParams,
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
  if (res.status === 401) return null;
  return readApiJson<CurrentGroupResponse>(res);
}

export async function fetchGroupsList(): Promise<GroupWithRole[]> {
  const res = await fetch("/api/groups/list");
  if (res.status === 401) return [];
  return readApiJson<GroupWithRole[]>(res);
}

export async function setCurrentGroup(
  groupId: string
): Promise<CurrentGroupResponse> {
  const res = await fetch("/api/groups/current", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ group_id: groupId }),
  });
  return readApiJson<CurrentGroupResponse>(res);
}

export async function fetchGroupMembers(
  groupId: string
): Promise<GroupMemberWithProfile[]> {
  const res = await fetch(`/api/groups/members?group_id=${groupId}`);
  return readApiJson<GroupMemberWithProfile[]>(res);
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
  return readApiJson<CreateInviteResponse>(res);
}

export async function redeemInvite(
  token: string
): Promise<RedeemInviteResponse> {
  const res = await fetch("/api/groups/invites/redeem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return readApiJson<RedeemInviteResponse>(res);
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
  return readApiJson<RpcResult>(res);
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
  return readApiJson<RpcResult>(res);
}

export async function leaveGroup(
  params: LeaveGroupParams
): Promise<LeaveGroupResponse> {
  const res = await fetch("/api/groups/leave", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ group_id: params.groupId }),
  });
  return readApiJson<LeaveGroupResponse>(res);
}

export async function fetchGroupInvites(
  groupId: string
): Promise<GroupInviteRow[]> {
  const res = await fetch(`/api/groups/invites?group_id=${groupId}`);
  return readApiJson<GroupInviteRow[]>(res);
}

export async function revokeInvite(
  params: RevokeInviteParams
): Promise<RpcResult> {
  const res = await fetch("/api/groups/invites/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invite_id: params.inviteId }),
  });
  return readApiJson<RpcResult>(res);
}

// ================================
// Phase 4B: Update Group Name
// ================================

export async function updateGroupName(
  params: UpdateGroupNameParams
): Promise<GroupRow> {
  const res = await fetch("/api/groups/name", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      group_id: params.groupId,
      name: params.name,
    }),
  });
  return readApiJson<GroupRow>(res);
}
