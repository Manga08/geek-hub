import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { libraryRepo } from "@/features/library/repo";
import { ok, fail, unauthenticated, internal } from "@/lib/api/respond";
import {
  libraryListQuerySchema,
  validateQuery,
  formatZodErrors,
} from "@/lib/api/schemas";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthenticated("Authentication required");
  }

  // Validate query params with Zod
  const { searchParams } = new URL(request.url);
  const parsed = validateQuery(libraryListQuerySchema, searchParams);

  if (!parsed.success) {
    return fail("BAD_REQUEST", "Invalid query parameters", 400, formatZodErrors(parsed.error));
  }

  const { scope, type, status, provider, favorite, unrated, q, sort, limit, offset } = parsed.data;

  try {
    const repoOptions = {
      type,
      status, // Already transformed to string[] by Zod
      provider,
      isFavorite: favorite,
      unrated,
      q,
      sort,
      limit,
      offset,
    };

    const entries = scope === "group"
      ? await libraryRepo.listByGroup(repoOptions)
      : await libraryRepo.listMyEntries(repoOptions);

    return ok(entries);
  } catch (error) {
    console.error("GET /api/library/list error:", error);
    return internal("Failed to fetch library entries");
  }
}
