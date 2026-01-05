import type { ActivityFeedResponse, ActivityFilters } from "./types";

// =========================
// Query Keys
// =========================

export const activityKeys = {
  all: ["activity"] as const,
  feed: (groupId: string | null) => [...activityKeys.all, "feed", groupId] as const,
  feedFiltered: (groupId: string | null, filters: ActivityFilters) =>
    [...activityKeys.feed(groupId), filters] as const,
} as const;

// =========================
// Fetch Functions
// =========================

export async function fetchActivityFeed(
  filters: ActivityFilters = {}
): Promise<ActivityFeedResponse> {
  const params = new URLSearchParams();

  if (filters.limit) {
    params.set("limit", String(filters.limit));
  }
  if (filters.before) {
    params.set("before", filters.before);
  }
  if (filters.entityType) {
    params.set("entity_type", filters.entityType);
  }

  const url = `/api/activity${params.toString() ? `?${params}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? "Error al cargar la actividad");
  }

  return response.json();
}
