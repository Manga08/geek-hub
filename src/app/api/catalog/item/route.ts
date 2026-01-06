import { NextRequest } from "next/server";

import { getUnifiedItem } from "@/features/catalog/service";
import {
  ok,
  badRequest,
  internal,
  catalogItemQuerySchema,
  validateQuery,
  formatZodErrors,
} from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = validateQuery(catalogItemQuerySchema, searchParams);

  if (!parsed.success) {
    return badRequest("Invalid query parameters", formatZodErrors(parsed.error));
  }

  const { type, provider, externalId } = parsed.data;

  try {
    const item = await getUnifiedItem({ type, provider, externalId });
    return ok(item);
  } catch (error: unknown) {
    console.error("GET /api/catalog/item error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch item";
    return internal(message);
  }
}
