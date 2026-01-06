import { describe, it, expect } from "vitest";
import {
  aggregateTotals,
  aggregateMonthly,
  getTopRated,
  aggregateMemberStats,
  aggregateStatsSummary,
} from "@/features/stats/aggregate";
import type { LibraryEntryWithProfile } from "@/features/stats/types";

/* =========================
   Mock data helpers
   ========================= */

const makeEntry = (
  overrides: Partial<LibraryEntryWithProfile> = {}
): LibraryEntryWithProfile => ({
  id: crypto.randomUUID(),
  user_id: "user-1",
  group_id: "group-1",
  type: "movie",
  provider: "tmdb",
  external_id: "12345",
  title: "Test Movie",
  poster_url: null,
  status: "completed",
  rating: null,
  notes: null,
  is_favorite: false,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
  profiles: {
    display_name: "Usuario 1",
    avatar_url: null,
  },
  ...overrides,
});

/* =========================
   aggregateTotals
   ========================= */

describe("aggregateTotals", () => {
  it("returns zeros for empty array", () => {
    const totals = aggregateTotals([]);
    expect(totals.totalEntries).toBe(0);
    expect(totals.byStatus.completed).toBe(0);
    expect(totals.byStatus.in_progress).toBe(0);
    expect(totals.byStatus.planned).toBe(0);
    expect(totals.byStatus.dropped).toBe(0);
    expect(totals.favoritesCount).toBe(0);
    expect(totals.ratedCount).toBe(0);
    expect(totals.avgRating).toBeNull();
  });

  it("counts statuses correctly", () => {
    const entries: LibraryEntryWithProfile[] = [
      makeEntry({ status: "completed" }),
      makeEntry({ status: "completed" }),
      makeEntry({ status: "in_progress" }),
      makeEntry({ status: "planned" }),
      makeEntry({ status: "dropped" }),
    ];
    const totals = aggregateTotals(entries);
    expect(totals.totalEntries).toBe(5);
    expect(totals.byStatus.completed).toBe(2);
    expect(totals.byStatus.in_progress).toBe(1);
    expect(totals.byStatus.planned).toBe(1);
    expect(totals.byStatus.dropped).toBe(1);
  });

  it("counts favorites correctly", () => {
    const entries: LibraryEntryWithProfile[] = [
      makeEntry({ is_favorite: true }),
      makeEntry({ is_favorite: true }),
      makeEntry({ is_favorite: false }),
    ];
    const totals = aggregateTotals(entries);
    expect(totals.favoritesCount).toBe(2);
  });

  it("calculates avgRating correctly", () => {
    const entries: LibraryEntryWithProfile[] = [
      makeEntry({ rating: 8 }),
      makeEntry({ rating: 10 }),
      makeEntry({ rating: 6 }),
      makeEntry({ rating: null }), // should be ignored
    ];
    const totals = aggregateTotals(entries);
    expect(totals.ratedCount).toBe(3);
    expect(totals.avgRating).toBe(8); // (8+10+6) / 3 = 8
  });

  it("calculates avgRating with decimals rounded to 1 decimal", () => {
    const entries: LibraryEntryWithProfile[] = [
      makeEntry({ rating: 7 }),
      makeEntry({ rating: 8 }),
      makeEntry({ rating: 9 }),
    ];
    const totals = aggregateTotals(entries);
    // (7+8+9)/3 = 8.0
    expect(totals.avgRating).toBe(8);
  });

  it("counts by media type correctly", () => {
    const entries: LibraryEntryWithProfile[] = [
      makeEntry({ type: "movie" }),
      makeEntry({ type: "movie" }),
      makeEntry({ type: "tv" }),
      makeEntry({ type: "anime" }),
      makeEntry({ type: "game" }),
      makeEntry({ type: "game" }),
      makeEntry({ type: "game" }),
    ];
    const totals = aggregateTotals(entries);
    expect(totals.byType.movie).toBe(2);
    expect(totals.byType.tv).toBe(1);
    expect(totals.byType.anime).toBe(1);
    expect(totals.byType.game).toBe(3);
  });
});

/* =========================
   aggregateMonthly
   ========================= */

