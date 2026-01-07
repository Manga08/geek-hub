import { createSupabaseServerClient, SupabaseServerClient } from "@/lib/supabase/server";
import type { LibraryEntry, CreateEntryDTO, UpdateEntryDTO } from "./types";

// Context interface for passing pre-authenticated supabase + IDs
export interface LibraryRepoContext {
  supabase: SupabaseServerClient;
  userId: string;
  groupId: string;
}

async function getSupabase() {
  return createSupabaseServerClient();
}

async function getCurrentUserId(supabase: SupabaseServerClient): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

async function getCurrentGroupId(supabase: SupabaseServerClient, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("default_group_id")
    .eq("id", userId)
    .single();

  if (!profile?.default_group_id) {
    throw new Error("No default group set for user");
  }

  return profile.default_group_id;
}

export class LibraryRepo {
  /**
   * Find MY entry for a specific item (user-scoped)
   * This is the correct method for checking "do I have this item?"
   */
  async findMyEntryByItem(
    type: string,
    provider: string,
    externalId: string,
    groupId?: string,
    ctx?: LibraryRepoContext
  ): Promise<LibraryEntry | null> {
    // Use context if provided (avoids re-doing auth)
    const supabase = ctx?.supabase ?? await getSupabase();
    const userId = ctx?.userId ?? await getCurrentUserId(supabase);
    const gid = groupId ?? ctx?.groupId ?? await getCurrentGroupId(supabase, userId);

    const { data, error } = await supabase
      .from("library_entries")
      .select("*")
      .eq("group_id", gid)
      .eq("user_id", userId)
      .eq("type", type)
      .eq("provider", provider)
      .eq("external_id", externalId)
      .maybeSingle();

    if (error) {
      throw new Error(`Error fetching library entry: ${error.message}`);
    }

    return data as LibraryEntry | null;
  }

