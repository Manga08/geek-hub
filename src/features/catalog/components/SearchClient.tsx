"use client";

import { useState } from "react";
import { InfiniteData, QueryClient, QueryClientProvider, useInfiniteQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaGrid } from "@/components/shared/MediaGrid";
import { MediaCard } from "@/components/shared/MediaCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { MediaGridSkeleton } from "@/components/shared/Skeletons";
import { AttributionFooter } from "@/components/shared/AttributionFooter";
import { GlassCard } from "@/components/shared/GlassCard";
import type { UnifiedItemType } from "@/features/catalog/normalize/unified.types";
import { fetchCatalogSearch } from "@/features/catalog/queries";

type SearchPageResult = Awaited<ReturnType<typeof fetchCatalogSearch>>;

function SearchInner() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<UnifiedItemType>("game");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const enabled = submittedQuery.trim().length > 0;

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<SearchPageResult, Error, InfiniteData<SearchPageResult, number>, [string, string, UnifiedItemType, string], number>({
    queryKey: ["catalog", "search", type, submittedQuery],
    queryFn: ({ pageParam = 1 }) => fetchCatalogSearch({ type, query: submittedQuery, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled,
    staleTime: 1000 * 30,
  });

  const results = data?.pages.flatMap((page) => page.items) ?? [];
  const isInitialLoading = isLoading && enabled;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) return;
    setSubmittedQuery(query.trim());
  };

  const handleLoadMore = () => {
    if (hasNextPage) {
      fetchNextPage();
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-4 sm:p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Búsqueda</label>
            <Input
              placeholder="Buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Tipo</label>
            <Select value={type} onValueChange={(v) => setType(v as UnifiedItemType)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="game">Game</SelectItem>
                <SelectItem value="movie">Movie</SelectItem>
                <SelectItem value="tv">TV</SelectItem>
                <SelectItem value="anime">Anime</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="sm:w-32" disabled={isFetching}>
            {isFetching ? "Buscando..." : "Buscar"}
          </Button>
        </form>
      </GlassCard>

      {isInitialLoading ? <MediaGridSkeleton /> : null}

      {!isInitialLoading && enabled && !isError && results.length === 0 ? (
        <EmptyState message="Sin resultados" />
      ) : null}

      {isError ? (
        <EmptyState message={error instanceof Error ? error.message : "Error al buscar"} />
      ) : null}

      {results.length > 0 ? (
        <div className="space-y-4">
          <MediaGrid>
            {results.map((item) => (
              <MediaCard key={item.key} item={item} />
            ))}
          </MediaGrid>
          {hasNextPage ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleLoadMore} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? "Cargando..." : "Cargar más"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <AttributionFooter />
    </div>
  );
}

export default function SearchClient() {
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      <SearchInner />
    </QueryClientProvider>
  );
}
