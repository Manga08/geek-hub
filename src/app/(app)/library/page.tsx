"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Library, Search, Gamepad2, Film, Tv, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { LibraryCard } from "@/features/library/components";
import {
  libraryKeys,
  fetchLibraryList,
  type LibraryListFilters,
} from "@/features/library/queries";
import { STATUS_LABELS, type EntryStatus } from "@/features/library/types";

const TYPES = [
  { value: "", label: "Todos", icon: Sparkles },
  { value: "game", label: "Juegos", icon: Gamepad2 },
  { value: "movie", label: "Películas", icon: Film },
  { value: "tv", label: "Series", icon: Tv },
  { value: "anime", label: "Anime", icon: Sparkles },
] as const;

const STATUSES = [
  { value: "", label: "Todos" },
  { value: "planned", label: STATUS_LABELS.planned },
  { value: "in_progress", label: STATUS_LABELS.in_progress },
  { value: "completed", label: STATUS_LABELS.completed },
  { value: "dropped", label: STATUS_LABELS.dropped },
] as const;

const SORTS = [
  { value: "recent", label: "Recientes" },
  { value: "rating", label: "Rating" },
] as const;

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-md"
          : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="mb-6 rounded-full bg-white/5 p-6">
        <Library className="h-12 w-12 text-muted-foreground/50" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        Tu biblioteca está vacía
      </h2>
      <p className="mb-6 max-w-sm text-muted-foreground">
        Explora el catálogo y agrega juegos, películas, series o anime a tu
        colección personal.
      </p>
      <Button asChild>
        <Link href="/search">
          <Search className="mr-2 h-4 w-4" />
          Ir a buscar
        </Link>
      </Button>
    </motion.div>
  );
}

function FilteredEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="mb-4 rounded-full bg-white/5 p-4">
        <Search className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-foreground">
        Sin resultados
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        No hay entradas que coincidan con los filtros seleccionados.
      </p>
      <Button variant="outline" size="sm" onClick={onClear}>
        Limpiar filtros
      </Button>
    </motion.div>
  );
}

function LibraryGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-white/10 bg-white/[0.03]">
      <div className="aspect-[2/3] w-full bg-white/5" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-12 rounded bg-white/10" />
        <div className="h-4 w-full rounded bg-white/10" />
        <div className="h-4 w-2/3 rounded bg-white/10" />
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const [filters, setFilters] = useState<LibraryListFilters>({
    sort: "recent",
  });

  const { data: entries, isLoading, error } = useQuery({
    queryKey: libraryKeys.list(filters),
    queryFn: () => fetchLibraryList(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const hasFilters = !!(filters.type || filters.status || filters.favorite);
  const isEmpty = !isLoading && entries?.length === 0;

  const clearFilters = () => {
    setFilters({ sort: filters.sort });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Library className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mi Biblioteca</h1>
          <p className="text-sm text-muted-foreground">
            {entries?.length ?? 0} entradas
          </p>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="space-y-4 p-4">
        {/* Type filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tipo
          </span>
          {TYPES.map(({ value, label, icon: Icon }) => (
            <FilterChip
              key={value}
              active={filters.type === value || (!filters.type && value === "")}
              onClick={() =>
                setFilters((f) => ({ ...f, type: value || undefined }))
              }
            >
              <Icon className="mr-1.5 inline-block h-3.5 w-3.5" />
              {label}
            </FilterChip>
          ))}
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Estado
          </span>
          {STATUSES.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={
                filters.status === value || (!filters.status && value === "")
              }
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  status: (value as EntryStatus) || undefined,
                }))
              }
            >
              {label}
            </FilterChip>
          ))}
        </div>

        {/* Bottom row: favorites + sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
          <FilterChip
            active={filters.favorite === true}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                favorite: f.favorite ? undefined : true,
              }))
            }
          >
            ❤️ Solo favoritos
          </FilterChip>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Ordenar
            </span>
            {SORTS.map(({ value, label }) => (
              <FilterChip
                key={value}
                active={filters.sort === value}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    sort: value as "recent" | "rating",
                  }))
                }
              >
                {label}
              </FilterChip>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Content */}
      {isLoading ? (
        <LibraryGrid>
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} />
          ))}
        </LibraryGrid>
      ) : error ? (
        <GlassCard className="p-8 text-center">
          <p className="text-red-400">Error al cargar la biblioteca</p>
        </GlassCard>
      ) : isEmpty && !hasFilters ? (
        <EmptyState />
      ) : isEmpty && hasFilters ? (
        <FilteredEmptyState onClear={clearFilters} />
      ) : (
        <AnimatePresence mode="popLayout">
          <LibraryGrid>
            {entries?.map((entry) => (
              <LibraryCard key={entry.id} entry={entry} />
            ))}
          </LibraryGrid>
        </AnimatePresence>
      )}
    </div>
  );
}
