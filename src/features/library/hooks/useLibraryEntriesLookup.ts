"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  libraryKeys,
  fetchEntriesLookup,
  type LookupItem,
  type LibraryEntryLookup,
} from "../queries";

/**
 * Helper to build a unique key for an item
 */
export function buildLookupKey(type: string, provider: string, externalId: string): string {
  return `${type}:${provider}:${externalId}`;
}

export type LibraryEntriesMap = Map<string, LibraryEntryLookup>;

interface UseLibraryEntriesLookupOptions {
  /** Whether the query is enabled (default: true if items.length > 0) */
  enabled?: boolean;
}

/**
 * Batch lookup hook for library entries.
 * Returns a Map keyed by `${type}:${provider}:${external_id}` -> entry or undefined.
 * 
 * @param items Array of items to lookup (will be capped at 50)
 * @param opts Options including enabled flag
 */
export function useLibraryEntriesLookup(
  items: LookupItem[],
  opts?: UseLibraryEntriesLookupOptions
) {
  // Dedupe and limit to 50 items
  const dedupedItems = useMemo(() => {
    const seen = new Set<string>();
    const result: LookupItem[] = [];
    for (const item of items) {
      const key = buildLookupKey(item.type, item.provider, item.external_id);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
        if (result.length >= 50) break;
      }
    }
    return result;
  }, [items]);

  const hasItems = dedupedItems.length > 0;
  const enabled = opts?.enabled !== false && hasItems;

  const query = useQuery({
    queryKey: libraryKeys.lookup(dedupedItems),
    queryFn: () => fetchEntriesLookup(dedupedItems),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Build the lookup map from results
  const entriesMap = useMemo<LibraryEntriesMap>(() => {
    const map = new Map<string, LibraryEntryLookup>();
    if (query.data) {
      for (const entry of query.data) {
        const key = buildLookupKey(entry.type, entry.provider, entry.external_id);
        map.set(key, entry);
      }
    }
    return map;
  }, [query.data]);

  return {
    /** Map of key -> entry (only found entries are in the map) */
    entriesMap,
    /** Check if an item is in library */
    isInLibrary: (type: string, provider: string, externalId: string) =>
      entriesMap.has(buildLookupKey(type, provider, externalId)),
    /** Get entry for an item (returns undefined if not in library) */
    getEntry: (type: string, provider: string, externalId: string) =>
      entriesMap.get(buildLookupKey(type, provider, externalId)),
    /** Loading state */
    isLoading: query.isLoading,
    /** Whether data has been fetched at least once */
    isFetched: query.isFetched,
    /** Error if any */
    error: query.error,
    /** Refetch */
    refetch: query.refetch,
  };
}
