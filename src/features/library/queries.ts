import { readApiJson, ApiError } from "@/lib/api-client";
import type { LibraryEntry, CreateEntryDTO, UpdateEntryDTO, EntryStatus } from "./types";
import type { UnifiedItemType, Provider } from "@/features/catalog/normalize/unified.types";

const API_BASE = "/api/library/entry";

// =========================
// Lookup Types (batch)
// =========================

export interface LookupItem {
  type: UnifiedItemType;
  provider: Provider;
  external_id: string;
}

/** Minimal entry data returned by batch lookup */
export interface LibraryEntryLookup {
  type: string;
  provider: string;
  external_id: string;
  entry_id: string;
  status: EntryStatus;
  rating: number | null;
  is_favorite: boolean;
}

export interface LibraryListFilters {
  type?: string;
  status?: string | string[]; // Multi-status support
  provider?: string;
  favorite?: boolean;
  unrated?: boolean;
  q?: string;
  sort?: "recent" | "rating";
  scope?: "mine" | "group";
  limit?: number;
  offset?: number;
}

export const libraryKeys = {
  all: ["library"] as const,
  byItem: (type: string, provider: string, externalId: string, groupId?: string) =>
    [...libraryKeys.all, "item", type, provider, externalId, groupId ?? "current"] as const,
  byId: (id: string) => [...libraryKeys.all, "id", id] as const,
  list: (filters?: LibraryListFilters) =>
    [...libraryKeys.all, "list", filters ?? {}] as const,
  lookup: (items: LookupItem[]) =>
    [...libraryKeys.all, "lookup", items] as const,
};

export async function fetchLibraryList(
  filters?: LibraryListFilters
): Promise<LibraryEntry[]> {
  const params = new URLSearchParams();
  if (filters?.type) params.set("type", filters.type);
  // Multi-status: join as CSV
  if (filters?.status) {
    const statusArr = Array.isArray(filters.status) ? filters.status : [filters.status];
    params.set("status", statusArr.join(","));
  }
  if (filters?.provider) params.set("provider", filters.provider);
  if (filters?.favorite !== undefined) params.set("favorite", String(filters.favorite));
  if (filters?.unrated) params.set("unrated", "true");
  if (filters?.q) params.set("q", filters.q);
  if (filters?.sort) params.set("sort", filters.sort);
  if (filters?.scope) params.set("scope", filters.scope);
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.offset) params.set("offset", String(filters.offset));

  const res = await fetch(`/api/library/list?${params}`);
  return readApiJson<LibraryEntry[]>(res);
}

// Bulk action types
export interface BulkActionPayload {
  ids: string[];
  action: "set_status" | "set_favorite" | "delete";
  value?: EntryStatus | boolean;
}

export async function bulkUpdateEntries(payload: BulkActionPayload): Promise<{ success: number; failed: number }> {
  const res = await fetch("/api/library/entry/bulk", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readApiJson<{ success: number; failed: number }>(res);
}

export async function fetchEntryByItem(
  type: string,
  provider: string,
  externalId: string
): Promise<LibraryEntry | null> {
  const params = new URLSearchParams({ type, provider, externalId });
  const res = await fetch(`${API_BASE}?${params}`);

  try {
    return await readApiJson<LibraryEntry>(res);
  } catch (err) {
    // Return null for 404 (not found)
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function createEntry(dto: CreateEntryDTO): Promise<LibraryEntry> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return readApiJson<LibraryEntry>(res);
}

export async function updateEntry(
  id: string,
  dto: UpdateEntryDTO
): Promise<LibraryEntry> {
  const res = await fetch(API_BASE, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...dto }),
  });
  return readApiJson<LibraryEntry>(res);
}

export async function deleteEntry(id: string): Promise<void> {
  const res = await fetch(API_BASE, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  await readApiJson<{ deleted: boolean }>(res);
}

export async function toggleFavorite(id: string): Promise<LibraryEntry> {
  const res = await fetch(`${API_BASE}/favorite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  return readApiJson<LibraryEntry>(res);
}

// =========================
// Batch Lookup
// =========================

/**
 * Batch lookup for library entries - avoids N+1 calls.
 * Returns found entries only (items not in library are omitted).
 * @param items Array of items to lookup (max 50)
 */
export async function fetchEntriesLookup(
  items: LookupItem[]
): Promise<LibraryEntryLookup[]> {
  if (items.length === 0) return [];
  if (items.length > 50) {
    console.warn("fetchEntriesLookup: truncating to 50 items");
    items = items.slice(0, 50);
  }

  const res = await fetch(`${API_BASE}/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });

  const data = await readApiJson<{ found: LibraryEntryLookup[] }>(res);
  return data.found;
}
