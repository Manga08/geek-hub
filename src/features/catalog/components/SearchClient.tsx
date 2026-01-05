"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider, useInfiniteQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaGrid } from "@/components/shared/MediaGrid";
import { MediaCard } from "@/components/shared/MediaCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { MediaGridSkeleton } from "@/components/shared/Skeletons";
import { AttributionFooter } from "@/components/shared/AttributionFooter";
import type { UnifiedItemType } from "@/features/catalog/normalize/unified.types";
import { fetchCatalogSearch } from "@/features/catalog/queries";

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
  } = useInfiniteQuery({
    queryKey: ["catalog", "search", type, submittedQuery],
    queryFn: ({ pageParam = 1 }) => fetchCatalogSearch({ type, query: submittedQuery, page: pageParam }),
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-zinc-700">Búsqueda</label>
          <Input
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700">Tipo</label>
          <Select value={type} onValueChange={(v) => setType(v as UnifiedItemType)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="game">Game</SelectItem>
              <SelectItem value="movie">Movie</SelectItem>
              <SelectItem value="tv">TV</SelectItem>
              <SelectItem value="anime">Anime</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="self-end sm:self-auto" disabled={isFetching}>
          {isFetching ? "Buscando..." : "Buscar"}
        </Button>
      </form>

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
