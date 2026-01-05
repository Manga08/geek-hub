import type { UnifiedCatalogItem } from "./unified.types";
import type { RawgGameLike } from "@/features/catalog/providers/types";

function parseYear(dateString?: string | null): number | null {
  if (!dateString) return null;
  const year = Number.parseInt(dateString.slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
}

export function normalizeRawgItem(raw: RawgGameLike): UnifiedCatalogItem {
  const externalId = String(raw.id ?? "");
  const title = raw.name ?? "";

  return {
    key: `rawg-${externalId}`,
    type: "game",
    provider: "rawg",
    externalId,
    title,
    year: parseYear(raw.released),
    posterUrl: raw.background_image ?? null,
    backdropUrl: raw.background_image_additional ?? null,
    genres: Array.isArray(raw.genres) ? raw.genres.map((g) => g.name) : [],
    summary: raw.description_raw ?? null,
    meta: {
      platforms: raw.platforms,
      stores: raw.stores,
      metacritic: raw.metacritic,
      ratings_count: raw.ratings_count,
      slug: raw.slug,
    },
  };
}
