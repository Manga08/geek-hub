import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LibraryEntry, CreateEntryDTO, UpdateEntryDTO } from "./types";

async function getSupabase() {
  return createSupabaseServerClient();
}

export class LibraryRepo {
  async findByItem(
    type: string,
    provider: string,
    externalId: string
  ): Promise<LibraryEntry | null> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("library_entries")
      .select("*")
      .eq("type", type)
      .eq("provider", provider)
      .eq("external_id", externalId)
      .single();

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
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Error fetching library entry: ${error.message}`);
    }

    return data as LibraryEntry | null;
  }

  async create(dto: CreateEntryDTO): Promise<LibraryEntry> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("library_entries")
      .insert({
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

  async listByUser(options?: {
    type?: string;
    status?: string;
    isFavorite?: boolean;
    sort?: "recent" | "rating";
    limit?: number;
    offset?: number;
  }): Promise<LibraryEntry[]> {
    const supabase = await getSupabase();

    // Build query with sort option
    const sortColumn = options?.sort === "rating" ? "rating" : "updated_at";
    const ascending = false; // Always descending (newest first, highest rating first)

    let query = supabase
      .from("library_entries")
      .select("*")
      .order(sortColumn, { ascending, nullsFirst: false });

    if (options?.type) {
      query = query.eq("type", options.type);
    }
    if (options?.status) {
      query = query.eq("status", options.status);
    }
    if (options?.isFavorite !== undefined) {
      query = query.eq("is_favorite", options.isFavorite);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit ?? 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error listing library entries: ${error.message}`);
    }

    return data as LibraryEntry[];
  }
}

export const libraryRepo = new LibraryRepo();
