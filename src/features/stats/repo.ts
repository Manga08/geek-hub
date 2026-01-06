import { readApiJson } from "@/lib/api-client";
import type { StatsSummary, StatsFilters } from "./types";

// =========================
// Fetch Stats Summary
// =========================

export async function fetchStatsSummary(filters: StatsFilters): Promise<StatsSummary> {
  const params = new URLSearchParams({
    scope: filters.scope,
    year: String(filters.year),
    type: filters.type,
  });

  const response = await fetch(`/api/stats/summary?${params}`);
  return readApiJson<StatsSummary>(response);
}
