"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { catalogItemKey, fetchCatalogItem } from "@/features/catalog/queries";
import { EntryQuickActions } from "@/features/library/components";
import type { UnifiedCatalogItem } from "@/features/catalog/normalize/unified.types";

// Tiny 1x1 transparent placeholder for blur effect
const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const cardVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  hover: { y: -3, scale: 1.012 },
  tap: { scale: 0.988 },
};

const cardVariantsReduced: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  hover: {},
  tap: {},
};

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

  return (
    <Link
      href={href}
      className="block h-full"
      onMouseEnter={prefetchItem}
      onFocus={prefetchItem}
      onPointerDown={prefetchItem}
    >
      <motion.article
        variants={variants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="group relative h-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)_inset] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_20px_60px_-20px_rgba(139,92,246,0.5),0_0_0_1px_rgba(255,255,255,0.08)_inset] hover:border-white/15"
      >
        {/* Image area */}
        <div className={`relative w-full overflow-hidden ${mediaAspect}`}>
          {item.posterUrl ? (
            <Image
              src={item.posterUrl}
              alt={item.title}
              fill
              quality={85}
              sizes="(min-width:1280px) 18vw, (min-width:1024px) 22vw, (min-width:768px) 30vw, 45vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              priority={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-white/5 via-white/[0.02] to-black/20 text-sm text-muted-foreground/60">
              Sin imagen
            </div>
          )}

          {/* Gradient overlay for readability */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Animated shine on hover */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/8 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
          </div>

          {/* Quick actions */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 translate-y-1 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            <EntryQuickActions
              itemType={item.type}
              provider={item.provider}
              externalId={item.externalId}
              title={item.title}
              posterUrl={item.posterUrl}
              className="flex items-center gap-1.5"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 rounded-full border border-white/20 bg-black/50 text-white/80 backdrop-blur-sm hover:bg-black/70 hover:text-white"
              onClick={(e) => e.preventDefault()}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Game overlay info (title on image) */}
          {isGame && (
            <div className="absolute inset-x-0 bottom-0 p-3">
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <Badge
                    variant="outline"
                    className="border-white/30 bg-black/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/90 backdrop-blur-sm"
                  >
                    {typeLabel(item.type)}
                  </Badge>
                  <p className="line-clamp-2 text-sm font-semibold leading-tight text-white drop-shadow-md">
                    {item.title}
                  </p>
                </div>
                {item.year && (
                  <span className="shrink-0 text-xs font-medium text-white/70 drop-shadow">
                    {item.year}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Movie/TV/Anime info below image */}
        {!isGame && (
          <div className="space-y-2 p-3">
            <div className="flex items-center justify-between gap-2">
              <Badge
                variant="outline"
                className="border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground/80"
              >
                {typeLabel(item.type)}
              </Badge>
              {item.year && (
                <span className="text-xs text-muted-foreground/70">{item.year}</span>
              )}
            </div>
            <p className="line-clamp-2 text-sm font-medium leading-tight text-foreground/90">
              {item.title}
            </p>
          </div>
        )}

        {/* Bookmark indicator */}
        <div className="absolute top-0 left-3 h-6 w-5 bg-gradient-to-b from-primary/80 to-primary opacity-0 transition-opacity group-hover:opacity-0 [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)]" />
      </motion.article>
    </Link>
  );
}
