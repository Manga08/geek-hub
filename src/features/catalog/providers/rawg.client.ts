import type { RawgGameLike, RawgSearchResponse } from "@/features/catalog/providers/types";
const RAWG_BASE_URL = "https://api.rawg.io/api";
const DEFAULT_TIMEOUT_MS = 10000;

function getRawgApiKey(): string {
  const key = process.env.RAWG_API_KEY;
  if (!key) {
    throw new Error("RAWG_API_KEY is required on the server");
  }
  return key;
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

export async function rawgSearchGames({
  query,
  page = 1,
}: {
  query: string;
  page?: number;
}): Promise<RawgSearchResponse> {
  const key = getRawgApiKey();
  const url = new URL(`${RAWG_BASE_URL}/games`);
  url.searchParams.set("key", key);
  url.searchParams.set("search", query);
  url.searchParams.set("page", String(page));

  const response = await fetchWithTimeout(url.toString());
  if (!response.ok) {
    throw new Error(`RAWG search failed with status ${response.status}`);
  }
  const data: RawgSearchResponse = await response.json();
  return data;
}

export async function rawgGetGameDetail({ id }: { id: string | number }): Promise<RawgGameLike> {
  const key = getRawgApiKey();
  const url = new URL(`${RAWG_BASE_URL}/games/${id}`);
  url.searchParams.set("key", key);

  const response = await fetchWithTimeout(url.toString());
  if (!response.ok) {
    throw new Error(`RAWG detail failed with status ${response.status}`);
  }
  const data: RawgGameLike = await response.json();
  return data;
}
