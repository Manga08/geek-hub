"use client";

import { useEffect } from "react";
import { Activity, RefreshCw, ChevronDown, User } from "lucide-react";
import Image from "next/image";
import {
  useActivityFeed,
  flattenActivityEvents,
  getEventDescription,
  ENTITY_ICONS,
  useMarkActivityRead,
  useActivityRealtime,
  type ActivityEvent,
} from "@/features/activity";

// =========================
// Relative Time Helper
// =========================

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "hace unos segundos";
  if (diffMins < 60) return `hace ${diffMins} ${diffMins === 1 ? "minuto" : "minutos"}`;
  if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
  if (diffDays < 7) return `hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
  
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

// =========================
// Activity Event Card
// =========================

function ActivityEventCard({ event }: { event: ActivityEvent }) {
  const description = getEventDescription(event);
  const icon = ENTITY_ICONS[event.entity_type];
  const timeAgo = getRelativeTime(event.created_at);

  const avatar = event.profiles?.avatar_url;
  const initials = (event.profiles?.display_name ?? "U")[0].toUpperCase();

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-800 last:border-0">
      {/* Avatar */}
      <div className="shrink-0">
        {avatar ? (
          <Image
            src={avatar}
            alt=""
            width={36}
            height={36}
            className="rounded-full"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-300">
            {initials}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>
            {icon}
          </span>
          <p className="text-sm text-gray-200">{description}</p>
        </div>
        <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
      </div>
    </div>
  );
}

// =========================
// Activity Feed
// =========================

function ActivityFeed() {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useActivityFeed({ limit: 20 });

  const events = flattenActivityEvents(data?.pages);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
        <p className="text-gray-500 mt-2">Cargando actividad...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error?.message ?? "Error al cargar"}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 text-sm text-cyan-400 hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-gray-700 rounded-lg">
        <User className="w-10 h-10 mx-auto text-gray-600" />
        <p className="text-gray-400 mt-3">No hay actividad todavía</p>
        <p className="text-gray-500 text-sm mt-1">
          Las acciones del grupo aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Refresh button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="text-sm text-gray-400 hover:text-gray-200 flex items-center gap-1 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
          />
          Actualizar
        </button>
      </div>

      {/* Events list */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 px-4">
        {events.map((event) => (
          <ActivityEventCard key={event.id} event={event} />
        ))}
      </div>

      {/* Load more */}
      {hasNextPage && (
        <div className="text-center pt-4">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-50"
          >
            {isFetchingNextPage ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Cargar más
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// =========================
// Page Component
// =========================

export default function ActivityPage() {
  const { mutate: markRead } = useMarkActivityRead();

  // Subscribe to realtime updates
  useActivityRealtime();

  // Mark as read when the page is mounted
  useEffect(() => {
    markRead();
  }, [markRead]);

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <Activity className="w-6 h-6 text-cyan-400" />
          Actividad del Grupo
        </h1>
        <p className="text-gray-400 mt-1">
          Historial de acciones recientes en tu grupo
        </p>
      </header>

      <ActivityFeed />
    </div>
  );
}
