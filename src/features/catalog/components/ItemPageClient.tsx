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
      <GlassCard className="relative overflow-hidden border-white/10 bg-white/5 p-4 sm:p-6 backdrop-blur">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5" />
        <div className="grid gap-6 md:grid-cols-[240px,1fr]">
          <div className="aspect-[2/3] w-full animate-pulse rounded-xl bg-white/10" />
          <div className="space-y-4">
            <div className="h-4 w-20 animate-pulse rounded-full bg-white/10" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-6 w-16 animate-pulse rounded-full bg-white/10" />
              ))}
            </div>
            <div className="space-y-3">
              <div className="h-3 w-full animate-pulse rounded bg-white/10" />
              <div className="h-3 w-11/12 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-10/12 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-9/12 animate-pulse rounded bg-white/10" />
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
