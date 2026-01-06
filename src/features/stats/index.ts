// =========================
// Stats Feature Exports
// =========================

// Types
export type {
  StatsScope,
  StatsType,
  StatsFilters,
  StatsTotals,
  MonthlyStats,
  TopRatedEntry,
  MemberStats,
  StatsSummary,
  LibraryEntryWithProfile,
} from "./types";

// Aggregation helpers
export {
  aggregateTotals,
  aggregateMonthly,
  getTopRated,
  aggregateMemberStats,
  aggregateStatsSummary,
} from "./aggregate";

// Repository
export { fetchStatsSummary } from "./repo";

// Queries & Hooks
export { statsKeys, useStatsSummary } from "./queries";
