import { createSupabaseServerClient, SupabaseServerClient } from "@/lib/supabase/server";
import type {
  List,
  ListWithItemCount,
  ListItem,
  CreateListDTO,
  UpdateListDTO,
  AddListItemDTO,
  UpdateListItemDTO,
} from "./types";

// Context interface for passing pre-authenticated supabase + IDs
export interface ListsRepoContext {
  supabase: SupabaseServerClient;
  userId: string;
  groupId: string;
}

async function getSupabase() {
  return createSupabaseServerClient();
}

async function getCurrentGroupId(supabase: SupabaseServerClient): Promise<string> {
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

export async function listLists(groupId?: string, ctx?: ListsRepoContext): Promise<ListWithItemCount[]> {
  // Use context if provided (avoids re-doing auth)
  const supabase = ctx?.supabase ?? await getSupabase();
  const gid = groupId ?? ctx?.groupId ?? await getCurrentGroupId(supabase);

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
  return (data ?? []).map((list: {
    id: string;
    group_id: string;
    name: string;
    description: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    list_items: { count: number }[];
  }) => ({
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

export async function createList(dto: CreateListDTO, ctx?: ListsRepoContext): Promise<List> {
  // Use context if provided (avoids re-doing auth)
  const supabase = ctx?.supabase ?? await getSupabase();
  const groupId = dto.group_id ?? ctx?.groupId ?? await getCurrentGroupId(supabase);

  // Get userId from context or auth
  let userId = ctx?.userId;
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    userId = user.id;
  }

  const { data, error } = await supabase
    .from("lists")
    .insert({
      group_id: groupId,
      created_by: userId,
      name: dto.name,
      description: dto.description ?? null,
    })
    .select()
    .single();

  if (error) {
    // Preserve Supabase error properties for proper mapping
    const err = new Error(`Error creating list: ${error.message}`) as Error & {
      code?: string;
      details?: string;
      hint?: string;
    };
    err.code = error.code;
    err.details = error.details;
    err.hint = error.hint;
    throw err;
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
    .select(`
      list_id,
      item_id,
      added_by,
      position,
      added_at,
      items (
        type,
        provider,
        external_id,
        title,
        poster_url
      )
    `)
    .eq("list_id", listId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(`Error fetching list items: ${error.message}`);
  }

  type ItemData = { type: string; provider: string; external_id: string; title: string | null; poster_url: string | null };

  // Transform to ListItem shape
  return (data ?? []).map((row) => {
    // Supabase returns single object for 1-to-1 FK joins
    const item = row.items as unknown as ItemData | null;
    return {
      list_id: row.list_id,
      item_id: row.item_id,
      item_type: item?.type ?? "unknown",
      provider: item?.provider ?? "unknown",
      external_id: item?.external_id ?? "",
      added_by: row.added_by,
      title: item?.title ?? null,
      poster_url: item?.poster_url ?? null,
      note: null,
      position: row.position,
      created_at: row.added_at,
    } as ListItem;
  });
}

export async function addListItem(listId: string, dto: AddListItemDTO, ctx?: ListsRepoContext): Promise<ListItem> {
  const supabase = ctx?.supabase ?? await getSupabase();

  // Get userId from context or auth
  let userId = ctx?.userId;
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    userId = user.id;
  }

  // 1. Find or create the item in the items catalog
  // NOTE: Must filter by type + provider + external_id to avoid collisions
  // (external_id can repeat across different types/providers)
  const { data: existingItem } = await supabase
    .from("items")
    .select("id")
    .eq("type", dto.item_type)
    .eq("provider", dto.provider)
    .eq("external_id", dto.external_id)
    .maybeSingle();

  let itemId: string;

  if (existingItem) {
    itemId = existingItem.id;
  } else {
    // Create item in catalog
    const { data: newItem, error: itemError } = await supabase
      .from("items")
      .insert({
        type: dto.item_type,
        provider: dto.provider,
        external_id: dto.external_id,
        title: dto.title ?? "Unknown",
        poster_url: dto.poster_url ?? null,
      })
      .select("id")
      .single();

    if (itemError || !newItem) {
      throw new Error(`Error creating item: ${itemError?.message ?? "unknown"}`);
    }
    itemId = newItem.id;
  }

  // 2. Get max position for new item
  const { data: maxPosData } = await supabase
    .from("list_items")
    .select("position")
    .eq("list_id", listId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (maxPosData?.position ?? -1) + 1;

  // 3. Insert into list_items
  const { data, error } = await supabase
    .from("list_items")
    .insert({
      list_id: listId,
      item_id: itemId,
      added_by: userId,
      position: nextPosition,
    })
    .select(`
      list_id,
      item_id,
      added_by,
      position,
      added_at,
      items (
        type,
        provider,
        external_id,
        title,
        poster_url
      )
    `)
    .single();

  if (error) {
    throw new Error(`Error adding item to list: ${error.message}`);
  }

  // 4. Update list's updated_at
  await supabase
    .from("lists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", listId);

  // Transform to ListItem shape
  type ItemData = { type: string; provider: string; external_id: string; title: string | null; poster_url: string | null };
  const item = data.items as unknown as ItemData;
  return {
    list_id: data.list_id,
    item_id: data.item_id,
    item_type: item.type,
    provider: item.provider,
    external_id: item.external_id,
    added_by: data.added_by,
    title: item.title,
    poster_url: item.poster_url,
    note: null, // Not in schema - if needed, add column
    position: data.position,
    created_at: data.added_at,
  } as ListItem;
}

export async function updateListItem(
  listId: string,
  itemId: string,
  dto: UpdateListItemDTO
): Promise<ListItem> {
  const supabase = await getSupabase();

  // Only position can be updated (note is not in schema)
  const updateData: { position?: number } = {};
  if (dto.position !== undefined) {
    updateData.position = dto.position;
  }

  const { data, error } = await supabase
    .from("list_items")
    .update(updateData)
    .eq("list_id", listId)
    .eq("item_id", itemId)
    .select(`
      list_id,
      item_id,
      added_by,
      position,
      added_at,
      items (
        type,
        provider,
        external_id,
        title,
        poster_url
      )
    `)
    .single();

  if (error) {
    throw new Error(`Error updating list item: ${error.message}`);
  }

  type ItemData = { type: string; provider: string; external_id: string; title: string | null; poster_url: string | null };
  const item = data.items as unknown as ItemData;
  return {
    list_id: data.list_id,
    item_id: data.item_id,
    item_type: item.type,
    provider: item.provider,
    external_id: item.external_id,
    added_by: data.added_by,
    title: item.title,
    poster_url: item.poster_url,
    note: null,
    position: data.position,
    created_at: data.added_at,
  } as ListItem;
}

export async function removeListItem(
  listId: string,
  itemId: string
): Promise<void> {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("list_items")
    .delete()
    .eq("list_id", listId)
    .eq("item_id", itemId);

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
  items: Array<{ item_id: string; position: number }>
): Promise<void> {
  const supabase = await getSupabase();

  // Update positions in batch
  for (const item of items) {
    const { error } = await supabase
      .from("list_items")
      .update({ position: item.position })
      .eq("list_id", listId)
      .eq("item_id", item.item_id);

    if (error) {
      throw new Error(`Error reordering list items: ${error.message}`);
    }
  }
}