describe("aggregateMonthly", () => {
  it("returns 12 months with zeros for empty array", () => {
    const monthly = aggregateMonthly([]);
    expect(monthly).toHaveLength(12);
    monthly.forEach((m) => {
      expect(m.completedCount).toBe(0);
      expect(m.ratedCount).toBe(0);
    });
  });

  it("maps completed entries to correct months by created_at", () => {
    const entries: LibraryEntryWithProfile[] = [
      makeEntry({ status: "completed", created_at: "2024-01-15T00:00:00Z" }),
      makeEntry({ status: "completed", created_at: "2024-01-20T00:00:00Z" }),
      makeEntry({ status: "completed", created_at: "2024-06-10T00:00:00Z" }),
      makeEntry({ status: "in_progress", created_at: "2024-01-25T00:00:00Z" }), // should not count as completed
    ];
    const monthly = aggregateMonthly(entries);
    // month is numeric: 1 = January
    expect(monthly[0].month).toBe(1);
    expect(monthly[0].completedCount).toBe(2);
    expect(monthly[5].month).toBe(6);
    expect(monthly[5].completedCount).toBe(1);
  });

  it("maps rated entries to correct months by created_at", () => {
    const entries: LibraryEntryWithProfile[] = [
      makeEntry({ rating: 8, created_at: "2024-03-15T00:00:00Z" }),
      makeEntry({ rating: 9, created_at: "2024-03-20T00:00:00Z" }),
      makeEntry({ rating: 7, created_at: "2024-12-01T00:00:00Z" }),
      makeEntry({ rating: null, created_at: "2024-03-25T00:00:00Z" }), // should not count
    ];
    const monthly = aggregateMonthly(entries);
    // month 3 = March (index 2)
    expect(monthly[2].month).toBe(3);
    expect(monthly[2].ratedCount).toBe(2);
    // month 12 = December (index 11)
    expect(monthly[11].month).toBe(12);
    expect(monthly[11].ratedCount).toBe(1);
  });

  it("uses created_at for month determination", () => {
    const entries: LibraryEntryWithProfile[] = [
      makeEntry({
        status: "completed",
        created_at: "2024-07-15T00:00:00Z",
      }),
    ];
    const monthly = aggregateMonthly(entries);
    // month 7 = July (index 6)
    expect(monthly[6].month).toBe(7);
    expect(monthly[6].completedCount).toBe(1);
  });
});

/* =========================
   getTopRated
   ========================= */

describe("getTopRated", () => {
  it("returns empty array for entries without ratings", () => {
    const entries: LibraryEntryWithProfile[] = [
      makeEntry({ rating: null }),
      makeEntry({ rating: null }),
    ];
    const topRated = getTopRated(entries);
    expect(topRated).toHaveLength(0);
  });

  it("returns entries sorted by rating descending", () => {
    const entries: LibraryEntryWithProfile[] = [
      makeEntry({ external_id: "a", rating: 7 }),
      makeEntry({ external_id: "b", rating: 10 }),
      makeEntry({ external_id: "c", rating: 8 }),
    ];
    const topRated = getTopRated(entries);
    expect(topRated).toHaveLength(3);
    expect(topRated[0].rating).toBe(10);
    expect(topRated[1].rating).toBe(8);
    expect(topRated[2].rating).toBe(7);
  });

  it("limits results to specified count (default 5)", () => {
    const entries: LibraryEntryWithProfile[] = [
      makeEntry({ rating: 10 }),
      makeEntry({ rating: 9 }),
      makeEntry({ rating: 8 }),
      makeEntry({ rating: 7 }),
      makeEntry({ rating: 6 }),
      makeEntry({ rating: 5 }),
      makeEntry({ rating: 4 }),
    ];
    const topRated = getTopRated(entries);
    expect(topRated).toHaveLength(5);
    expect(topRated[0].rating).toBe(10);
    expect(topRated[4].rating).toBe(6);
  });

  it("respects custom limit", () => {
    const entries: LibraryEntryWithProfile[] = [
      makeEntry({ rating: 10 }),
      makeEntry({ rating: 9 }),
      makeEntry({ rating: 8 }),
    ];
    const topRated = getTopRated(entries, 2);
    expect(topRated).toHaveLength(2);
  });
});

/* =========================
   aggregateMemberStats (group leaderboard)
   ========================= */

