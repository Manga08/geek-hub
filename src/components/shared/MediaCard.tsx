"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bookmark, Heart, Plus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import { catalogItemKey, fetchCatalogItem } from "@/features/catalog/queries";
import type { UnifiedCatalogItem } from "@/features/catalog/normalize/unified.types";

function typeLabel(type: UnifiedCatalogItem["type"]): string {
  return type;
}

export function MediaCard({ item }: { item: UnifiedCatalogItem }) {
  const href = `/item/${item.type}/${item.key}`;
  const isGame = item.type === "game";
  const prefersReducedMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const prefetchedRef = useRef(false);

  const mediaAspect = isGame ? "aspect-[16/9]" : "aspect-[2/3]";

  const prefetchItem = useCallback(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    queryClient
      .prefetchQuery({
        queryKey: catalogItemKey({ type: item.type, key: item.key }),
        queryFn: () => fetchCatalogItem({ type: item.type, key: item.key }),
        staleTime: 1000 * 60 * 10,
      })
      .catch(() => {
        prefetchedRef.current = false;
      });
  }, [item.key, item.type, queryClient]);

  const motionProps = useMemo<Record<string, unknown>>(
    () =>
      prefersReducedMotion
        ? {}
        : {
            initial: { opacity: 0, y: 12 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.22, ease: "easeOut" },
            whileHover: { y: -4, scale: 1.015 },
            whileTap: { scale: 0.985 },
          },
    [prefersReducedMotion],
  );

  return (
    <Link href={href} className="block h-full" onMouseEnter={prefetchItem} onFocus={prefetchItem}>
      <motion.div {...motionProps} className="h-full">
        <GlassCard
          variant="clickable"
          className="group relative h-full overflow-hidden border-white/10 shadow-[0_25px_90px_-70px_rgba(139,92,246,0.65)] transition-colors duration-200 hover:border-white/20"
        >
          <div className={`relative w-full overflow-hidden ${mediaAspect}`}>
            {item.posterUrl ? (
              <Image
                src={item.posterUrl}
                alt={item.title}
                fill
                quality={90}
                sizes="(min-width:1280px) 18vw, (min-width:1024px) 22vw, (min-width:768px) 30vw, 45vw"
                className="object-cover"
                priority={false}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-b from-white/5 to-black/30 text-sm text-muted-foreground">Sin imagen</div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-black/25 to-black/70" />
            <motion.div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-60"
              aria-hidden
            >
              <motion.div
                className="absolute inset-y-0 left-[-30%] w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/12 to-transparent"
                initial={{ x: "-30%" }}
                animate={prefersReducedMotion ? undefined : { x: "120%" }}
                transition={prefersReducedMotion ? undefined : { repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
              />
            </motion.div>
            {isGame ? (
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-3">
                <div className="space-y-1">
                  <Badge variant="outline" className="border-white/30 bg-black/30 px-2 py-1 text-[11px] font-medium capitalize text-foreground/90">
                    {typeLabel(item.type)}
                  </Badge>
                  <p className="line-clamp-2 text-sm font-semibold text-white drop-shadow">{item.title}</p>
                </div>
                {item.year ? <span className="text-xs text-white/80 drop-shadow">{item.year}</span> : null}
              </div>
            ) : null}
            <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
              <Button variant="ghost" size="icon-sm" className="border border-white/10 bg-black/40 text-foreground/80 hover:border-white/20 hover:bg-black/60">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" className="border border-white/10 bg-black/40 text-foreground/80 hover:border-white/20 hover:bg-black/60">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" className="border border-white/10 bg-black/40 text-foreground/80 hover:border-white/20 hover:bg-black/60">
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2 p-3">
            {!isGame ? (
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="border-white/20 bg-white/5 px-2 py-1 text-[11px] font-medium capitalize text-foreground/90">
                  {typeLabel(item.type)}
                </Badge>
                {item.year ? <span className="text-xs text-muted-foreground/80">{item.year}</span> : null}
              </div>
            ) : null}
            {!isGame ? <p className="line-clamp-2 text-sm font-semibold text-foreground">{item.title}</p> : null}
          </div>
        </GlassCard>
      </motion.div>
    </Link>
  );
}
