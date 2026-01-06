"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Home,
  Search,
  ListChecks,
  Users,
  Star,
  Trophy,
  TrendingUp,
  Clock,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useStatsSummary } from "@/features/stats";
import { useActivityFeed, flattenActivityEvents, getEventDescription, ENTITY_ICONS } from "@/features/activity";
import { useProfile } from "@/features/profile";
import { useCurrentGroup, useGroupMembers } from "@/features/groups";
import { fetchLists } from "@/features/lists/queries";
import { fetchLibraryList } from "@/features/library/queries";
import { useQuery } from "@tanstack/react-query";
import { OnboardingChecklist } from "./onboarding-checklist";

const currentYear = new Date().getFullYear();

// =========================
// Helper: Relative time
// =========================
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "ahora";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

// =========================
// Stats Summary Card
// =========================
function StatsSummaryCard() {
  const { data: mineStats, isLoading: loadingMine } = useStatsSummary({
    scope: "mine",
    year: currentYear,
    type: "all",
  });

  const { data: groupStats, isLoading: loadingGroup } = useStatsSummary({
    scope: "group",
    year: currentYear,
    type: "all",
  });

  const isLoading = loadingMine || loadingGroup;

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Resumen {currentYear}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mine" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="mine">Míos</TabsTrigger>
            <TabsTrigger value="group">Grupo</TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="mt-4">
            {isLoading ? (
              <StatsSkeletons />
            ) : mineStats ? (
              <StatsGrid stats={mineStats.totals} />
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            )}
          </TabsContent>

          <TabsContent value="group" className="mt-4">
            {isLoading ? (
              <StatsSkeletons />
            ) : groupStats ? (
              <StatsGrid stats={groupStats.totals} />
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function StatsGrid({ stats }: { stats: { totalEntries: number; favoritesCount: number; avgRating: number | null; byStatus: Record<string, number> } }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-lg bg-white/5 p-3 text-center">
        <p className="text-2xl font-bold text-primary">{stats.totalEntries}</p>
        <p className="text-xs text-muted-foreground">Total items</p>
      </div>
      <div className="rounded-lg bg-white/5 p-3 text-center">
        <p className="text-2xl font-bold text-emerald-400">{stats.byStatus.completed ?? 0}</p>
        <p className="text-xs text-muted-foreground">Completados</p>
      </div>
      <div className="rounded-lg bg-white/5 p-3 text-center">
        <p className="text-2xl font-bold text-amber-400">{stats.favoritesCount}</p>
        <p className="text-xs text-muted-foreground">Favoritos</p>
      </div>
      <div className="rounded-lg bg-white/5 p-3 text-center">
        <p className="text-2xl font-bold text-sky-400">
          {stats.avgRating !== null ? stats.avgRating.toFixed(1) : "—"}
        </p>
        <p className="text-xs text-muted-foreground">Rating promedio</p>
      </div>
    </div>
  );
}

function StatsSkeletons() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-20 rounded-lg" />
      ))}
    </div>
  );
}

