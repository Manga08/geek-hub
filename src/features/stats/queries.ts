"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStatsSummary } from "./repo";
import type { StatsFilters, StatsSummary } from "./types";

// =========================
// Query Keys
// =========================

export const statsKeys = {
  all: ["stats"] as const,
  summary: (filters: StatsFilters) =>
    [...statsKeys.all, "summary", filters.scope, filters.year, filters.type] as const,
} as const;

// =========================
// Stats Summary Hook
// =========================

export function useStatsSummary(filters: StatsFilters) {
  return useQuery<StatsSummary, Error>({
    queryKey: statsKeys.summary(filters),
    queryFn: () => fetchStatsSummary(filters),
    staleTime: 60 * 1000, // 1 minute
  });
}
