import type { SupabaseServerClient, GroupRole, GroupRow } from "./types";

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
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // No rows
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
): Promise<GroupRow[]> {
  const { data, error } = await supabase
    .from("group_members")
    .select(`
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
    .map((row) => row.groups as unknown as GroupRow)
    .filter(Boolean);
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
