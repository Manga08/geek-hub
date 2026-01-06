"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Loader2, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  libraryKeys,
  fetchEntryByItem,
  createEntry,
  updateEntry,
  deleteEntry,
} from "@/features/library/queries";
import {
  type EntryStatus,
  STATUS_LABELS,
} from "@/features/library/types";
import type {
  UnifiedItemType,
  Provider,
} from "@/features/catalog/normalize/unified.types";

interface EntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: UnifiedItemType;
  provider: Provider;
  externalId: string;
  title: string;
  posterUrl?: string | null;
}

const STATUSES: EntryStatus[] = ["planned", "in_progress", "completed", "dropped"];

export function EntryDialog({
  open,
  onOpenChange,
  itemType,
  provider,
  externalId,
  title,
  posterUrl,
}: EntryDialogProps) {
  const queryClient = useQueryClient();

  // Fetch existing entry
  const { data: existingEntry, isLoading } = useQuery({
    queryKey: libraryKeys.byItem(itemType, provider, externalId),
    queryFn: () => fetchEntryByItem(itemType, provider, externalId),
    enabled: open,
    staleTime: 1000 * 60 * 5,
  });

  const isEditMode = !!existingEntry;

  // Local form state
  const [status, setStatus] = useState<EntryStatus>("planned");
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  // Track previous entry ID to sync form only when entry changes
  const prevEntryIdRef = useRef<string | null>(null);
  const currentEntryId = existingEntry?.id ?? null;

  // Sync form with existing entry (only when entry ID changes)
  if (currentEntryId !== prevEntryIdRef.current) {
    prevEntryIdRef.current = currentEntryId;
    if (existingEntry) {
      setStatus(existingEntry.status);
      setRating(existingEntry.rating);
      setNotes(existingEntry.notes ?? "");
      setIsFavorite(existingEntry.is_favorite);
    } else if (open) {
      setStatus("planned");
      setRating(null);
      setNotes("");
      setIsFavorite(false);
    }
  }

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: libraryKeys.byItem(itemType, provider, externalId),
    });
    queryClient.invalidateQueries({ queryKey: libraryKeys.all });
  }, [externalId, itemType, provider, queryClient]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createEntry,
    onSuccess: () => {
      invalidateQueries();
      onOpenChange(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Parameters<typeof updateEntry>[1] }) =>
      updateEntry(id, dto),
    onSuccess: () => {
      invalidateQueries();
      onOpenChange(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteEntry,
    onSuccess: () => {
      invalidateQueries();
      onOpenChange(false);
    },
  });

  const handleSubmit = useCallback(() => {
    if (isEditMode && existingEntry) {
      // UPDATE: nulls allowed for clearing values
      updateMutation.mutate({
        id: existingEntry.id,
        dto: { status, rating, notes: notes || null, is_favorite: isFavorite },
      });
    } else {
      // CREATE: build payload without nulls (optional fields only when set)
      const createPayload: Parameters<typeof createEntry>[0] = {
        type: itemType,
        provider,
        external_id: externalId,
        status,
        is_favorite: isFavorite,
      };
      if (title) createPayload.title = title;
      if (posterUrl) createPayload.poster_url = posterUrl;
      if (rating != null) createPayload.rating = rating;
      const trimmedNotes = notes.trim();
      if (trimmedNotes) createPayload.notes = trimmedNotes;

      createMutation.mutate(createPayload);
    }
  }, [
    createMutation,
    existingEntry,
    externalId,
    isFavorite,
    isEditMode,
    itemType,
    notes,
    posterUrl,
    provider,
    rating,
    status,
    title,
    updateMutation,
  ]);

  const handleDelete = useCallback(() => {
    if (existingEntry) {
      deleteMutation.mutate(existingEntry.id);
    }
  }, [deleteMutation, existingEntry]);

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {isEditMode ? "Editar entrada" : "Agregar a biblioteca"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground line-clamp-1">
            {title}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as EntryStatus)}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rating 1-10 */}
            <div className="space-y-2">
              <Label>Puntuación (1-10)</Label>
              <div className="flex flex-wrap items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRating(rating === num ? null : num)}
                    className={`h-8 w-8 rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      rating === num
                        ? "bg-amber-500 text-black"
                        : rating && num <= rating
                          ? "bg-amber-500/30 text-amber-400"
                          : "bg-white/5 text-muted-foreground hover:bg-white/10"
                    }`}
                  >
                    {num}
                  </button>
                ))}
                {rating && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    {rating}/10
                  </span>
                )}
              </div>
            </div>

            {/* Favorite */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  isFavorite
                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                <Heart
                  className={`h-4 w-4 ${isFavorite ? "fill-red-400" : ""}`}
                />
                {isFavorite ? "Favorito" : "Marcar como favorito"}
              </button>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Escribe tus notas aquí..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-20 resize-none border-white/10 bg-white/5"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-row items-center gap-2 sm:justify-between">
          {isEditMode && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
              className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Eliminar
            </Button>
          )}
          <div className="flex flex-1 justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isPending || isLoading}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Guardar" : "Agregar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
