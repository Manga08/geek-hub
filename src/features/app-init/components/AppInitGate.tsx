"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppInit } from "../hooks";
import { profileKeys } from "@/features/profile/queries";
import { groupKeys } from "@/features/groups/queries";
import { activityKeys } from "@/features/activity/queries";

// =========================
// Loading Skeleton
// =========================

function InitSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar skeleton */}
      <header className="sticky top-0 z-50 h-14 border-b border-white/10 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
          <div className="h-6 w-24 animate-pulse rounded bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
            <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      </header>
      {/* Main content skeleton */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-white/10" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// =========================
// Error State
// =========================

function InitError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-lg text-muted-foreground mb-4">
          Error al cargar la aplicación
        </p>
        <button
          onClick={onRetry}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

// =========================
// App Init Gate Component
// =========================

interface AppInitGateProps {
  children: React.ReactNode;
}

export function AppInitGate({ children }: AppInitGateProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useAppInit();
  const [seeded, setSeeded] = React.useState(false);

  // Seed cache when data arrives
  React.useEffect(() => {
    if (!data || seeded) return;

    const groupId = data.currentGroup?.group.id ?? null;

    // Seed profile cache
    queryClient.setQueryData(profileKeys.current(), data.profile);

    // Seed groups list cache
    queryClient.setQueryData(groupKeys.list(), data.groupsList);

    // Seed current group cache (if exists)
    if (data.currentGroup) {
      queryClient.setQueryData(groupKeys.current(), data.currentGroup);
    }

    // Seed activity caches (if group exists)
    if (groupId) {
      // Unread count
      queryClient.setQueryData(activityKeys.unread(groupId), {
        count: data.unreadCount,
      });

      // Activity feed (InfiniteQuery shape)
      queryClient.setQueryData(activityKeys.feed(groupId), {
        pages: [data.activityFeed],
        pageParams: [null],
      });
    }

    setSeeded(true);
  }, [data, seeded, queryClient]);

  // Show loading skeleton
  if (isLoading) {
    return <InitSkeleton />;
  }

  // Show error state
  if (isError) {
    return <InitError onRetry={() => refetch()} />;
  }

  // Wait for cache to be seeded before rendering children
  if (!seeded) {
    return <InitSkeleton />;
  }

  return <>{children}</>;
}
