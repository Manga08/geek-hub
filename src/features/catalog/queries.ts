import { readApiJson } from "@/lib/api-client";
import type { Provider, UnifiedCatalogItem, UnifiedItemType } from "@/features/catalog/normalize/unified.types";

export const catalogSearchKey = ({ type, q, page }: { type: UnifiedItemType; q: string; page: number }) => ["catalog", "search", type, q, page] as const;
export const catalogItemKey = ({ type, key }: { type: UnifiedItemType; key: string }) => ["catalog", "item", type, key] as const;

type SearchResponse = {
  items: UnifiedCatalogItem[];
  page: number;
  hasMore: boolean;
};

function parseKey(key: string): { provider: Provider; externalId: string } {
  const [provider, ...rest] = key.split("-");
  const externalId = rest.join("-");
  if (!provider || !externalId) {
    throw new Error("Invalid item key");
  }
  if (provider !== "rawg" && provider !== "tmdb") {
    throw new Error("Unsupported provider");
  }
  return { provider, externalId };
}

export async function fetchCatalogSearch({
  type,
  query,
  page = 1,
}: {
  type: UnifiedItemType;
  query: string;
  page?: number;
}): Promise<SearchResponse> {
  const params = new URLSearchParams({ type, q: query, page: String(page) });
  const res = await fetch(`/api/catalog/search?${params.toString()}`);
  return readApiJson<SearchResponse>(res);
}

export async function fetchCatalogItem({
  type,
  key,
}: {
  type: UnifiedItemType;
  key: string;
}): Promise<UnifiedCatalogItem> {
  const { provider, externalId } = parseKey(key);
  const params = new URLSearchParams({ type, provider, externalId });
  const res = await fetch(`/api/catalog/item?${params.toString()}`);
  return readApiJson<UnifiedCatalogItem>(res);
}
