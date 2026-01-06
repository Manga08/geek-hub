import type { UnifiedItemType } from "@/features/catalog/normalize/unified.types";
import type { EntryStatus } from "@/features/library/types";
import type {
  StatsTotals,
  MonthlyStats,
  TopRatedEntry,
  MemberStats,
  StatsSummary,
  StatsScope,
  StatsType,
  LibraryEntryWithProfile,
} from "./types";

// =========================
// Helper: Initialize Status Counts
// =========================

function initStatusCounts(): Record<EntryStatus, number> {
  return { planned: 0, in_progress: 0, completed: 0, dropped: 0 };
}

// =========================
// Helper: Initialize Type Counts
// =========================

function initTypeCounts(): Record<UnifiedItemType, number> {
  return { movie: 0, tv: 0, anime: 0, game: 0 };
}

// =========================
// Helper: Initialize Monthly Stats
// =========================

function initMonthlyStats(): MonthlyStats[] {
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    completedCount: 0,
    ratedCount: 0,
  }));
}

// =========================
// Aggregate Totals
// =========================

export function aggregateTotals(entries: LibraryEntryWithProfile[]): StatsTotals {
  const byStatus = initStatusCounts();
  const byType = initTypeCounts();
  let favoritesCount = 0;
  let ratedCount = 0;
  let ratingSum = 0;

  for (const entry of entries) {
    // Count by status
    if (entry.status in byStatus) {
      byStatus[entry.status as EntryStatus]++;
    }

    // Count by type
    if (entry.type in byType) {
      byType[entry.type as UnifiedItemType]++;
    }

    // Favorites
    if (entry.is_favorite) {
      favoritesCount++;
    }

    // Ratings
    if (entry.rating !== null) {
      ratedCount++;
      ratingSum += entry.rating;
    }
  }

  return {
    totalEntries: entries.length,
    favoritesCount,
    ratedCount,
    avgRating: ratedCount > 0 ? Math.round((ratingSum / ratedCount) * 10) / 10 : null,
    byStatus,
    byType,
  };
}

// =========================
// Aggregate Monthly Stats
// =========================

export function aggregateMonthly(entries: LibraryEntryWithProfile[]): MonthlyStats[] {
  const monthly = initMonthlyStats();

  for (const entry of entries) {
    const date = new Date(entry.created_at);
    const month = date.getUTCMonth(); // 0-11 (UTC para consistencia con fechas ISO)

    if (entry.status === "completed") {
      monthly[month].completedCount++;
    }

    if (entry.rating !== null) {
      monthly[month].ratedCount++;
    }
  }

  return monthly;
}

// =========================
// Get Top Rated Entries
// =========================

export function getTopRated(entries: LibraryEntryWithProfile[], limit = 5): TopRatedEntry[] {
  return entries
    .filter((e) => e.rating !== null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit)
    .map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      rating: e.rating!,
      poster_url: e.poster_url,
    }));
}

// =========================
// Aggregate Member Stats (for group scope)
// =========================

export function aggregateMemberStats(entries: LibraryEntryWithProfile[]): MemberStats[] {
  const memberMap = new Map<string, {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    entriesCount: number;
    completedCount: number;
    ratingSum: number;
    ratedCount: number;
  }>();

  for (const entry of entries) {
    const existing = memberMap.get(entry.user_id);

    if (existing) {
      existing.entriesCount++;
      if (entry.status === "completed") {
        existing.completedCount++;
      }
      if (entry.rating !== null) {
        existing.ratedCount++;
        existing.ratingSum += entry.rating;
      }
    } else {
      memberMap.set(entry.user_id, {
        user_id: entry.user_id,
        display_name: entry.profiles?.display_name ?? null,
        avatar_url: entry.profiles?.avatar_url ?? null,
        entriesCount: 1,
        completedCount: entry.status === "completed" ? 1 : 0,
        ratedCount: entry.rating !== null ? 1 : 0,
        ratingSum: entry.rating ?? 0,
      });
    }
  }

  // Convert to array and calculate avgRating
  const members: MemberStats[] = Array.from(memberMap.values()).map((m) => ({
    user_id: m.user_id,
    display_name: m.display_name,
    avatar_url: m.avatar_url,
    entriesCount: m.entriesCount,
    completedCount: m.completedCount,
    avgRating: m.ratedCount > 0 ? Math.round((m.ratingSum / m.ratedCount) * 10) / 10 : null,
  }));

  // Sort by completedCount desc, then avgRating desc
  return members.sort((a, b) => {
    if (b.completedCount !== a.completedCount) {
      return b.completedCount - a.completedCount;
    }
    // For avgRating, treat null as -1 for sorting
    const aRating = a.avgRating ?? -1;
    const bRating = b.avgRating ?? -1;
    return bRating - aRating;
  });
}

// =========================
// Full Aggregation
// =========================

export function aggregateStatsSummary(
  entries: LibraryEntryWithProfile[],
  scope: StatsScope,
  year: number,
  type: StatsType
): StatsSummary {
  return {
    scope,
    year,
    type,
    totals: aggregateTotals(entries),
    monthly: aggregateMonthly(entries),
    topRated: getTopRated(entries, 5),
    members: scope === "group" ? aggregateMemberStats(entries) : [],
  };
}
