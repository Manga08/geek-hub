"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Library,
  Search,
  Gamepad2,
  Film,
  Tv,
  Sparkles,
  X,
  Check,
  Trash2,
  Heart,
  HeartOff,
  CheckSquare,
  Square,
  MoreHorizontal,
  Star,
  FileText,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LibraryCard, NotesModal } from "@/features/library/components";
import {
  libraryKeys,
  fetchLibraryList,
  bulkUpdateEntries,
  type LibraryListFilters,
} from "@/features/library/queries";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  type EntryStatus,
  type LibraryEntry,
} from "@/features/library/types";
import { MediaCardSkeleton } from "@/components/shared/Skeletons";

// =====================
// Constants
// =====================
const TYPES = [
  { value: "", label: "Todos", icon: Sparkles },
  { value: "game", label: "Juegos", icon: Gamepad2 },
  { value: "movie", label: "Películas", icon: Film },
  { value: "tv", label: "Series", icon: Tv },
  { value: "anime", label: "Anime", icon: Sparkles },
] as const;

const ALL_STATUSES: EntryStatus[] = ["planned", "in_progress", "completed", "dropped"];

const SORTS = [
  { value: "recent", label: "Recientes" },
  { value: "rating", label: "Rating" },
] as const;

// =====================
// URL Helpers
// =====================
function parseFiltersFromUrl(searchParams: URLSearchParams): LibraryListFilters {
  const status = searchParams.get("status");
  return {
    type: searchParams.get("type") || undefined,
    status: status ? status.split(",").filter(Boolean) : undefined,
    provider: searchParams.get("provider") || undefined,
    favorite: searchParams.get("favorite") === "true" ? true : undefined,
    unrated: searchParams.get("unrated") === "true" ? true : undefined,
    q: searchParams.get("q") || undefined,
    sort: (searchParams.get("sort") as "recent" | "rating") || "recent",
  };
}

function filtersToSearchParams(filters: LibraryListFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
    params.set("status", filters.status.join(","));
  }
  if (filters.provider) params.set("provider", filters.provider);
  if (filters.favorite) params.set("favorite", "true");
  if (filters.unrated) params.set("unrated", "true");
  if (filters.q) params.set("q", filters.q);
  if (filters.sort && filters.sort !== "recent") params.set("sort", filters.sort);
  return params;
}

