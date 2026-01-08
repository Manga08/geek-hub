"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";

import { EmptyState } from "@/components/shared/EmptyState";
import { GlassCard } from "@/components/shared/GlassCard";
import { ItemDetail } from "@/features/catalog/components/ItemDetail";
import { catalogItemKey, fetchCatalogItem } from "@/features/catalog/queries";
import type { UnifiedItemType } from "@/features/catalog/normalize/unified.types";

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const contentVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function ItemSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <GlassCard className="relative overflow-hidden border-white/10 bg-white/5 p-0 backdrop-blur">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5" />
        {/* Backdrop Skeleton */}
        <div className="relative h-48 w-full bg-white/5 animate-pulse sm:h-64">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 p-4 pt-0 sm:p-6 sm:flex-row sm:pt-6">
          {/* Poster Skeleton */}
          <div className="w-36 -mt-20 mx-auto sm:mx-0 sm:mt-0 sm:w-48 shrink-0">
             <div className="aspect-[2/3] w-full rounded-xl bg-white/10 animate-pulse shadow-2xl" />
          </div>

          {/* Content Skeleton */}
          <div className="flex-1 space-y-4 pt-2">
             <div className="mx-auto h-4 w-20 rounded bg-white/10 animate-pulse sm:mx-0" />
             <div className="mx-auto h-8 w-3/4 rounded bg-white/10 animate-pulse sm:mx-0" />
             <div className="flex justify-center gap-2 sm:justify-start">
                <div className="h-5 w-16 rounded-full bg-white/10 animate-pulse" />
                <div className="h-5 w-16 rounded-full bg-white/10 animate-pulse" />
             </div>
             <div className="space-y-2 pt-2">
                <div className="h-3 w-full rounded bg-white/10 animate-pulse" />
                <div className="h-3 w-11/12 rounded bg-white/10 animate-pulse" />
                <div className="h-3 w-10/12 rounded bg-white/10 animate-pulse" />
             </div>
             <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                 <div className="h-11 w-full rounded bg-white/10 animate-pulse sm:w-32" />
                 <div className="h-11 w-full rounded bg-white/10 animate-pulse sm:w-32" />
             </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export function ItemPageClient({ type, keyParam }: { type: UnifiedItemType; keyParam: string }) {
  const prefersReducedMotion = useReducedMotion();
  const variants = prefersReducedMotion ? contentVariantsReduced : contentVariants;
  const queryKey = useMemo(() => catalogItemKey({ type, key: keyParam }), [type, keyParam]);
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => fetchCatalogItem({ type, key: keyParam }),
    staleTime: 1000 * 60 * 10,
  });

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.15 }}
        >
          <ItemSkeleton />
        </motion.div>
      ) : isError || !data ? (
        <motion.div
          key="error"
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.15 }}
        >
          <EmptyState message={error instanceof Error ? error.message : "No se pudo cargar el ítem"} />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.15 }}
          className="mx-auto max-w-5xl space-y-6"
        >
          <ItemDetail item={data} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
