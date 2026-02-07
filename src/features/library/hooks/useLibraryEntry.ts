"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  libraryKeys,
  fetchEntryByItem,
  createEntry,
  updateEntry,
  toggleFavorite,
} from "../queries";
import type { LibraryEntry, CreateEntryDTO, UpdateEntryDTO } from "../types";
import type { UnifiedItemType, Provider } from "@/features/catalog/normalize/unified.types";

interface UseLibraryEntryOptions {
  type: UnifiedItemType;
  provider: Provider;
  externalId: string;
  title?: string;
  posterUrl?: string | null;
  enabled?: boolean;
}

export function useLibraryEntry({
  type,
  provider,
  externalId,
  title,
  posterUrl,
  enabled = true,
}: UseLibraryEntryOptions) {
  const queryClient = useQueryClient();
  const queryKey = libraryKeys.byItem(type, provider, externalId);

  const { data: entry, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fetchEntryByItem(type, provider, externalId),
    enabled,
    staleTime: 1000 * 60 * 5,
  });

  const invalidate = () => {
    // Only invalidate list/lookup queries (not byItem — already updated by optimistic/settled)
    // libraryKeys.all is ["library"] which is a prefix that matches byItem too,
    // causing duplicate refetches. Instead, invalidate only list & lookup keys.
    queryClient.invalidateQueries({ queryKey: libraryKeys.list() });
    queryClient.invalidateQueries({ queryKey: [...libraryKeys.all, "lookup"] });
    // Refetch the specific entry once (not via prefix match)
    queryClient.invalidateQueries({ queryKey, exact: true });
  };

  // Quick add with default status
  const addMutation = useMutation({
    mutationFn: (dto?: Partial<CreateEntryDTO>) => {
      // Build payload without nulls (only set optional fields if they have values)
      const payload: Parameters<typeof createEntry>[0] = {
        type,
        provider,
        external_id: externalId,
        status: "planned",
        ...dto,
      };
      if (title) payload.title = title;
      if (posterUrl) payload.poster_url = posterUrl;
      return createEntry(payload);
    },
    onMutate: async (dto) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<LibraryEntry | null>(queryKey);

      // Optimistic update
      queryClient.setQueryData<LibraryEntry | null>(queryKey, {
        id: "optimistic",
        user_id: "optimistic",
        group_id: "optimistic",
        type,
        provider,
        external_id: externalId,
        title: title ?? null,
        poster_url: posterUrl ?? null,
        status: dto?.status ?? "planned",
        rating: dto?.rating ?? null,
        notes: dto?.notes ?? null,
        is_favorite: dto?.is_favorite ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: invalidate,
  });

  // Toggle favorite (works on existing entries)
  const toggleFavoriteMutation = useMutation({
    mutationFn: () => {
      if (!entry) throw new Error("No entry to toggle");
      return toggleFavorite(entry.id);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<LibraryEntry | null>(queryKey);

      if (previous) {
        queryClient.setQueryData<LibraryEntry | null>(queryKey, {
          ...previous,
          is_favorite: !previous.is_favorite,
        });
      }

      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: invalidate,
  });

  // Update entry
  const updateMutation = useMutation({
    mutationFn: (dto: UpdateEntryDTO) => {
      if (!entry) throw new Error("No entry to update");
      return updateEntry(entry.id, dto);
    },
    onMutate: async (dto) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<LibraryEntry | null>(queryKey);

      if (previous) {
        queryClient.setQueryData<LibraryEntry | null>(queryKey, {
          ...previous,
          ...dto,
          updated_at: new Date().toISOString(),
        });
      }

      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: invalidate,
  });

  return {
    entry,
    isLoading,
    error,
    isInLibrary: !!entry,
    isFavorite: entry?.is_favorite ?? false,
    add: addMutation.mutate,
    isAdding: addMutation.isPending,
    toggleFavorite: toggleFavoriteMutation.mutate,
    isTogglingFavorite: toggleFavoriteMutation.isPending,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
