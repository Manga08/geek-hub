"use client";

import { useState, useCallback } from "react";
import { Heart, Plus, Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLibraryEntry } from "../hooks/useLibraryEntry";
import { EntryDialog } from "./EntryDialog";
import type {
  UnifiedItemType,
  Provider,
} from "@/features/catalog/normalize/unified.types";
import type { LibraryEntryLookup } from "../queries";

interface EntryQuickActionsProps {
  itemType: UnifiedItemType;
  provider: Provider;
  externalId: string;
  title: string;
  posterUrl?: string | null;
  className?: string;
  /**
   * Pre-fetched entry from batch lookup.
   * If defined (including null for "not in library"), skips individual fetch.
   * If undefined, falls back to useLibraryEntry individual fetch.
   */
  prefetchedEntry?: LibraryEntryLookup | null;
  /** Loading state from batch lookup (only used when prefetchedEntry is provided) */
  prefetchedLoading?: boolean;
}

export function EntryQuickActions({
  itemType,
  provider,
  externalId,
  title,
  posterUrl,
  className,
  prefetchedEntry,
  prefetchedLoading = false,
}: EntryQuickActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Only fetch individually if prefetchedEntry is undefined (not provided at all)
  const usePrefetched = prefetchedEntry !== undefined;

  const {
    isInLibrary: hookIsInLibrary,
    isFavorite: hookIsFavorite,
    add,
    isAdding,
    toggleFavorite,
    isTogglingFavorite,
    isLoading: hookIsLoading,
  } = useLibraryEntry({
    type: itemType,
    provider,
    externalId,
    title,
    posterUrl,
    // Disable individual fetch when using prefetched data
    enabled: !usePrefetched,
  });

  // Derive state from prefetched or hook
  const isInLibrary = usePrefetched
    ? prefetchedEntry !== null
    : hookIsInLibrary;
  
  const isFavorite = usePrefetched
    ? prefetchedEntry?.is_favorite ?? false
    : hookIsFavorite;
  
  const isLoading = usePrefetched ? prefetchedLoading : hookIsLoading;

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isInLibrary) {
        toggleFavorite();
      } else {
        // Add to library with favorite flag
        add({ is_favorite: true });
      }
    },
    [add, isInLibrary, toggleFavorite]
  );

  const handleAddClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDialogOpen(true);
    },
    []
  );

  return (
    <>
      <div className={className}>
        {/* Favorite button */}
        <Button
          variant="ghost"
          size="icon-sm"
          className={`h-7 w-7 rounded-full border backdrop-blur-sm transition-all ${
            isFavorite
              ? "border-red-500/40 bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : "border-white/20 bg-black/50 text-white/80 hover:bg-black/70 hover:text-white"
          }`}
          onClick={handleFavoriteClick}
          disabled={isTogglingFavorite || isAdding || isLoading}
        >
          {isTogglingFavorite || (isAdding && !dialogOpen) || isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Heart
              className={`h-3.5 w-3.5 ${isFavorite ? "fill-red-400" : ""}`}
            />
          )}
        </Button>

        {/* Add/Edit button */}
        <Button
          variant="ghost"
          size="icon-sm"
          className={`h-7 w-7 rounded-full border backdrop-blur-sm transition-all ${
            isInLibrary
              ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              : "border-white/20 bg-black/50 text-white/80 hover:bg-black/70 hover:text-white"
          }`}
          onClick={handleAddClick}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isInLibrary ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      <EntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        itemType={itemType}
        provider={provider}
        externalId={externalId}
        title={title}
        posterUrl={posterUrl}
      />
    </>
  );
}
