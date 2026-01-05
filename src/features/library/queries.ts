import type { LibraryEntry, CreateEntryDTO, UpdateEntryDTO } from "./types";

const API_BASE = "/api/library/entry";

export interface LibraryListFilters {
  type?: string;
  status?: string;
  favorite?: boolean;
  sort?: "recent" | "rating";
  groupId?: string; // Optional for multi-tenant queries
}

export const libraryKeys = {
  all: ["library"] as const,
  byItem: (type: string, provider: string, externalId: string, groupId?: string) =>
    [...libraryKeys.all, "item", type, provider, externalId, groupId ?? "current"] as const,
  byId: (id: string) => [...libraryKeys.all, "id", id] as const,
  list: (filters?: LibraryListFilters) =>
    [...libraryKeys.all, "list", filters ?? {}] as const,
};

export async function fetchLibraryList(
  filters?: LibraryListFilters
): Promise<LibraryEntry[]> {
  const params = new URLSearchParams();
  if (filters?.type) params.set("type", filters.type);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.favorite !== undefined) params.set("favorite", String(filters.favorite));
  if (filters?.sort) params.set("sort", filters.sort);

  const res = await fetch(`/api/library/list?${params}`);

  if (!res.ok) {
    throw new Error("Error fetching library list");
  }

  return res.json();
}

export async function fetchEntryByItem(
  type: string,
  provider: string,
  externalId: string
): Promise<LibraryEntry | null> {
  const params = new URLSearchParams({ type, provider, externalId });
  const res = await fetch(`${API_BASE}?${params}`);

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Error fetching library entry");
  }

  return res.json();
}

export async function createEntry(dto: CreateEntryDTO): Promise<LibraryEntry> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error creating entry" }));
    throw new Error(error.message || "Error creating entry");
  }

  return res.json();
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

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error updating entry" }));
    throw new Error(error.message || "Error updating entry");
  }

  return res.json();
}

export async function deleteEntry(id: string): Promise<void> {
  const res = await fetch(API_BASE, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error deleting entry" }));
    throw new Error(error.message || "Error deleting entry");
  }
}

export async function toggleFavorite(id: string): Promise<LibraryEntry> {
  const res = await fetch(`${API_BASE}/favorite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error toggling favorite" }));
    throw new Error(error.message || "Error toggling favorite");
  }

  return res.json();
}
