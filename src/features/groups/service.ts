import { createProfileIfMissing } from "@/features/profiles/repo";
import { addMember, createGroup, getFirstGroupIdForUser } from "./repo";
import type { SupabaseServerClient } from "./types";

export async function ensureProfileAndDefaultGroup(
  supabase: SupabaseServerClient,
): Promise<{ userId: string; groupId: string }> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }

  if (!user) {
    throw new Error("User not found after authentication");
  }

  const displayName = user.email?.split("@")[0] ?? "Usuario";

  await createProfileIfMissing(supabase, { userId: user.id, displayName });

  const existingGroupId = await getFirstGroupIdForUser(supabase, user.id);
  if (existingGroupId) {
    return { userId: user.id, groupId: existingGroupId };
  }

  const groupId = await createGroup(supabase, { name: "Mi grupo", createdBy: user.id });
  await addMember(supabase, { groupId, userId: user.id, role: "admin" });

  return { userId: user.id, groupId };
}
