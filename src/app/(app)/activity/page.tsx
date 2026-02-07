"use client";

import { useEffect, useRef } from "react";
import { Activity, RefreshCw, ChevronDown, CalendarClock, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  useActivityFeed,
  flattenActivityEvents,
  getEventDescription,
  ENTITY_ICONS,
  useMarkActivityRead,
  useActivityRealtime,
  type ActivityEvent,
} from "@/features/activity";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// =========================
// Link Helper
// =========================

function getEventTarget(event: ActivityEvent): { url: string | null; label: string | null } {
  const { event_type, metadata } = event;

  // Library Item
  if (
    event_type.startsWith("library_entry_") &&
    metadata.item_type &&
    metadata.provider &&
    metadata.external_id
  ) {
    return {
      url: `/item/${metadata.item_type}/${metadata.provider}-${metadata.external_id}`,
      label: metadata.item_title ?? "Item",
    };
  }

  // List
  if (event_type.startsWith("list_") && metadata.list_id) {
    return {
      url: `/lists/${metadata.list_id}`,
      label: metadata.list_name ?? metadata.name ?? "Lista",
    };
  }

  // List Item (Link to List usually, or Item if we prefer)
  // Let's link to the specific list
  if (event_type.startsWith("list_item_") && metadata.list_id) {
    return {
      url: `/lists/${metadata.list_id}`,
      label: metadata.list_name ?? "Lista",
    };
  }

  return { url: null, label: null };
}

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

function ActivityEventItem({ event }: { event: ActivityEvent }) {
  const description = getEventDescription(event);
  const icon = ENTITY_ICONS[event.entity_type];
  const timeAgo = getRelativeTime(event.created_at);
  const { url: targetUrl } = getEventTarget(event);

  const avatar = event.profiles?.avatar_url;
  const displayName = event.profiles?.display_name ?? "Usuario";
  const initials = displayName[0].toUpperCase();

  const Content = (
    <div className="flex items-start gap-4 p-4 transition-colors hover:bg-white/5 relative">
      {/* Avatar */}
      <div className="relative shrink-0 mt-0.5">
        {avatar ? (
          <Image
            src={avatar}
            alt={`Avatar de ${displayName}`}
            width={40}
            height={40}
            className="rounded-full ring-2 ring-transparent group-hover:ring-white/10 transition-all"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-sm font-semibold text-indigo-200 ring-1 ring-white/10">
            {initials}
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background ring-2 ring-background text-[10px] text-muted-foreground shadow-sm">
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm leading-relaxed text-foreground/90">
          {description.startsWith(displayName) ? (
            <>
              <span className="font-medium text-foreground">{displayName}</span>
              {" "}
              {description.slice(displayName.length).trimStart()}
            </>
          ) : (
            description
          )}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarClock className="h-3 w-3" />
          <time dateTime={event.created_at}>{timeAgo}</time>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group"
    >
      {targetUrl ? (
        <Link href={targetUrl} className="block outline-none focus-visible:bg-white/5 rounded-lg active:scale-[0.99] transition-transform">
          {Content}
        </Link>
      ) : (
        Content
      )}
    </motion.div>
  );
}

// =========================
// Loading Skeleton
// =========================

function ActivitySkeleton() {
  return (
    <div className="p-4 flex items-start gap-4">
      <div className="h-10 w-10 shrink-0 rounded-full bg-white/5 animate-pulse" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-3/4 rounded bg-white/5 animate-pulse" />
        <div className="h-3 w-1/4 rounded bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}

// =========================
// Activity Feed Page
// =========================

export default function ActivityPage() {
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
  const { mutate: markRead } = useMarkActivityRead();

  // Subscribe to real-time updates
  useActivityRealtime({ ignoreOwnEvents: true });

  // Mark read on mount — use ref to prevent duplicate calls
  const hasMarkedRead = useRef(false);
  useEffect(() => {
    if (!hasMarkedRead.current) {
      hasMarkedRead.current = true;
      markRead();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            Actividad
          </h1>
          <p className="text-sm text-muted-foreground">
            Últimos eventos y actualizaciones de tu grupo
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="text-muted-foreground hover:text-foreground transition-all"
          aria-label="Actualizar actividad"
        >
          <RefreshCw className={cn("h-5 w-5", isRefetching && "animate-spin")} />
        </Button>
      </header>

      {/* Feed Content */}
      <GlassCard className="min-h-[400px] overflow-hidden rounded-xl border-white/10">
        {isLoading ? (
          <div className="divide-y divide-white/5">
            {Array.from({ length: 5 }).map((_, i) => (
              <ActivitySkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <Activity className="h-12 w-12 text-destructive/50 mb-4" />
            <p className="font-medium text-destructive">Error al cargar actividad</p>
            <p className="text-sm opacity-80 mb-4">{(error as Error).message}</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
             <div className="rounded-full bg-white/5 p-4 mb-4 ring-1 ring-white/10">
                <Activity className="h-8 w-8 text-muted-foreground" />
             </div>
             <h3 className="text-lg font-medium text-foreground">Sin actividad reciente</h3>
             <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2 mb-6">
               Parece que tu grupo está tranquilo. ¡Añade algo a la biblioteca para empezar!
             </p>
             <Button asChild>
               <Link href="/search">
                 <Search className="mr-2 h-4 w-4" />
                 Explorar Catálogo
               </Link>
             </Button>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="divide-y divide-white/5"
          >
            <AnimatePresence mode="popLayout">
              {events.map((event) => (
                <ActivityEventItem key={event.id} event={event} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </GlassCard>

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            {isFetchingNextPage ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {isFetchingNextPage ? "Cargando más..." : "Cargar anteriores"}
          </Button>
        </div>
      )}
    </div>
  );
}
