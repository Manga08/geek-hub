import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { aggregateStatsSummary } from "@/features/stats/aggregate";
import {
  ok,
  badRequest,
  unauthenticated,
  internal,
  statsSummaryQuerySchema,
  validateQuery,
  formatZodErrors,
} from "@/lib/api";
import type { StatsScope, StatsType, LibraryEntryWithProfile } from "@/features/stats/types";

const MAX_ROWS = 5000;

// =========================
// GET /api/stats/summary
// =========================

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthenticated();
  }

  // Parse and validate query params with Zod
  const { searchParams } = new URL(request.url);
  const parsed = validateQuery(statsSummaryQuerySchema, searchParams);

  if (!parsed.success) {
    return badRequest("Invalid query parameters", formatZodErrors(parsed.error));
  }

  const { scope, year, type } = parsed.data;

  try {
    // Get user's current group
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_group_id")
      .eq("id", user.id)
      .single();

    if (!profile?.default_group_id) {
      return badRequest("No group context. Please select a group first.");
    }

    const groupId = profile.default_group_id;

    // Build date range for the year
    const startDate = `${year}-01-01T00:00:00.000Z`;
    const endDate = `${year + 1}-01-01T00:00:00.000Z`;

    // Build query
    let query = supabase
      .from("library_entries")
      .select(`
        id,
        user_id,
        group_id,
        type,
        provider,
        external_id,
        title,
        poster_url,
        status,
        rating,
        notes,
        is_favorite,
        created_at,
        updated_at,
        profiles:profiles!library_entries_user_id_profiles_fkey(display_name, avatar_url)
      `)
      .eq("group_id", groupId)
      .gte("created_at", startDate)
      .lt("created_at", endDate)
      .limit(MAX_ROWS + 1); // Fetch one extra to detect overflow

    // Filter by user if scope=mine
    if (scope === "mine") {
      query = query.eq("user_id", user.id);
    }

    // Filter by type if not "all"
    if (type !== "all") {
      query = query.eq("type", type);
    }

    const { data: rawEntries, error } = await query;

    if (error) {
      console.error("GET /api/stats/summary error:", error);
      return NextResponse.json(
        { error: "Error fetching library entries" },
        { status: 500 }
      );
    }

    // Check for row limit exceeded
    if (rawEntries && rawEntries.length > MAX_ROWS) {
      return badRequest(`Too many entries (>${MAX_ROWS}). Please narrow your filters.`);
    }

    // Transform to LibraryEntryWithProfile
    const entries: LibraryEntryWithProfile[] = (rawEntries ?? []).map((row) => {
      const profiles = row.profiles as unknown as { display_name: string | null; avatar_url: string | null } | null;
      return {
        id: row.id,
        user_id: row.user_id,
        group_id: row.group_id,
        type: row.type,
        provider: row.provider,
        external_id: row.external_id,
        title: row.title,
        poster_url: row.poster_url,
        status: row.status,
        rating: row.rating,
        notes: row.notes,
        is_favorite: row.is_favorite,
        created_at: row.created_at,
        updated_at: row.updated_at,
        profiles,
      };
    });

    // Aggregate stats
    const summary = aggregateStatsSummary(entries, scope, year, type);

    return ok(summary);
  } catch (error) {
    console.error("GET /api/stats/summary error:", error);
    return internal();
  }
}
