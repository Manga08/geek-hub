import type { UnifiedItemType } from "@/features/catalog/normalize/unified.types";
import type { EntryStatus, LibraryEntry } from "@/features/library/types";

// =========================
// Stats Scope & Filters
// =========================

export type StatsScope = "mine" | "group";
export type StatsType = "all" | UnifiedItemType;

export interface StatsFilters {
  scope: StatsScope;
  year: number;
  type: StatsType;
}

// =========================
// Stats Summary Response
// =========================

export interface StatsTotals {
  totalEntries: number;
  favoritesCount: number;
  ratedCount: number;
  avgRating: number | null;
  byStatus: Record<EntryStatus, number>;
  byType: Record<UnifiedItemType, number>;
}

export interface MonthlyStats {
  month: number; // 1-12
  completedCount: number;
  ratedCount: number;
}

export interface TopRatedEntry {
  id: string;
  title: string | null;
  type: UnifiedItemType;
  rating: number;
  poster_url: string | null;
}

export interface MemberStats {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  entriesCount: number;
  completedCount: number;
  avgRating: number | null;
}

export interface StatsSummary {
  scope: StatsScope;
  year: number;
  type: StatsType;
  totals: StatsTotals;
  monthly: MonthlyStats[];
  topRated: TopRatedEntry[];
  members: MemberStats[]; // Only populated when scope=group
}

// =========================
// Internal Types for Aggregation
// =========================

export interface LibraryEntryWithProfile extends LibraryEntry {
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}
