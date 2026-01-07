export interface RawgGenre {
  name: string;
}

export interface RawgGameLike {
  id: number;
  name: string;
  released?: string | null;
  background_image?: string | null;
  background_image_additional?: string | null;
  short_screenshots?: { image?: string | null }[] | null;
  genres?: RawgGenre[] | null;
  description_raw?: string | null;
  platforms?: unknown;
  stores?: unknown;
  metacritic?: number | null;
  ratings_count?: number | null;
  slug?: string;
}

export interface RawgSearchResponse {
  results: RawgGameLike[];
  next?: string | null;
}

export interface TmdbGenre {
  id?: number;
  name: string;
}

export interface TmdbBase {
  id: number;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genre_ids?: number[];
  genres?: TmdbGenre[];
  popularity?: number | null;
  vote_average?: number | null;
  vote_count?: number | null;
  original_language?: string | null;
}

export interface TmdbMovie extends TmdbBase {
  title: string;
  release_date?: string | null;
  runtime?: number | null;
}

export interface TmdbTv extends TmdbBase {
  name: string;
  first_air_date?: string | null;
  number_of_seasons?: number | null;
  episode_run_time?: number[] | null;
  origin_country?: string[] | null;
}

export interface TmdbSearchResponse<T> {
  page: number;
  total_pages: number;
  results: T[];
}
