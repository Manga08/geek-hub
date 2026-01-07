import type { UnifiedItemType, Provider } from "@/features/catalog/normalize/unified.types";

// =========================
// List types
// =========================

export interface List {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ListWithItemCount extends List {
  item_count: number;
}

export interface CreateListDTO {
  name: string;
  description?: string | null;
  group_id?: string; // Optional - uses default group if not provided
}

export interface UpdateListDTO {
  name?: string;
  description?: string | null;
}

// =========================
// List Item types
// =========================

export interface ListItem {
  list_id: string;
  item_id: string;
  item_type: UnifiedItemType;
  provider: Provider;
  external_id: string;
  added_by: string;
  title: string | null;
  poster_url: string | null;
  note: string | null;
  position: number;
  created_at: string;
}

export interface AddListItemDTO {
  item_type: UnifiedItemType;
  provider: Provider;
  external_id: string;
  title?: string | null;
  poster_url?: string | null;
  note?: string | null;
}

export interface UpdateListItemDTO {
  note?: string | null;
  position?: number;
}

export interface ReorderListItemsDTO {
  items: Array<{
    item_id: string;
    position: number;
  }>;
}

// =========================
// API Response types
// =========================

export interface ListsResponse {
  lists: ListWithItemCount[];
}

export interface ListDetailResponse {
  list: List;
  items: ListItem[];
}