describe("aggregateMemberStats (group leaderboard)", () => {
  it("returns empty array for empty entries", () => {
    const members = aggregateMemberStats([]);
    expect(members).toHaveLength(0);
  });

  it("aggregates stats per user", () => {
    const entries: LibraryEntryWithProfile[] = [
      makeEntry({
        user_id: "user-1",
        status: "completed",
        rating: 8,
        profiles: { display_name: "User 1", avatar_url: null },
      }),
      makeEntry({
        user_id: "user-1",
        status: "completed",
        rating: 10,
        profiles: { display_name: "User 1", avatar_url: null },
      }),
      makeEntry({
        user_id: "user-2",
        status: "completed",
        rating: 7,
        profiles: { display_name: "User 2", avatar_url: "http://img" },
      }),
    ];
    const members = aggregateMemberStats(entries);
    expect(members).toHaveLength(2);

    const user1 = members.find((m) => m.user_id === "user-1");
    expect(user1?.completedCount).toBe(2);
    expect(user1?.entriesCount).toBe(2);
    expect(user1?.avgRating).toBe(9); // (8+10)/2

    const user2 = members.find((m) => m.user_id === "user-2");
    expect(user2?.completedCount).toBe(1);
    expect(user2?.entriesCount).toBe(1);
    expect(user2?.avgRating).toBe(7);
  });

  it("sorts by completedCount desc, then avgRating desc", () => {
    const entries: LibraryEntryWithProfile[] = [
      // User A: 2 completed, avg 8
      makeEntry({
        user_id: "user-a",
        status: "completed",
        rating: 8,
        profiles: { display_name: "A", avatar_url: null },
      }),
      makeEntry({
        user_id: "user-a",
        status: "completed",
        rating: 8,
        profiles: { display_name: "A", avatar_url: null },
      }),
      // User B: 2 completed, avg 9 (should be higher)
      makeEntry({
        user_id: "user-b",
        status: "completed",
        rating: 9,
        profiles: { display_name: "B", avatar_url: null },
      }),
      makeEntry({
        user_id: "user-b",
        status: "completed",
        rating: 9,
        profiles: { display_name: "B", avatar_url: null },
      }),
      // User C: 3 completed, avg 7 (should be first due to more completed)
      makeEntry({
        user_id: "user-c",
        status: "completed",
        rating: 7,
        profiles: { display_name: "C", avatar_url: null },
      }),
      makeEntry({
        user_id: "user-c",
        status: "completed",
        rating: 7,
        profiles: { display_name: "C", avatar_url: null },
      }),
      makeEntry({
        user_id: "user-c",
        status: "completed",
        rating: 7,
        profiles: { display_name: "C", avatar_url: null },
      }),
    ];
    const members = aggregateMemberStats(entries);

    // Order: C (3 completed), B (2 completed, avg 9), A (2 completed, avg 8)
    expect(members[0].user_id).toBe("user-c");
    expect(members[0].completedCount).toBe(3);
    expect(members[1].user_id).toBe("user-b");
    expect(members[1].avgRating).toBe(9);
    expect(members[2].user_id).toBe("user-a");
    expect(members[2].avgRating).toBe(8);
  });

  it("handles users with no ratings (null avgRating sorts last)", () => {
    const entries: LibraryEntryWithProfile[] = [
      // User X: 1 completed, no rating
      makeEntry({
        user_id: "user-x",
        status: "completed",
        rating: null,
        profiles: { display_name: "X", avatar_url: null },
      }),
      // User Y: 1 completed, rating 5
      makeEntry({
        user_id: "user-y",
        status: "completed",
        rating: 5,
        profiles: { display_name: "Y", avatar_url: null },
      }),
    ];
    const members = aggregateMemberStats(entries);

    // Both have 1 completed, so sort by avgRating desc (null = -1 in sort)
    expect(members[0].user_id).toBe("user-y");
    expect(members[0].avgRating).toBe(5);
    expect(members[1].user_id).toBe("user-x");
    expect(members[1].avgRating).toBeNull();
  });
});

/* =========================
   aggregateStatsSummary (integration)
   ========================= */

describe("aggregateStatsSummary", () => {
  it("combines all aggregations correctly for mine scope", () => {
    const entries: LibraryEntryWithProfile[] = [
      makeEntry({ status: "completed", rating: 9, created_at: "2024-02-10T00:00:00Z" }),
      makeEntry({ status: "completed", rating: 8, created_at: "2024-02-15T00:00:00Z" }),
      makeEntry({ status: "in_progress", rating: null, created_at: "2024-02-20T00:00:00Z" }),
    ];
    const summary = aggregateStatsSummary(entries, "mine", 2024, "all");

    expect(summary.scope).toBe("mine");
    expect(summary.year).toBe(2024);
    expect(summary.type).toBe("all");
    expect(summary.totals.totalEntries).toBe(3);
    expect(summary.totals.byStatus.completed).toBe(2);
    expect(summary.totals.avgRating).toBe(8.5);
    // Feb is month 2 (index 1)
    expect(summary.monthly[1].completedCount).toBe(2);
    expect(summary.topRated).toHaveLength(2);
    expect(summary.members).toHaveLength(0); // mine scope has no members
  });

  it("includes members for group scope", () => {
    const entries: LibraryEntryWithProfile[] = [
      makeEntry({
        user_id: "user-1",
        status: "completed",
        rating: 10,
        profiles: { display_name: "User 1", avatar_url: null },
      }),
      makeEntry({
        user_id: "user-2",
        status: "completed",
        rating: 8,
        profiles: { display_name: "User 2", avatar_url: null },
      }),
    ];
    const summary = aggregateStatsSummary(entries, "group", 2024, "all");

    expect(summary.scope).toBe("group");
    expect(summary.members).toHaveLength(2);
    expect(summary.members[0].display_name).toBeDefined();
  });
});
