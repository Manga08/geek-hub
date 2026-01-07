import { NextRequest } from "next/server";
import { requireApiContext } from "@/lib/auth/request-context";
import {
  ok,
  badRequest,
  internal,
  validateBody,
  formatZodErrors,
} from "@/lib/api";
import { z } from "zod";

// =========================
// Schema
// =========================

const lookupItemSchema = z.object({
  type: z.enum(["game", "movie", "tv", "anime"]),
  provider: z.enum(["rawg", "tmdb"]),
  external_id: z.string().min(1),
});

const lookupBodySchema = z.object({
  items: z.array(lookupItemSchema).min(1).max(50),
});

type LookupItem = z.infer<typeof lookupItemSchema>;

interface FoundEntry {
  type: string;
  provider: string;
  external_id: string;
  entry_id: string;
  status: string;
  rating: number | null;
  is_favorite: boolean;
}

// =========================
// POST /api/library/entry/lookup
// Batch lookup for library entries - avoids N+1 calls
// =========================
export async function POST(request: NextRequest) {
  // Get authenticated context (supabase + userId + groupId)
  const authResult = await requireApiContext();
  if (!authResult.ok) return authResult.response;

  const { supabase, userId, defaultGroupId } = authResult.ctx;

  if (!defaultGroupId) {
    return ok({ found: [] }); // No group = no library
  }

  try {
    const body = await request.json();
    const parsed = validateBody(lookupBodySchema, body);

    if (!parsed.success) {
      return badRequest("Invalid request body", formatZodErrors(parsed.error));
    }

    const { items } = parsed.data;

    // Group items by (type, provider) to batch queries efficiently
    const grouped = new Map<string, LookupItem[]>();
    for (const item of items) {
      const key = `${item.type}:${item.provider}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(item);
    }

    const found: FoundEntry[] = [];

    // Execute one query per (type, provider) group using IN clause
    for (const [key, groupItems] of grouped) {
      const [type, provider] = key.split(":");
      const externalIds = groupItems.map((i) => i.external_id);

      const { data, error } = await supabase
        .from("library_entries")
        .select("id, type, provider, external_id, status, rating, is_favorite")
        .eq("group_id", defaultGroupId)
        .eq("user_id", userId)
        .eq("type", type)
        .eq("provider", provider)
        .in("external_id", externalIds);

      if (error) {
        console.error(`lookup query error for ${key}:`, error);
        continue; // Skip this group on error, don't fail entire request
      }

      if (data) {
        for (const entry of data) {
          found.push({
            type: entry.type,
            provider: entry.provider,
            external_id: entry.external_id,
            entry_id: entry.id,
            status: entry.status,
            rating: entry.rating,
            is_favorite: entry.is_favorite,
          });
        }
      }
    }

    return ok({ found });
  } catch (error) {
    console.error("POST /api/library/entry/lookup error:", error);
    return internal();
  }
}
