"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listKeys,
  fetchLists,
  fetchListDetail,
  createList,
  updateList,
  deleteList,
  fetchListItems,
  addListItem,
  updateListItem,
  removeListItem,
} from "./queries";
import type {
  CreateListDTO,
  UpdateListDTO,
  AddListItemDTO,
  UpdateListItemDTO,
} from "./types";

// =========================
// Lists Hooks
// =========================

export function useLists() {
  return useQuery({
    queryKey: listKeys.all(),
    queryFn: fetchLists,
    staleTime: 1000 * 60 * 5,
  });
}

export function useListDetail(listId: string, enabled = true) {
  return useQuery({
    queryKey: listKeys.detail(listId),
    queryFn: () => fetchListDetail(listId),
    enabled: enabled && !!listId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateListDTO) => createList(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.all() });
    },
  });
}

export function useUpdateList(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateListDTO) => updateList(listId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.all() });
      queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) });
    },
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listId: string) => deleteList(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.all() });
    },
  });
}

// =========================
// List Items Hooks
// =========================

export function useListItems(listId: string, enabled = true) {
  return useQuery({
    queryKey: listKeys.items(listId),
    queryFn: () => fetchListItems(listId),
    enabled: enabled && !!listId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddListItem(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: AddListItemDTO) => addListItem(listId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.items(listId) });
      queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) });
      queryClient.invalidateQueries({ queryKey: listKeys.all() });
    },
  });
}

export function useUpdateListItem(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      itemType: string;
      provider: string;
      externalId: string;
      dto: UpdateListItemDTO;
    }) => updateListItem(listId, params.itemType, params.provider, params.externalId, params.dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.items(listId) });
      queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) });
    },
  });
}

export function useRemoveListItem(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { itemType: string; provider: string; externalId: string }) =>
      removeListItem(listId, params.itemType, params.provider, params.externalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.items(listId) });
      queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) });
      queryClient.invalidateQueries({ queryKey: listKeys.all() });
    },
  });
}
