"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useCurrentGroup } from "@/features/groups/hooks";
import { activityKeys, fetchActivityFeed } from "./queries";
import type { ActivityFilters, ActivityFeedResponse, ActivityEvent } from "./types";

// =========================
// Activity Feed Hook
// =========================

export interface UseActivityFeedOptions {
  limit?: number;
  entityType?: ActivityFilters["entityType"];
  enabled?: boolean;
}

export function useActivityFeed(options: UseActivityFeedOptions = {}) {
  const { limit = 20, entityType, enabled = true } = options;
  const { data: currentGroup } = useCurrentGroup();
  const groupId = currentGroup?.group?.id ?? null;

  return useInfiniteQuery<ActivityFeedResponse, Error, { pages: ActivityFeedResponse[] }, ReturnType<typeof activityKeys.feed>, string | null>({
    queryKey: activityKeys.feed(groupId),
    queryFn: async ({ pageParam }) => {
      return fetchActivityFeed({
        limit,
        before: pageParam ?? undefined,
        entityType,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.nextCursor;
    },
    enabled: enabled && !!groupId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

/**
 * Flatten paginated activity events into a single array
 */
export function flattenActivityEvents(
  pages: ActivityFeedResponse[] | undefined
): ActivityEvent[] {
  if (!pages) return [];
  return pages.flatMap((page) => page.events);
}
