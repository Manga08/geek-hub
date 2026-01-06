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
  setMemberRole,
  removeMember,
  leaveGroup,
  fetchGroupInvites,
  revokeInvite,
  updateGroupName,
} from "./queries";
import type {
  CurrentGroupResponse,
  GroupRow,
  GroupMemberWithProfile,
  CreateInviteParams,
  CreateInviteResponse,
  RedeemInviteResponse,
  SetMemberRoleParams,
  RemoveMemberParams,
  LeaveGroupParams,
  LeaveGroupResponse,
  RevokeInviteParams,
  UpdateGroupNameParams,
  RpcResult,
  GroupInviteRow,
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
      // Invalidate library, lists, and activity queries since they depend on group context
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
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

// ================================
// Phase 3Q: Membership Management Hooks
// ================================

export function useSetMemberRole() {
  const queryClient = useQueryClient();

  return useMutation<RpcResult, Error, SetMemberRoleParams>({
    mutationFn: setMemberRole,
    onSuccess: (_, variables) => {
      // Invalidate members list for this group
      queryClient.invalidateQueries({ queryKey: groupKeys.members(variables.groupId) });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation<RpcResult, Error, RemoveMemberParams>({
    mutationFn: removeMember,
    onSuccess: (_, variables) => {
      // Invalidate members list for this group
      queryClient.invalidateQueries({ queryKey: groupKeys.members(variables.groupId) });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation<LeaveGroupResponse, Error, LeaveGroupParams>({
    mutationFn: leaveGroup,
    onSuccess: () => {
      // Invalidate all group queries
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      // Also invalidate library since context may have changed
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useGroupInvites(groupId: string | undefined) {
  return useQuery<GroupInviteRow[]>({
    queryKey: groupKeys.invites(groupId ?? ""),
    queryFn: () => fetchGroupInvites(groupId!),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();

  return useMutation<RpcResult, Error, RevokeInviteParams & { groupId: string }>({
    mutationFn: revokeInvite,
    onSuccess: (_, variables) => {
      // Invalidate invites list for this group
      queryClient.invalidateQueries({ queryKey: groupKeys.invites(variables.groupId) });
    },
  });
}

// ================================
// Phase 4B: Update Group Name
// ================================

export function useUpdateGroupName() {
  const queryClient = useQueryClient();

  return useMutation<GroupRow, Error, UpdateGroupNameParams>({
    mutationFn: updateGroupName,
    onSuccess: (_, variables) => {
      // Invalidate current group and list to reflect new name
      queryClient.invalidateQueries({ queryKey: groupKeys.current() });
      queryClient.invalidateQueries({ queryKey: groupKeys.list() });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.groupId) });
    },
  });
}
