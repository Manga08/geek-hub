"use client";

import { useEffect, useState } from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentGroup } from "@/features/groups/hooks";
import { activityKeys, fetchActivityFeed, fetchUnreadCount, markActivityRead } from "./queries";
import { subscribeToActivity } from "@/lib/realtime";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
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
      // Pass groupId to avoid profiles query on server
      return fetchActivityFeed(
        {
          limit,
          before: pageParam ?? undefined,
          entityType,
        },
        groupId ?? undefined
      );
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.nextCursor;
    },
    enabled: enabled && !!groupId,
    // Realtime invalidates queries - see useActivityRealtime
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

// =========================
// Unread Count Hook
// =========================

export function useUnreadActivityCount() {
  const { data: currentGroup } = useCurrentGroup();
  const groupId = currentGroup?.group?.id ?? null;

  return useQuery({
    queryKey: activityKeys.unread(groupId),
    queryFn: () => fetchUnreadCount(groupId ?? undefined),
    enabled: !!groupId,
    staleTime: 30 * 1000, // 30s - avoid excessive refetches
    refetchOnWindowFocus: false, // Realtime handles updates
  });
}

// =========================
// Mark Read Mutation
// =========================

export function useMarkActivityRead() {
  const queryClient = useQueryClient();
  const { data: currentGroup } = useCurrentGroup();
  const groupId = currentGroup?.group?.id ?? null;

  return useMutation({
    mutationFn: () => markActivityRead(groupId ?? undefined),
    onSuccess: () => {
      // Invalidate unread count after marking as read
      queryClient.invalidateQueries({
        queryKey: activityKeys.unread(groupId),
      });
    },
  });
}

// =========================
// Activity Realtime Hook
// =========================

/**
 * Subscribe to realtime activity events for the current group.
 * Automatically invalidates unread count and feed when new events arrive.
 * Ignores events from the current user (optional).
 */
export function useActivityRealtime(options: { ignoreOwnEvents?: boolean } = {}) {
  const { ignoreOwnEvents = true } = options;
  const queryClient = useQueryClient();
  const { data: currentGroup } = useCurrentGroup();
  const groupId = currentGroup?.group?.id ?? null;

  // Get current user ID using getSession (cached, no roundtrip)
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    // Use getSession instead of getUser - it's cached locally
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!groupId) return;

    const unsubscribe = subscribeToActivity(groupId, (event) => {
      // Optionally ignore own events
      if (ignoreOwnEvents && event.actor_id === userId) {
        return;
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: activityKeys.unread(groupId),
      });
      queryClient.invalidateQueries({
        queryKey: activityKeys.feed(groupId),
      });
    });

    return unsubscribe;
  }, [groupId, userId, ignoreOwnEvents, queryClient]);
}
