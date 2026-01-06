import { readApiJson } from "@/lib/api-client";
import type {
  ListWithItemCount,
  List,
  ListItem,
  CreateListDTO,
  UpdateListDTO,
  AddListItemDTO,
  UpdateListItemDTO,
  ListsResponse,
  ListDetailResponse,
} from "./types";

const API_BASE = "/api/lists";

// =========================
// Query Keys
// =========================

export const listKeys = {
  all: (groupId?: string) => ["lists", groupId ?? "current"] as const,
  detail: (listId: string) => ["lists", "detail", listId] as const,
  items: (listId: string) => ["lists", "items", listId] as const,
};

// =========================
// Lists API
// =========================

export async function fetchLists(): Promise<ListWithItemCount[]> {
  const res = await fetch(API_BASE);
  const data = await readApiJson<ListsResponse>(res);
  return data.lists;
}

export async function fetchListDetail(listId: string): Promise<ListDetailResponse> {
  const res = await fetch(`${API_BASE}/${listId}`);
  return readApiJson<ListDetailResponse>(res);
}

export async function createList(dto: CreateListDTO): Promise<List> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return readApiJson<List>(res);
}

export async function updateList(listId: string, dto: UpdateListDTO): Promise<List> {
  const res = await fetch(`${API_BASE}/${listId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return readApiJson<List>(res);
}

export async function deleteList(listId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${listId}`, {
    method: "DELETE",
  });
  await readApiJson<{ deleted: boolean }>(res);
}

// =========================
// List Items API
// =========================

export async function fetchListItems(listId: string): Promise<ListItem[]> {
  const res = await fetch(`${API_BASE}/${listId}/items`);
  const data = await readApiJson<{ items: ListItem[] }>(res);
  return data.items;
}

export async function addListItem(listId: string, dto: AddListItemDTO): Promise<ListItem> {
  const res = await fetch(`${API_BASE}/${listId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return readApiJson<ListItem>(res);
}

export async function updateListItem(
  listId: string,
  itemType: string,
  provider: string,
  externalId: string,
  dto: UpdateListItemDTO
): Promise<ListItem> {
  const res = await fetch(`${API_BASE}/${listId}/items`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      item_type: itemType,
      provider,
      external_id: externalId,
      ...dto,
    }),
  });
  return readApiJson<ListItem>(res);
}

export async function removeListItem(
  listId: string,
  itemType: string,
  provider: string,
  externalId: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/${listId}/items`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      item_type: itemType,
      provider,
      external_id: externalId,
    }),
  });
  await readApiJson<{ deleted: boolean }>(res);
}