  /**
   * Find ANY entry in the group for an item (group-scoped, for summaries)
   * @deprecated Use findMyEntryByItem for user-specific checks
   */
  async findByItem(
    type: string,
    provider: string,
    externalId: string,
    groupId?: string,
    ctx?: LibraryRepoContext
  ): Promise<LibraryEntry | null> {
    const supabase = ctx?.supabase ?? await getSupabase();
    const userId = ctx?.userId ?? await getCurrentUserId(supabase);
    const gid = groupId ?? ctx?.groupId ?? await getCurrentGroupId(supabase, userId);

    const { data, error } = await supabase
      .from("library_entries")
      .select("*")
      .eq("group_id", gid)
      .eq("type", type)
      .eq("provider", provider)
      .eq("external_id", externalId)
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Error fetching library entry: ${error.message}`);
    }

    return data as LibraryEntry | null;
  }

  async findById(id: string): Promise<LibraryEntry | null> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("library_entries")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Error fetching library entry: ${error.message}`);
    }

    return data as LibraryEntry | null;
  }

  async create(dto: CreateEntryDTO, ctx?: LibraryRepoContext): Promise<LibraryEntry> {
    const supabase = ctx?.supabase ?? await getSupabase();
    const userId = ctx?.userId ?? await getCurrentUserId(supabase);
    const groupId = dto.group_id ?? ctx?.groupId ?? await getCurrentGroupId(supabase, userId);

    const { data, error } = await supabase
      .from("library_entries")
      .insert({
        user_id: userId,
        group_id: groupId,
        type: dto.type,
        provider: dto.provider,
        external_id: dto.external_id,
        title: dto.title ?? null,
        poster_url: dto.poster_url ?? null,
        status: dto.status ?? "planned",
        rating: dto.rating ?? null,
        notes: dto.notes ?? null,
        is_favorite: dto.is_favorite ?? false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating library entry: ${error.message}`);
    }

    return data as LibraryEntry;
  }

  async update(id: string, dto: UpdateEntryDTO): Promise<LibraryEntry> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("library_entries")
      .update({
        ...dto,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating library entry: ${error.message}`);
    }

    return data as LibraryEntry;
  }

  async delete(id: string): Promise<void> {
    const supabase = await getSupabase();
    const { error } = await supabase
      .from("library_entries")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Error deleting library entry: ${error.message}`);
    }
  }

  async toggleFavorite(id: string): Promise<LibraryEntry> {
    const entry = await this.findById(id);
    if (!entry) {
      throw new Error("Library entry not found");
    }

    return this.update(id, { is_favorite: !entry.is_favorite });
  }

  async listByGroup(options?: {
    groupId?: string;
    type?: string;
    status?: string | string[];
    provider?: string;
    isFavorite?: boolean;
    unrated?: boolean;
    q?: string;
    sort?: "recent" | "rating";
    limit?: number;
    offset?: number;
    ctx?: LibraryRepoContext;
  }): Promise<LibraryEntry[]> {
    // Use context if provided (avoids re-doing auth)
    const supabase = options?.ctx?.supabase ?? await getSupabase();
    const userId = options?.ctx?.userId ?? await getCurrentUserId(supabase);
    const groupId = options?.groupId ?? options?.ctx?.groupId ?? await getCurrentGroupId(supabase, userId);

    // Build query with sort option
    const sortColumn = options?.sort === "rating" ? "rating" : "updated_at";
    const ascending = false; // Always descending (newest first, highest rating first)

    let query = supabase
      .from("library_entries")
      .select("*")
      .eq("group_id", groupId)
      .order(sortColumn, { ascending, nullsFirst: false });

    if (options?.type) {
      query = query.eq("type", options.type);
    }
    // Multi-status support
    if (options?.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status];
      query = query.in("status", statuses);
    }
    if (options?.provider) {
      query = query.eq("provider", options.provider);
    }
    if (options?.isFavorite !== undefined) {
      query = query.eq("is_favorite", options.isFavorite);
    }
    if (options?.unrated) {
      query = query.is("rating", null);
    }
    if (options?.q) {
      query = query.ilike("title", `%${options.q}%`);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error listing library entries: ${error.message}`);
    }

    return data as LibraryEntry[];
  }

  /**
   * List MY entries in the current group (user-scoped)
   * This is the correct method for "My Library"
   */
  async listMyEntries(options?: {
    groupId?: string;
    type?: string;
    status?: string | string[];
    provider?: string;
    isFavorite?: boolean;
    unrated?: boolean;
    q?: string;
    sort?: "recent" | "rating";
    limit?: number;
    offset?: number;
    ctx?: LibraryRepoContext;
  }): Promise<LibraryEntry[]> {
    // Use context if provided (avoids re-doing auth)
    const supabase = options?.ctx?.supabase ?? await getSupabase();
    const userId = options?.ctx?.userId ?? await getCurrentUserId(supabase);
    const groupId = options?.groupId ?? options?.ctx?.groupId ?? await getCurrentGroupId(supabase, userId);

    const sortColumn = options?.sort === "rating" ? "rating" : "updated_at";
    const ascending = false;

    let query = supabase
      .from("library_entries")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .order(sortColumn, { ascending, nullsFirst: false });

    if (options?.type) {
      query = query.eq("type", options.type);
    }
    // Multi-status support
    if (options?.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status];
      query = query.in("status", statuses);
    }
    if (options?.provider) {
      query = query.eq("provider", options.provider);
    }
    if (options?.isFavorite !== undefined) {
      query = query.eq("is_favorite", options.isFavorite);
    }
    if (options?.unrated) {
      query = query.is("rating", null);
    }
    if (options?.q) {
      query = query.ilike("title", `%${options.q}%`);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error listing my library entries: ${error.message}`);
    }

    return data as LibraryEntry[];
  }

  /**
   * @deprecated Use listMyEntries for user's library
   */
  async listByUser(options?: {
    type?: string;
    status?: string;
    isFavorite?: boolean;
    sort?: "recent" | "rating";
    limit?: number;
    offset?: number;
  }): Promise<LibraryEntry[]> {
    return this.listMyEntries(options);
  }
}

export const libraryRepo = new LibraryRepo();
