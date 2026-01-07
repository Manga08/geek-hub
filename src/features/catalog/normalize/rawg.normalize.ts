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

  const posterCandidate = raw.background_image
    ?? raw.background_image_additional
    ?? raw.short_screenshots?.[0]?.image
    ?? null;
  const posterUrl = posterCandidate ? upgradeRawgImage(posterCandidate) : null;
  const backdropUrl = raw.background_image_additional ?? raw.background_image ?? null;

  return {
    key: `rawg-${externalId}`,
    type: "game",
    provider: "rawg",
    externalId,
    title,
    year: parseYear(raw.released),
    posterUrl,
    rating: raw.rating ?? (raw.metacritic ? raw.metacritic / 10 : null),
    backdropUrl,
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

export function upgradeRawgImage(url: string): string {
  // Already resized => leave as is
  if (url.includes("/resize/")) return url;

  // media.rawg.io/media/... => insert resize/1280/-/ after /media/
  if (url.includes("media.rawg.io/media/") && !url.includes("/resize/")) {
    return url.replace(
      /media\.rawg\.io\/media\//,
      "media.rawg.io/media/resize/1280/-/"
    );
  }

  return url;
}
