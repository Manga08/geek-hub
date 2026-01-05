"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  groupKeys,
  fetchCurrentGroup,
  fetchGroupsList,
  setCurrentGroup,
  fetchGroupMembers,
  createInvite,
  redeemInvite,
} from "./queries";
import type {
  CurrentGroupResponse,
  GroupRow,
  GroupMemberWithProfile,
  CreateInviteParams,
  CreateInviteResponse,
  RedeemInviteResponse,
} from "./types";

export function useCurrentGroup() {
  return useQuery<CurrentGroupResponse | null>({
    queryKey: groupKeys.current(),
    queryFn: fetchCurrentGroup,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useGroupsList() {
  return useQuery<GroupRow[]>({
    queryKey: groupKeys.list(),
    queryFn: fetchGroupsList,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useSetCurrentGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setCurrentGroup,
    onSuccess: (data) => {
      // Update current group cache immediately
      queryClient.setQueryData(groupKeys.current(), data);
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: groupKeys.current() });
      queryClient.invalidateQueries({ queryKey: groupKeys.list() });
      // Invalidate library queries since they may depend on group context
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useGroupMembers(groupId: string | undefined) {
  return useQuery<GroupMemberWithProfile[]>({
    queryKey: groupKeys.members(groupId ?? ""),
    queryFn: () => fetchGroupMembers(groupId!),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCreateInvite() {
  return useMutation<CreateInviteResponse, Error, CreateInviteParams>({
    mutationFn: createInvite,
  });
}

export function useRedeemInvite() {
  const queryClient = useQueryClient();

  return useMutation<RedeemInviteResponse, Error, string>({
    mutationFn: redeemInvite,
    onSuccess: () => {
      // Invalidate all group queries after joining
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}
