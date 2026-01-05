"use client";

import { useState } from "react";
import { List, Plus, Check, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useLists, listKeys } from "@/features/lists";
import { addListItem } from "@/features/lists/queries";
import type { UnifiedItemType, Provider } from "@/features/catalog/normalize/unified.types";

interface AddToListButtonProps {
  itemType: UnifiedItemType;
  provider: Provider;
  externalId: string;
  title: string | null;
  posterUrl: string | null;
}

export function AddToListButton({
  itemType,
  provider,
  externalId,
  title,
  posterUrl,
}: AddToListButtonProps) {
  const queryClient = useQueryClient();
  const { data: lists, isLoading: listsLoading } = useLists();
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  const addMutation = useMutation({
    mutationFn: (listId: string) =>
      addListItem(listId, {
        item_type: itemType,
        provider,
        external_id: externalId,
        title,
        poster_url: posterUrl,
      }),
    onSuccess: (_, listId) => {
      setAddedTo((prev) => new Set([...prev, listId]));
      queryClient.invalidateQueries({ queryKey: listKeys.all() });
      queryClient.invalidateQueries({ queryKey: listKeys.items(listId) });
    },
  });

  if (listsLoading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Cargando...
      </Button>
    );
  }

  if (!lists || lists.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <List className="mr-2 h-4 w-4" />
          Agregar a lista
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Selecciona una lista</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {lists.map((list) => {
          const isAdding = addMutation.isPending && addMutation.variables === list.id;
          const isAdded = addedTo.has(list.id);

          return (
            <DropdownMenuItem
              key={list.id}
              disabled={isAdding || isAdded}
              onClick={() => addMutation.mutate(list.id)}
              className="cursor-pointer"
            >
              {isAdding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isAdded ? (
                <Check className="mr-2 h-4 w-4 text-green-500" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              <span className="truncate">{list.name}</span>
              {isAdded && (
                <span className="ml-auto text-xs text-muted-foreground">Agregado</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
