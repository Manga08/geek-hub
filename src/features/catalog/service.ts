import { normalizeRawgItem } from "@/features/catalog/normalize/rawg.normalize";
import { normalizeTmdbDispatch } from "@/features/catalog/normalize/tmdb.normalize";
import type { UnifiedCatalogItem, UnifiedItemType, Provider } from "@/features/catalog/normalize/unified.types";
import { rawgGetGameDetail, rawgSearchGames } from "@/features/catalog/providers/rawg.client";
import { tmdbGetDetail, tmdbSearch } from "@/features/catalog/providers/tmdb.client";
import type { TmdbTv } from "@/features/catalog/providers/types";

/**
 * Heuristic to filter anime from general TV results.
 * Exported for testing.
 */
export function filterAnimeCandidates(results: TmdbTv[]): TmdbTv[] {
  const ANIMATION_GENRE_ID = 16;

  // STRICT: Genre Animation AND (Language 'ja' OR Country 'JP')
  const strict = results.filter((item) => {
    const hasGenre = item.genre_ids?.includes(ANIMATION_GENRE_ID);
    const isJapanese =
      item.original_language === "ja" || item.origin_country?.includes("JP");
    return hasGenre && isJapanese;
  });

  if (strict.length >= 5) {
    return strict;
  }

  // FALLBACK: Just Genre Animation
  return results.filter((item) => item.genre_ids?.includes(ANIMATION_GENRE_ID));
}

export async function searchUnified({
  type,
  query,
  page = 1,
}: {
  type: UnifiedItemType;
  query: string;
  page?: number;
}): Promise<{ items: UnifiedCatalogItem[]; page: number; hasMore: boolean }> {
  if (!query) {
    return { items: [], page, hasMore: false };
  }

  if (type === "game") {
    const data = await rawgSearchGames({ query, page });
    const items = Array.isArray(data.results)
      ? data.results.map(normalizeRawgItem)
      : [];
    const hasMore = Boolean(data.next);
    return { items, page, hasMore };
  }

  // Special handling for Anime: Use TV endpoint + Heuristic filter
  if (type === "anime") {
    const data = await tmdbSearch({ type: "tv", query, page });
    const rawResults = Array.isArray(data.results)
      ? (data.results as TmdbTv[])
      : [];

    const filtered = filterAnimeCandidates(rawResults);

    // Normalize passing "anime" type so it sets the correct type on UnifiedCatalogItem
    const items = filtered.map((item) => normalizeTmdbDispatch("anime", item));

    const hasMore =
      typeof data.total_pages === "number" ? page < data.total_pages : false;
    return { items, page: data.page ?? page, hasMore };
  }

  const tmdbType = type === "movie" ? "movie" : "tv";
  const data = await tmdbSearch({ type: tmdbType, query, page });
  const items = Array.isArray(data.results)
    ? data.results.map((item) => normalizeTmdbDispatch(type, item))
    : [];
  const hasMore =
    typeof data.total_pages === "number" ? page < data.total_pages : false;
  return { items, page: data.page ?? page, hasMore };
}

export async function getUnifiedItem({
  type,
  provider,
  externalId,
}: {
  type: UnifiedItemType;
  provider: Provider;
  externalId: string;
}): Promise<UnifiedCatalogItem> {
  if (type === "game") {
    if (provider !== "rawg") {
      throw new Error("Invalid provider for game type");
    }
    const data = await rawgGetGameDetail({ id: externalId });
    return normalizeRawgItem(data);
  }

  if (provider !== "tmdb") {
    throw new Error("Invalid provider for non-game type");
  }
  const tmdbType = type === "movie" ? "movie" : "tv";
  const data = await tmdbGetDetail({ type: tmdbType, id: externalId });
  return normalizeTmdbDispatch(type, data);
}
