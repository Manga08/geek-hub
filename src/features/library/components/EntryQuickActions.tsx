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

interface EntryQuickActionsProps {
  itemType: UnifiedItemType;
  provider: Provider;
  externalId: string;
  title: string;
  posterUrl?: string | null;
  className?: string;
}

export function EntryQuickActions({
  itemType,
  provider,
  externalId,
  title,
  posterUrl,
  className,
}: EntryQuickActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    isInLibrary,
    isFavorite,
    add,
    isAdding,
    toggleFavorite,
    isTogglingFavorite,
  } = useLibraryEntry({
    type: itemType,
    provider,
    externalId,
    title,
    posterUrl,
    enabled: true,
  });

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
          disabled={isTogglingFavorite || isAdding}
        >
          {isTogglingFavorite || (isAdding && !dialogOpen) ? (
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
        >
          {isInLibrary ? (
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
