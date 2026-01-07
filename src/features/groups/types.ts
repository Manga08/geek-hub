import type { SupabaseClient } from "@supabase/supabase-js";

export type GroupRole = "admin" | "member";

export type GroupRow = {
  id: string;
  name: string;
  created_by: string;
  created_at?: string | null;
};

/** Group with the user's role in that group */
export type GroupWithRole = GroupRow & {
  role: GroupRole;
};

export type GroupMemberRow = {
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at?: string | null;
};

export interface CurrentGroupResponse {
  group: GroupRow;
  role: GroupRole;
}

export interface GroupMemberWithProfile {
  user_id: string;
  role: GroupRole;
  joined_at: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface GroupInviteRow {
  id: string;
  group_id: string;
  token: string;
  created_by: string;
  invite_role: GroupRole;
  expires_at: string | null;
  max_uses: number;
  uses_count: number;
  revoked: boolean;
  created_at: string;
}

export interface CreateInviteParams {
  groupId: string;
  expiresInHours?: number;
  maxUses?: number;
  inviteRole?: GroupRole;
}

export interface CreateInviteResponse {
  token: string;
  invite_url: string;
  expires_at: string | null;
  max_uses: number;
}

export interface RedeemInviteResponse {
  group: GroupRow;
  role: GroupRole;
}

// ================================
// Phase 3Q: Membership Management
// ================================

export interface SetMemberRoleParams {
  groupId: string;
  userId: string;
  role: GroupRole;
}

export interface RemoveMemberParams {
  groupId: string;
  userId: string;
}

export interface LeaveGroupParams {
  groupId: string;
}

export interface LeaveGroupResponse {
  success: boolean;
  new_default_group_id: string | null;
  created_new_group: boolean;
}

export interface RevokeInviteParams {
  inviteId: string;
}

export interface UpdateGroupNameParams {
  groupId: string;
  name: string;
}

export interface RpcResult {
  success?: boolean;
  error?: string;
  message?: string;
  new_role?: GroupRole;
  new_default_group_id?: string | null;
  created_new_group?: boolean;
}

export type SupabaseServerClient = SupabaseClient;
