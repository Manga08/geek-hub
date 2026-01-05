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

export type SupabaseServerClient = SupabaseClient;
