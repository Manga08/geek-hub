import type { SupabaseServerClient, GroupRole } from "./types";

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
    .insert({ group_id: groupId, user_id: userId, role })
    .select("group_id")
    .single();

  if (error) {
    throw new Error(`Error adding member to group: ${error.message}`);
  }
}
