import { NextRequest } from "next/server";

import { searchUnified } from "@/features/catalog/service";
import {
  ok,
  badRequest,
  internal,
  catalogSearchQuerySchema,
  validateQuery,
  formatZodErrors,
} from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = validateQuery(catalogSearchQuerySchema, searchParams);

  if (!parsed.success) {
    return badRequest("Invalid query parameters", formatZodErrors(parsed.error));
  }

  const { type, q: query, page } = parsed.data;

  try {
    const result = await searchUnified({ type, query, page });
    return ok(result);
  } catch (error: unknown) {
    console.error("GET /api/catalog/search error:", error);
    const message = error instanceof Error ? error.message : "Search failed";
    return internal(message);
  }
}
