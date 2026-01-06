import { readApiJson, ApiError } from "@/lib/api-client";
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
  return readApiJson<LibraryEntry[]>(res);
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
