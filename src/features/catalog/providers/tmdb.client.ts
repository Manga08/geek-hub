import type { TmdbMovie, TmdbSearchResponse, TmdbTv } from "@/features/catalog/providers/types";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const DEFAULT_TIMEOUT_MS = 10000;

function getTmdbAuth(): { headers?: Record<string, string>; queryParam?: string } {
  const token = process.env.TMDB_ACCESS_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;
  if (token) {
    return { headers: { Authorization: `Bearer ${token}` } };
  }
  if (apiKey) {
    return { queryParam: apiKey };
  }
  throw new Error("TMDB_ACCESS_TOKEN or TMDB_API_KEY is required on the server");
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

function buildUrl(path: string, query: Record<string, string | number | undefined>): { url: string; headers: Record<string, string> } {
  const auth = getTmdbAuth();
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });
  if (auth.queryParam) {
    url.searchParams.set("api_key", auth.queryParam);
  }
  const headers: Record<string, string> = { Accept: "application/json" };
  if (auth.headers) {
    Object.assign(headers, auth.headers);
  }
  return { url: url.toString(), headers };
}

export async function tmdbSearch({
  type,
  query,
  page = 1,
}: {
  type: "movie" | "tv";
  query: string;
  page?: number;
}): Promise<TmdbSearchResponse<TmdbMovie | TmdbTv>> {
  const { url, headers } = buildUrl(`/search/${type}`, { query, page });
  const response = await fetchWithTimeout(url, { headers });
  if (!response.ok) {
    throw new Error(`TMDb search failed with status ${response.status}`);
  }
  const data: TmdbSearchResponse<TmdbMovie | TmdbTv> = await response.json();
  return data;
}

export async function tmdbGetDetail({
  type,
  id,
}: {
  type: "movie" | "tv";
  id: string | number;
}): Promise<TmdbMovie | TmdbTv> {
  const { url, headers } = buildUrl(`/${type}/${id}`, {});
  const response = await fetchWithTimeout(url, { headers });
  if (!response.ok) {
    throw new Error(`TMDb detail failed with status ${response.status}`);
  }
  const data: TmdbMovie | TmdbTv = await response.json();
  return data;
}