// =====================
// UI Components
// =====================
function FilterChip({
  active,
  onClick,
  children,
  variant = "default",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "status";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
        active
          ? variant === "status"
            ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
            : "bg-primary text-primary-foreground shadow-md"
          : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function StatusChip({
  status,
  active,
  onClick,
}: {
  status: EntryStatus;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all border ${
        active
          ? STATUS_COLORS[status]
          : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
      }`}
    >
      {active && <Check className="inline-block mr-1 h-3 w-3" />}
      {STATUS_LABELS[status]}
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

// Removed local Skeleton in favor of MediaCardSkeleton from shared

// =====================
// Bulk Action Bar
// =====================
function BulkActionBar({
  selectedCount,
  onSetStatus,
  onSetFavorite,
  onDelete,
  onClear,
  isPending,
}: {
  selectedCount: number;
  onSetStatus: (status: EntryStatus) => void;
  onSetFavorite: (value: boolean) => void;
  onDelete: () => void;
  onClear: () => void;
  isPending: boolean;
}) {
  if (selectedCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-2 rounded-full bg-zinc-900/95 border border-white/10 px-4 py-2 shadow-xl backdrop-blur-sm">
        <span className="text-sm font-medium text-foreground pr-2 border-r border-white/10">
          {selectedCount} seleccionados
        </span>

        {/* Status dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isPending}>
              <CheckSquare className="h-4 w-4 mr-1" />
              Estado
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {ALL_STATUSES.map((status) => (
              <DropdownMenuItem key={status} onClick={() => onSetStatus(status)}>
                {STATUS_LABELS[status]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Favorite buttons */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSetFavorite(true)}
          disabled={isPending}
          title="Marcar como favoritos"
        >
          <Heart className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSetFavorite(false)}
          disabled={isPending}
          title="Quitar de favoritos"
        >
          <HeartOff className="h-4 w-4" />
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={isPending}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          title="Eliminar seleccionados"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        {/* Clear selection */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={isPending}
        >
          <X className="h-4 w-4" />
        </Button>

        {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
      </div>
    </motion.div>
  );
}

// =====================
// Selectable Library Card
// =====================
function SelectableCard({
  entry,
  selected,
  selectionMode,
  onToggleSelect,
  onOpenNotes,
}: {
  entry: LibraryEntry;
  selected: boolean;
  selectionMode: boolean;
  onToggleSelect: (id: string) => void;
  onOpenNotes: (entry: LibraryEntry) => void;
}) {
  return (
    <div className="relative group">
      {/* Selection checkbox */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleSelect(entry.id);
        }}
        className={`absolute top-2 left-2 z-20 rounded-md p-1 transition-all ${
          selectionMode || selected
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        } ${
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-black/50 text-white hover:bg-black/70"
        }`}
      >
        {selected ? (
          <CheckSquare className="h-5 w-5" />
        ) : (
          <Square className="h-5 w-5" />
        )}
      </button>

      {/* Quick actions menu */}
      <div className={`absolute top-2 right-2 z-20 ${selectionMode ? "hidden" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-md bg-black/50 p-1 text-white hover:bg-black/70">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onOpenNotes(entry)}>
              <FileText className="mr-2 h-4 w-4" />
              Editar notas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Notes indicator */}
      {entry.notes && (
        <div className="absolute bottom-16 right-2 z-10">
          <div className="rounded-full bg-primary/80 p-1" title="Tiene notas">
            <FileText className="h-3 w-3 text-white" />
          </div>
        </div>
      )}

      <div className={selected ? "ring-2 ring-primary rounded-xl" : ""}>
        <LibraryCard entry={entry} />
      </div>
    </div>
  );
}

// =====================
// Main Page Component
// =====================
export default function LibraryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Parse filters from URL
  const filters = useMemo(() => parseFiltersFromUrl(searchParams), [searchParams]);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectionMode = selectedIds.size > 0;

  // Notes modal state
  const [notesEntry, setNotesEntry] = useState<LibraryEntry | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);

  // Search input (debounced)
  const [searchInput, setSearchInput] = useState(filters.q || "");

  // Update URL when filters change
  const updateFilters = useCallback(
    (newFilters: Partial<LibraryListFilters>) => {
      const merged = { ...filters, ...newFilters };
      const params = filtersToSearchParams(merged);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [filters, pathname, router]
  );

  // Toggle status in multi-select
  const toggleStatus = useCallback(
    (status: EntryStatus) => {
      const current = Array.isArray(filters.status) ? filters.status : [];
      const newStatus = current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status];
      updateFilters({ status: newStatus.length > 0 ? newStatus : undefined });
    },
    [filters.status, updateFilters]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
    setSearchInput("");
  }, [pathname, router]);

  // Handle search submit
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      updateFilters({ q: searchInput || undefined });
    },
    [searchInput, updateFilters]
  );

  // Query
  const { data: entries, isLoading, error } = useQuery({
    queryKey: libraryKeys.list(filters),
    queryFn: () => fetchLibraryList(filters),
    staleTime: 1000 * 60 * 2,
  });

  // Bulk mutation
  const bulkMutation = useMutation({
    mutationFn: bulkUpdateEntries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
      setSelectedIds(new Set());
    },
  });

  // Selection handlers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (entries) {
      setSelectedIds(new Set(entries.map((e) => e.id)));
    }
  }, [entries]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Bulk action handlers
  const handleBulkSetStatus = useCallback(
    (status: EntryStatus) => {
      if (selectedIds.size === 0) return;
      bulkMutation.mutate({
        ids: Array.from(selectedIds),
        action: "set_status",
        value: status,
      });
    },
    [selectedIds, bulkMutation]
  );

  const handleBulkSetFavorite = useCallback(
    (value: boolean) => {
      if (selectedIds.size === 0) return;
      bulkMutation.mutate({
        ids: Array.from(selectedIds),
        action: "set_favorite",
        value,
      });
    },
    [selectedIds, bulkMutation]
  );

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    if (!confirm(`¿Eliminar ${selectedIds.size} entradas? Esta acción no se puede deshacer.`)) {
      return;
    }
    bulkMutation.mutate({
      ids: Array.from(selectedIds),
      action: "delete",
    });
  }, [selectedIds, bulkMutation]);

  // Notes modal handlers
  const openNotes = useCallback((entry: LibraryEntry) => {
    setNotesEntry(entry);
    setNotesOpen(true);
  }, []);

  // Computed
  const hasFilters = !!(
    filters.type ||
    (filters.status && filters.status.length > 0) ||
    filters.favorite ||
    filters.unrated ||
    filters.q ||
    filters.provider
  );
  const isEmpty = !isLoading && entries?.length === 0;
  const statusArray = Array.isArray(filters.status) ? filters.status : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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

        {/* Select all / clear */}
        {entries && entries.length > 0 && (
          <div className="flex items-center gap-2">
            {selectionMode ? (
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Cancelar
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={selectAll}>
                Seleccionar todo
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <GlassCard className="space-y-4 p-4">
        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por título..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 bg-white/5 border-white/10"
            />
          </div>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
          {hasFilters && (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </form>

        {/* Type filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tipo
          </span>
          {TYPES.map(({ value, label, icon: Icon }) => (
            <FilterChip
              key={value}
              active={filters.type === value || (!filters.type && value === "")}
              onClick={() => updateFilters({ type: value || undefined })}
            >
              <Icon className="mr-1.5 inline-block h-3.5 w-3.5" />
              {label}
            </FilterChip>
          ))}
        </div>

        {/* Status filters (multi-select) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Estado
          </span>
          {ALL_STATUSES.map((status) => (
            <StatusChip
              key={status}
              status={status}
              active={statusArray.includes(status)}
              onClick={() => toggleStatus(status)}
            />
          ))}
        </div>

        {/* Bottom row: special filters + sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip
              active={filters.favorite === true}
              onClick={() =>
                updateFilters({ favorite: filters.favorite ? undefined : true })
              }
            >
              ❤️ Favoritos
            </FilterChip>
            <FilterChip
              active={filters.unrated === true}
              onClick={() =>
                updateFilters({ unrated: filters.unrated ? undefined : true })
              }
            >
              <Star className="mr-1 h-3.5 w-3.5" />
              Sin rating
            </FilterChip>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Ordenar
            </span>
            {SORTS.map(({ value, label }) => (
              <FilterChip
                key={value}
                active={filters.sort === value}
                onClick={() => updateFilters({ sort: value })}
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
            <MediaCardSkeleton key={i} />
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
              <SelectableCard
                key={entry.id}
                entry={entry}
                selected={selectedIds.has(entry.id)}
                selectionMode={selectionMode}
                onToggleSelect={toggleSelect}
                onOpenNotes={openNotes}
              />
            ))}
          </LibraryGrid>
        </AnimatePresence>
      )}

      {/* Bulk action bar */}
      <AnimatePresence>
        <BulkActionBar
          selectedCount={selectedIds.size}
          onSetStatus={handleBulkSetStatus}
          onSetFavorite={handleBulkSetFavorite}
          onDelete={handleBulkDelete}
          onClear={clearSelection}
          isPending={bulkMutation.isPending}
        />
      </AnimatePresence>

      {/* Notes modal - key forces remount when entry changes */}
      <NotesModal
        key={notesEntry?.id ?? "none"}
        entry={notesEntry}
        open={notesOpen}
        onOpenChange={setNotesOpen}
      />
    </div>
  );
}
