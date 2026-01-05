import type { UnifiedItemType, Provider } from "@/features/catalog/normalize/unified.types";

export type EntryStatus = "planned" | "in_progress" | "completed" | "dropped";

export interface LibraryEntry {
  id: string;
  user_id: string;
  group_id: string;
  type: UnifiedItemType;
  provider: Provider;
  external_id: string;
  title: string | null;
  poster_url: string | null;
  status: EntryStatus;
  rating: number | null;
  notes: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEntryDTO {
  type: UnifiedItemType;
  provider: Provider;
  external_id: string;
  group_id?: string; // Optional - will use default group if not provided
  title?: string | null;
  poster_url?: string | null;
  status?: EntryStatus;
  rating?: number | null;
  notes?: string | null;
  is_favorite?: boolean;
}

export interface UpdateEntryDTO {
  status?: EntryStatus;
  rating?: number | null;
  notes?: string | null;
  is_favorite?: boolean;
}

export const STATUS_LABELS: Record<EntryStatus, string> = {
  planned: "Planeado",
  in_progress: "En progreso",
  completed: "Completado",
  dropped: "Abandonado",
};

export const STATUS_COLORS: Record<EntryStatus, string> = {
  planned: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  dropped: "bg-red-500/20 text-red-400 border-red-500/30",
};
