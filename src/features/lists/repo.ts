import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  List,
  ListWithItemCount,
  ListItem,
  CreateListDTO,
  UpdateListDTO,
  AddListItemDTO,
  UpdateListItemDTO,
} from "./types";

async function getSupabase() {
  return createSupabaseServerClient();
}

async function getCurrentGroupId(supabase: Awaited<ReturnType<typeof getSupabase>>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_group_id")
    .eq("id", user.id)
    .single();

  if (!profile?.default_group_id) {
    throw new Error("No default group set for user");
  }

  return profile.default_group_id;
}

// =========================
// Lists CRUD
// =========================

export async function listLists(groupId?: string): Promise<ListWithItemCount[]> {
  const supabase = await getSupabase();
  const gid = groupId ?? await getCurrentGroupId(supabase);

  // Get lists with item count via a subquery
  const { data, error } = await supabase
    .from("lists")
    .select(`
      *,
      list_items(count)
    `)
    .eq("group_id", gid)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Error fetching lists: ${error.message}`);
  }

  // Transform the count from Supabase's format
  return (data ?? []).map((list) => ({
    id: list.id,
    group_id: list.group_id,
    name: list.name,
    description: list.description,
    created_by: list.created_by,
    created_at: list.created_at,
    updated_at: list.updated_at,
    item_count: (list.list_items as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));
}

export async function getList(listId: string): Promise<List | null> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("lists")
    .select("*")
    .eq("id", listId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Error fetching list: ${error.message}`);
  }

  return data as List;
}

export async function createList(dto: CreateListDTO): Promise<List> {
  const supabase = await getSupabase();
  const groupId = dto.group_id ?? await getCurrentGroupId(supabase);

  const { data, error } = await supabase
    .from("lists")
    .insert({
      group_id: groupId,
      name: dto.name,
      description: dto.description ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating list: ${error.message}`);
  }

  return data as List;
}

export async function updateList(listId: string, dto: UpdateListDTO): Promise<List> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("lists")
    .update({
      ...dto,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating list: ${error.message}`);
  }

  return data as List;
}

export async function deleteList(listId: string): Promise<void> {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("lists")
    .delete()
    .eq("id", listId);

  if (error) {
    throw new Error(`Error deleting list: ${error.message}`);
  }
}

// =========================
// List Items CRUD
// =========================

export async function listItems(listId: string): Promise<ListItem[]> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("list_items")
    .select("*")
    .eq("list_id", listId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(`Error fetching list items: ${error.message}`);
  }

  return data as ListItem[];
}

export async function addListItem(listId: string, dto: AddListItemDTO): Promise<ListItem> {
  const supabase = await getSupabase();

  // Get max position for new item
  const { data: maxPosData } = await supabase
    .from("list_items")
    .select("position")
    .eq("list_id", listId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const nextPosition = (maxPosData?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("list_items")
    .insert({
      list_id: listId,
      item_type: dto.item_type,
      provider: dto.provider,
      external_id: dto.external_id,
      title: dto.title ?? null,
      poster_url: dto.poster_url ?? null,
      note: dto.note ?? null,
      position: nextPosition,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error adding item to list: ${error.message}`);
  }

  // Update list's updated_at
  await supabase
    .from("lists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", listId);

  return data as ListItem;
}

export async function updateListItem(
  listId: string,
  itemType: string,
  provider: string,
  externalId: string,
  dto: UpdateListItemDTO
): Promise<ListItem> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("list_items")
    .update(dto)
    .eq("list_id", listId)
    .eq("item_type", itemType)
    .eq("provider", provider)
    .eq("external_id", externalId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating list item: ${error.message}`);
  }

  return data as ListItem;
}

export async function removeListItem(
  listId: string,
  itemType: string,
  provider: string,
  externalId: string
): Promise<void> {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("list_items")
    .delete()
    .eq("list_id", listId)
    .eq("item_type", itemType)
    .eq("provider", provider)
    .eq("external_id", externalId);

  if (error) {
    throw new Error(`Error removing item from list: ${error.message}`);
  }

  // Update list's updated_at
  await supabase
    .from("lists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", listId);
}

export async function reorderListItems(
  listId: string,
  items: Array<{ item_type: string; provider: string; external_id: string; position: number }>
): Promise<void> {
  const supabase = await getSupabase();

  // Update positions in batch
  for (const item of items) {
    const { error } = await supabase
      .from("list_items")
      .update({ position: item.position })
      .eq("list_id", listId)
      .eq("item_type", item.item_type)
      .eq("provider", item.provider)
      .eq("external_id", item.external_id);

    if (error) {
      throw new Error(`Error reordering list items: ${error.message}`);
    }
  }
}
