"use client";

import { useQuery } from "@tanstack/react-query";
import { appInitKeys, fetchAppInit } from "./queries";
import type { AppInitResponse } from "./types";

// =========================
// App Init Hook
// =========================

export function useAppInit() {
  return useQuery<AppInitResponse, Error>({
    queryKey: appInitKeys.root,
    queryFn: () => fetchAppInit(),
    staleTime: Infinity, // Only fetch once per session
    gcTime: Infinity,
  });
}
