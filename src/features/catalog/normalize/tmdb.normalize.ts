import type { UnifiedCatalogItem, UnifiedItemType } from "./unified.types";
import type { TmdbGenre, TmdbMovie, TmdbTv } from "@/features/catalog/providers/types";

const POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";

function parseYear(dateString?: string | null): number | null {
  if (!dateString) return null;
  const year = Number.parseInt(dateString.slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
}

export function normalizeTmdb(type: "movie", raw: TmdbMovie): UnifiedCatalogItem;
export function normalizeTmdb(type: "tv" | "anime", raw: TmdbTv): UnifiedCatalogItem;
export function normalizeTmdb(type: UnifiedItemType, raw: TmdbMovie | TmdbTv): UnifiedCatalogItem {
  const externalId = String(raw.id ?? "");
  const isMovie = type === "movie";

  const title = isMovie ? (raw as TmdbMovie).title ?? "" : (raw as TmdbTv).name ?? "";
  const year = isMovie ? parseYear((raw as TmdbMovie).release_date) : parseYear((raw as TmdbTv).first_air_date);

  const posterUrl = raw.poster_path ? `${POSTER_BASE}${raw.poster_path}` : null;
  const backdropUrl = raw.backdrop_path ? `${BACKDROP_BASE}${raw.backdrop_path}` : null;

  const genres = Array.isArray(raw.genres)
    ? raw.genres.map((g: TmdbGenre) => g.name).filter((name): name is string => Boolean(name))
    : [];

  const baseMeta = {
    popularity: raw.popularity,
    vote_average: raw.vote_average,
    vote_count: raw.vote_count,
  };

  const meta: Record<string, unknown> = isMovie
    ? {
        ...baseMeta,
        runtime: (raw as TmdbMovie).runtime,
      }
    : {
        ...baseMeta,
        number_of_seasons: (raw as TmdbTv).number_of_seasons,
        episode_run_time: (raw as TmdbTv).episode_run_time,
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

export function normalizeTmdbDispatch(
  type: "movie" | "tv" | "anime",
  raw: TmdbMovie | TmdbTv,
): UnifiedCatalogItem {
  if (type === "movie") {
    return normalizeTmdb("movie", raw as TmdbMovie);
  }
  return normalizeTmdb(type, raw as TmdbTv);
}
