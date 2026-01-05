import type { SupabaseClient } from "@supabase/supabase-js";

export type GroupRole = "admin" | "member";

export type GroupRow = {
  id: string;
  name: string;
  created_by: string;
  created_at?: string | null;
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

export type SupabaseServerClient = SupabaseClient;
