import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileRow = {
  id: string;
  display_name: string | null;
  created_at?: string | null;
};

export async function getProfileById(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Error fetching profile: ${error.message}`);
  }

  return data ?? null;
}

export async function createProfileIfMissing(
  supabase: SupabaseClient,
  { userId, displayName }: { userId: string; displayName: string },
): Promise<ProfileRow> {
  const existing = await getProfileById(supabase, userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userId, display_name: displayName })
    .select("id, display_name, created_at")
    .single();

  if (error || !data) {
    throw new Error(`Error creating profile: ${error?.message ?? "unknown"}`);
  }

  return data;
}
