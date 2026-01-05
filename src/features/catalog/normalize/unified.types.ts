export type UnifiedItemType = "game" | "movie" | "tv" | "anime";

export type Provider = "rawg" | "tmdb";

export interface UnifiedCatalogItem {
  key: string; // `${provider}-${externalId}`
  type: UnifiedItemType;
  provider: Provider;
  externalId: string;
  title: string;
  year?: number | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  genres: string[];
  summary?: string | null;
  meta: Record<string, any>;
}
