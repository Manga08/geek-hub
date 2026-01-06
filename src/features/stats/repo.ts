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

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? "Error al cargar estadísticas");
  }

  return response.json();
}
