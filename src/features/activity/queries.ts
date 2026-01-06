import type { ActivityFeedResponse, ActivityFilters } from "./types";

// =========================
// Query Keys
// =========================

export const activityKeys = {
  all: ["activity"] as const,
  feed: (groupId: string | null) => [...activityKeys.all, "feed", groupId] as const,
  feedFiltered: (groupId: string | null, filters: ActivityFilters) =>
    [...activityKeys.feed(groupId), filters] as const,
  unread: (groupId: string | null) => [...activityKeys.all, "unread", groupId] as const,
} as const;

// =========================
// Fetch Functions
// =========================

export async function fetchActivityFeed(
  filters: ActivityFilters = {},
  groupId?: string
): Promise<ActivityFeedResponse> {
  const params = new URLSearchParams();

  // Pass group_id to avoid profiles query on server
  if (groupId) {
    params.set("group_id", groupId);
  }
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
    throw new Error(error.message ?? "Error al cargar la actividad");
  }

  const json = await response.json();
  // API returns { ok: true, data: { events, hasMore, nextCursor } }
  return json.data ?? json;
}

// =========================
// Unread Count
// =========================

export interface UnreadCountResponse {
  count: number;
}

export async function fetchUnreadCount(groupId?: string): Promise<UnreadCountResponse> {
  const params = new URLSearchParams();
  if (groupId) {
    params.set("group_id", groupId);
  }

  const url = `/api/activity/unread${params.toString() ? `?${params}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? "Error al cargar notificaciones");
  }

  const json = await response.json();
  // API returns { ok: true, data: { count } }
  return json.data ?? json;
}

export async function markActivityRead(groupId?: string): Promise<void> {
  const response = await fetch("/api/activity/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(groupId ? { group_id: groupId } : {}),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? "Error al marcar como leído");
  }
}