// =========================
// Top Rated Card
// =========================
function TopRatedCard() {
  const { data: mineStats, isLoading: loadingMine } = useStatsSummary({
    scope: "mine",
    year: currentYear,
    type: "all",
  });

  const { data: groupStats, isLoading: loadingGroup } = useStatsSummary({
    scope: "group",
    year: currentYear,
    type: "all",
  });

  const isLoading = loadingMine || loadingGroup;

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-amber-400" />
          Top Rated
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mine" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="mine">Míos</TabsTrigger>
            <TabsTrigger value="group">Grupo</TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="mt-4">
            {isLoading ? (
              <TopRatedSkeletons />
            ) : mineStats?.topRated.length ? (
              <TopRatedList items={mineStats.topRated.slice(0, 5)} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin items valorados
              </p>
            )}
          </TabsContent>

          <TabsContent value="group" className="mt-4">
            {isLoading ? (
              <TopRatedSkeletons />
            ) : groupStats?.topRated.length ? (
              <TopRatedList items={groupStats.topRated.slice(0, 5)} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin items valorados
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function TopRatedList({ items }: { items: Array<{ id: string; title: string | null; rating: number; poster_url: string | null; type: string }> }) {
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-lg bg-white/5 p-2"
        >
          <span className="text-sm font-bold text-muted-foreground w-4">
            {idx + 1}
          </span>
          {item.poster_url ? (
            <Image
              src={item.poster_url}
              alt=""
              width={32}
              height={48}
              className="rounded object-cover"
            />
          ) : (
            <div className="w-8 h-12 rounded bg-white/10" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {item.title ?? "Sin título"}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold">{item.rating}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TopRatedSkeletons() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-14 rounded-lg" />
      ))}
    </div>
  );
}

// =========================
// Recent Activity Card
// =========================
function RecentActivityCard() {
  const { data: feedData, isLoading } = useActivityFeed({ limit: 8, enabled: true });
  const events = flattenActivityEvents(feedData?.pages).slice(0, 8);

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-sky-400" />
          Actividad reciente
        </CardTitle>
        <Link
          href="/activity"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          Ver todo <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Sin actividad reciente
          </p>
        ) : (
          <div className="space-y-1">
            {events.map((event) => {
              const Icon = ENTITY_ICONS[event.entity_type] || Clock;
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-lg p-2 hover:bg-white/5 transition-colors"
                >
                  {event.profiles?.avatar_url ? (
                    <Image
                      src={event.profiles.avatar_url}
                      alt=""
                      width={28}
                      height={28}
                      className="rounded-full shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-tight">
                      <span className="font-medium">
                        {event.profiles?.display_name ?? "Usuario"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {getEventDescription(event)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getRelativeTime(event.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =========================
// Quick Actions Card
// =========================
function QuickActionsCard() {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Home className="h-5 w-5 text-primary" />
          Acciones rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Link
          href="/search"
          className="flex items-center gap-3 rounded-lg bg-linear-to-r from-primary/20 to-primary/5 p-3 hover:from-primary/30 hover:to-primary/10 transition-colors"
        >
          <Search className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Buscar y agregar</p>
            <p className="text-xs text-muted-foreground">
              Películas, series, anime, juegos
            </p>
          </div>
          <ChevronRight className="h-5 w-5 ml-auto text-muted-foreground" />
        </Link>

        <Link
          href="/lists"
          className="flex items-center gap-3 rounded-lg bg-white/5 p-3 hover:bg-white/10 transition-colors"
        >
          <ListChecks className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="font-medium">Crear lista</p>
            <p className="text-xs text-muted-foreground">
              Organiza tu contenido favorito
            </p>
          </div>
          <ChevronRight className="h-5 w-5 ml-auto text-muted-foreground" />
        </Link>

        <Link
          href="/settings/group"
          className="flex items-center gap-3 rounded-lg bg-white/5 p-3 hover:bg-white/10 transition-colors"
        >
          <Users className="h-5 w-5 text-sky-400" />
          <div>
            <p className="font-medium">Invitar al grupo</p>
            <p className="text-xs text-muted-foreground">
              Comparte con tu pareja o amigos
            </p>
          </div>
          <ChevronRight className="h-5 w-5 ml-auto text-muted-foreground" />
        </Link>
      </CardContent>
    </Card>
  );
}

// =========================
// Dashboard Page
// =========================
export default function DashboardPage() {
  const { data: profile } = useProfile();
  const { data: currentGroup } = useCurrentGroup();
  const groupId = currentGroup?.group?.id;

  // For onboarding checklist
  const { data: members } = useGroupMembers(groupId);
  const { data: lists } = useQuery({
    queryKey: ["lists", "count"],
    queryFn: fetchLists,
  });
  const { data: libraryEntries } = useQuery({
    queryKey: ["library", "count"],
    queryFn: () => fetchLibraryList({}),
  });

  const onboardingData = {
    hasDisplayName: !!profile?.display_name,
    hasAvatar: !!profile?.avatar_url,
    memberCount: members?.length ?? 1,
    libraryCount: libraryEntries?.length ?? 0,
    listsCount: lists?.length ?? 0,
  };

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {profile?.display_name
              ? `¡Hola, ${profile.display_name}!`
              : "¡Bienvenido a GeekHub!"}
          </h1>
          <p className="text-muted-foreground">
            Tu centro de entretenimiento compartido
          </p>
        </div>
      </div>

      {/* Onboarding Checklist (shows when incomplete) */}
      <OnboardingChecklist data={onboardingData} />

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Stats Summary */}
        <div className="lg:col-span-1">
          <StatsSummaryCard />
        </div>

        {/* Top Rated */}
        <div className="lg:col-span-1">
          <TopRatedCard />
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <QuickActionsCard />
        </div>
      </div>

      {/* Activity Feed (full width) */}
      <RecentActivityCard />
    </div>
  );
}
