"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { catalogItemKey, fetchCatalogItem } from "@/features/catalog/queries";
import { EntryQuickActions } from "@/features/library/components";
import { MediaPosterFrame } from "./MediaPosterFrame";
import type { UnifiedCatalogItem } from "@/features/catalog/normalize/unified.types";
import type { LibraryEntryLookup } from "@/features/library/queries";

const cardVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  hover: { y: -4, transition: { duration: 0.2 } },
  tap: { scale: 0.98 },
};

const cardVariantsReduced: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  hover: {},
  tap: {},
};

function typeLabel(type: UnifiedCatalogItem["type"]): string {
  switch (type) {
    case "movie": return "Película";
    case "tv": return "Serie";
    case "game": return "Juego";
    case "anime": return "Anime";
    default: return type;
  }
}

interface MediaCardProps {
  item: UnifiedCatalogItem;
  /** Pre-fetched entry from batch lookup (null = not in library, undefined = use individual fetch) */
  prefetchedEntry?: LibraryEntryLookup | null;
  /** Loading state from batch lookup */
  prefetchedLoading?: boolean;
}

export function MediaCard({ item, prefetchedEntry, prefetchedLoading }: MediaCardProps) {
  const href = `/item/${item.type}/${item.key}`;
  const prefersReducedMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const prefetchedRef = useRef(false);

  const variants = prefersReducedMotion ? cardVariantsReduced : cardVariants;

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

  const year = item.year;

  return (
    <motion.article
      variants={variants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      className="group relative h-full flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-sm transition-colors hover:border-white/20 hover:bg-white/5"
      onMouseEnter={prefetchItem}
      onFocus={prefetchItem}
      onPointerDown={prefetchItem}
    >
      <Link href={href} className="relative block w-full outline-none">
        <MediaPosterFrame
          src={item.posterUrl}
          alt={item.title}
          type={item.type}
        >
          {/* Top Badge */}
          <div className="absolute left-2 top-2 z-10">
            <Badge 
              variant="secondary" 
              className="px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider opacity-80 backdrop-blur-md transition-opacity group-hover:opacity-100"
            >
              {typeLabel(item.type)}
            </Badge>
          </div>

          {/* Quick actions overlay - Top Right */}
          <div className="absolute right-2 top-2 z-10 flex translate-y-[-10px] items-center gap-1.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
             <div onClick={(e) => e.preventDefault()}> 
               {/* Wrap in div to catch preventDefault correctly if button inside doesn't */}
                <EntryQuickActions
                  itemType={item.type}
                  provider={item.provider}
                  externalId={item.externalId}
                  title={item.title}
                  posterUrl={item.posterUrl}
                  className="flex items-center gap-1.5"
                  prefetchedEntry={prefetchedEntry}
                  prefetchedLoading={prefetchedLoading}
                />
             </div>
          </div>
        </MediaPosterFrame>

        {/* Content Footer */}
        <div className="flex flex-1 flex-col gap-1 p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-medium leading-tight text-foreground/90 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            {item.rating && item.rating > 0 && (
               <span className="shrink-0 text-[10px] font-bold text-yellow-500/90 pt-0.5">
                 ★ {item.rating.toFixed(1)}
               </span>
            )}
          </div>
          
          {year && (
            <p className="text-[11px] text-muted-foreground font-medium">
              {year}
            </p>
          )}
        </div>
      </Link>
    </motion.article>
  );
}
