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

  if (!res.ok) {
    throw new Error("Error fetching lists");
  }

  const data: ListsResponse = await res.json();
  return data.lists;
}

export async function fetchListDetail(listId: string): Promise<ListDetailResponse> {
  const res = await fetch(`${API_BASE}/${listId}`);

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("List not found");
    }
    throw new Error("Error fetching list");
  }

  return res.json();
}

export async function createList(dto: CreateListDTO): Promise<List> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error creating list" }));
    throw new Error(error.message || "Error creating list");
  }

  return res.json();
}

export async function updateList(listId: string, dto: UpdateListDTO): Promise<List> {
  const res = await fetch(`${API_BASE}/${listId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error updating list" }));
    throw new Error(error.message || "Error updating list");
  }

  return res.json();
}

export async function deleteList(listId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${listId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error deleting list" }));
    throw new Error(error.message || "Error deleting list");
  }
}

// =========================
// List Items API
// =========================

export async function fetchListItems(listId: string): Promise<ListItem[]> {
  const res = await fetch(`${API_BASE}/${listId}/items`);

  if (!res.ok) {
    throw new Error("Error fetching list items");
  }

  const data = await res.json();
  return data.items;
}

export async function addListItem(listId: string, dto: AddListItemDTO): Promise<ListItem> {
  const res = await fetch(`${API_BASE}/${listId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error adding item" }));
    throw new Error(error.message || "Error adding item");
  }

  return res.json();
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

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error updating item" }));
    throw new Error(error.message || "Error updating item");
  }

  return res.json();
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

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error removing item" }));
    throw new Error(error.message || "Error removing item");
  }
}
