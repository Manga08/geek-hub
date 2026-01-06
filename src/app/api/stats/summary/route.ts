import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { aggregateStatsSummary } from "@/features/stats/aggregate";
import type { StatsScope, StatsType, LibraryEntryWithProfile } from "@/features/stats/types";

const MAX_ROWS = 5000;
const VALID_SCOPES = ["mine", "group"] as const;
const VALID_TYPES = ["all", "movie", "tv", "anime", "game"] as const;

// =========================
// GET /api/stats/summary
// =========================

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const scopeParam = searchParams.get("scope") ?? "mine";
  const yearParam = searchParams.get("year") ?? String(new Date().getFullYear());
  const typeParam = searchParams.get("type") ?? "all";

  // Validate scope
  if (!VALID_SCOPES.includes(scopeParam as StatsScope)) {
    return NextResponse.json(
      { error: `Invalid scope. Must be one of: ${VALID_SCOPES.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate type
  if (!VALID_TYPES.includes(typeParam as StatsType)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate year
  const year = parseInt(yearParam, 10);
  if (isNaN(year) || year < 2000 || year > 2100) {
    return NextResponse.json(
      { error: "Invalid year. Must be between 2000 and 2100" },
      { status: 400 }
    );
  }

  const scope = scopeParam as StatsScope;
  const type = typeParam as StatsType;

  try {
    // Get user's current group
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_group_id")
      .eq("id", user.id)
      .single();

    if (!profile?.default_group_id) {
      return NextResponse.json(
        { error: "No group context. Please select a group first." },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: `Too many entries (>${MAX_ROWS}). Please narrow your filters.` },
        { status: 413 }
      );
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

    return NextResponse.json(summary);
  } catch (error) {
    console.error("GET /api/stats/summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
