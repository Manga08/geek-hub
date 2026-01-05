import type { UnifiedCatalogItem, UnifiedItemType } from "./unified.types";
import type { TmdbGenre, TmdbMovie, TmdbTv } from "@/features/catalog/providers/types";

const POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";

function parseYear(dateString?: string | null): number | null {
  if (!dateString) return null;
  const year = Number.parseInt(dateString.slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
}

export function normalizeTmdbItem(raw: TmdbMovie | TmdbTv, type: UnifiedItemType): UnifiedCatalogItem {
  const externalId = String(raw.id ?? "");
  const isMovie = type === "movie";

  const title = isMovie ? raw.title ?? "" : raw.name ?? "";
  const year = isMovie ? parseYear(raw.release_date) : parseYear(raw.first_air_date);

  const posterUrl = raw.poster_path ? `${POSTER_BASE}${raw.poster_path}` : null;
  const backdropUrl = raw.backdrop_path ? `${BACKDROP_BASE}${raw.backdrop_path}` : null;

  const genres = Array.isArray(raw.genres)
    ? raw.genres.map((g: TmdbGenre) => g.name).filter((name): name is string => Boolean(name))
    : [];

  const meta: Record<string, unknown> = {
    runtime: raw.runtime,
    number_of_seasons: raw.number_of_seasons,
    episode_run_time: raw.episode_run_time,
    popularity: raw.popularity,
    vote_average: raw.vote_average,
  };

  return {
    key: `tmdb-${externalId}`,
    type,
    provider: "tmdb",
    externalId,
    title,
    year,
    posterUrl,
    backdropUrl,
    genres,
    summary: raw.overview ?? null,
    meta,
  };
}
