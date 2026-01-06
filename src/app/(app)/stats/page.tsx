"use client";

import { useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  Star,
  Heart,
  CheckCircle,
  Trophy,
  Film,
  Tv,
  Gamepad2,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStatsSummary,
  type StatsScope,
  type StatsType,
  type StatsSummary,
} from "@/features/stats";

// =========================
// Constants
// =========================

const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];

const TYPE_OPTIONS: { value: StatsType; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "Todos", icon: Sparkles },
  { value: "movie", label: "Películas", icon: Film },
  { value: "tv", label: "Series", icon: Tv },
  { value: "anime", label: "Anime", icon: Sparkles },
  { value: "game", label: "Juegos", icon: Gamepad2 },
];

const MONTH_LABELS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

// =========================
// Filter Chip Component
// =========================

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
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
        active
          ? "bg-primary text-white shadow-lg shadow-primary/25"
          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
      )}
    >
      {children}
    </button>
  );
}

// =========================
// Stat Card Component
// =========================

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  colorClass = "text-primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  colorClass?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-white/5", colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-100">{value}</p>
          {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}

// =========================
// Monthly Bar Chart
// =========================

function MonthlyChart({ data }: { data: StatsSummary["monthly"] }) {
  const maxCompleted = Math.max(...data.map((d) => d.completedCount), 1);

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Actividad mensual</h3>
      <div className="space-y-2">
        {data.map((month) => (
          <div key={month.month} className="flex items-center gap-3">
            <span className="w-8 text-xs text-gray-500">{MONTH_LABELS[month.month - 1]}</span>
            <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                style={{ width: `${(month.completedCount / maxCompleted) * 100}%` }}
              />
            </div>
            <span className="w-8 text-xs text-gray-400 text-right">
              {month.completedCount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================
// Top Rated List
// =========================

function TopRatedList({ entries }: { entries: StatsSummary["topRated"] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Mejor puntuados</h3>
        <p className="text-gray-500 text-sm">Sin valoraciones aún</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Mejor puntuados</h3>
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div key={entry.id} className="flex items-center gap-3">
            <span className="w-6 text-center text-lg font-bold text-gray-500">
              {index + 1}
            </span>
            {entry.poster_url ? (
              <Image
                src={entry.poster_url}
                alt=""
                width={40}
                height={60}
                className="rounded-md object-cover"
              />
            ) : (
              <div className="w-10 h-15 rounded-md bg-gray-700 flex items-center justify-center">
                <Film className="h-4 w-4 text-gray-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 truncate">{entry.title ?? "Sin título"}</p>
              <p className="text-xs text-gray-500 capitalize">{entry.type}</p>
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="h-4 w-4 fill-amber-400" />
              <span className="font-semibold">{entry.rating}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================
// Leaderboard (Group Scope)
// =========================

function Leaderboard({ members }: { members: StatsSummary["members"] }) {
  if (members.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-gray-300">Leaderboard</h3>
      </div>
      <div className="space-y-3">
        {members.map((member, index) => (
          <div key={member.user_id} className="flex items-center gap-3">
            <span className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
              index === 0 ? "bg-amber-500/20 text-amber-400" :
              index === 1 ? "bg-gray-400/20 text-gray-400" :
              index === 2 ? "bg-orange-500/20 text-orange-400" :
              "bg-white/5 text-gray-500"
            )}>
              {index + 1}
            </span>
            {member.avatar_url ? (
              <Image
                src={member.avatar_url}
                alt=""
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 truncate">
                {member.display_name ?? "Usuario"}
              </p>
              <p className="text-xs text-gray-500">
                {member.completedCount} completados
              </p>
            </div>
            {member.avgRating !== null && (
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="h-3 w-3 fill-amber-400" />
                <span className="text-sm">{member.avgRating}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================
// Empty State
// =========================

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-gray-900/30 p-12 text-center">
      <BarChart3 className="h-12 w-12 mx-auto text-gray-600 mb-4" />
      <h3 className="text-lg font-semibold text-gray-300 mb-2">Sin datos</h3>
      <p className="text-gray-500 text-sm">
        No hay entradas en la biblioteca para estos filtros.
        <br />
        Agrega items desde el catálogo para ver estadísticas.
      </p>
    </div>
  );
}

// =========================
// Stats Content
// =========================

function StatsContent({ data }: { data: StatsSummary }) {
  const { totals, monthly, topRated, members, scope } = data;

  if (totals.totalEntries === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Film}
          label="Total"
          value={totals.totalEntries}
          colorClass="text-blue-400"
        />
        <StatCard
          icon={CheckCircle}
          label="Completados"
          value={totals.byStatus.completed}
          colorClass="text-emerald-400"
        />
        <StatCard
          icon={Star}
          label="Promedio"
          value={totals.avgRating !== null ? `${totals.avgRating}/10` : "—"}
          subtext={`${totals.ratedCount} valorados`}
          colorClass="text-amber-400"
        />
        <StatCard
          icon={Heart}
          label="Favoritos"
          value={totals.favoritesCount}
          colorClass="text-red-400"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Chart */}
        <MonthlyChart data={monthly} />

        {/* Top Rated */}
        <TopRatedList entries={topRated} />
      </div>

      {/* Leaderboard (only for group scope) */}
      {scope === "group" && members.length > 0 && (
        <Leaderboard members={members} />
      )}

      {/* Type Distribution */}
      <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Por tipo</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(["movie", "tv", "anime", "game"] as const).map((type) => {
            const TypeIcon = TYPE_OPTIONS.find((t) => t.value === type)?.icon ?? Film;
            return (
              <div key={type} className="text-center">
                <TypeIcon className="h-8 w-8 mx-auto text-gray-500 mb-2" />
                <p className="text-2xl font-bold text-gray-200">{totals.byType[type]}</p>
                <p className="text-xs text-gray-500 capitalize">{type === "tv" ? "Series" : type === "movie" ? "Películas" : type}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =========================
// Main Page Component
// =========================

export default function StatsPage() {
  const [scope, setScope] = useState<StatsScope>("mine");
  const [year, setYear] = useState(currentYear);
  const [type, setType] = useState<StatsType>("all");

  const { data, isLoading, isError, error } = useStatsSummary({ scope, year, type });

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Estadísticas
        </h1>
        <p className="text-gray-400 mt-1">
          Resumen de tu actividad en la biblioteca
        </p>
      </header>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Scope */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 mr-2">Alcance:</span>
          <FilterChip active={scope === "mine"} onClick={() => setScope("mine")}>
            <User className="h-3.5 w-3.5 inline mr-1" />
            Mis stats
          </FilterChip>
          <FilterChip active={scope === "group"} onClick={() => setScope("group")}>
            <Users className="h-3.5 w-3.5 inline mr-1" />
            Grupo
          </FilterChip>
        </div>

        {/* Year & Type */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Año:</span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Tipo:</span>
            {TYPE_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                active={type === opt.value}
                onClick={() => setType(opt.value)}
              >
                {opt.label}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-gray-900/50 p-4 animate-pulse">
                <div className="h-12 bg-gray-700 rounded" />
              </div>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4 h-80 animate-pulse" />
            <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4 h-80 animate-pulse" />
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">{error?.message ?? "Error al cargar estadísticas"}</p>
        </div>
      ) : data ? (
        <StatsContent data={data} />
      ) : null}
    </div>
  );
}
