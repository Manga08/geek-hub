import { normalizeRawgItem } from "@/features/catalog/normalize/rawg.normalize";
import { normalizeTmdb } from "@/features/catalog/normalize/tmdb.normalize";
import type { UnifiedCatalogItem, UnifiedItemType, Provider } from "@/features/catalog/normalize/unified.types";
import { rawgGetGameDetail, rawgSearchGames } from "@/features/catalog/providers/rawg.client";
import { tmdbGetDetail, tmdbSearch } from "@/features/catalog/providers/tmdb.client";

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
    const items = Array.isArray(data.results) ? data.results.map(normalizeRawgItem) : [];
    const hasMore = Boolean(data.next);
    return { items, page, hasMore };
  }

  const tmdbType = type === "movie" ? "movie" : "tv";
  const data = await tmdbSearch({ type: tmdbType, query, page });
  const items = Array.isArray(data.results)
    ? data.results.map((item) => normalizeTmdb(type, item))
    : [];
  const hasMore = typeof data.total_pages === "number" ? page < data.total_pages : false;
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
  return normalizeTmdb(type, data);
}
