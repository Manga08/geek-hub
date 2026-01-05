"use client";

import { useQuery } from "@tanstack/react-query";

import { groupKeys, fetchCurrentGroup, fetchGroupsList } from "./queries";
import type { CurrentGroupResponse, GroupRow } from "./queries";

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
