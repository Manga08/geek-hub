import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import type { UnifiedCatalogItem } from "@/features/catalog/normalize/unified.types";

function typeLabel(type: UnifiedCatalogItem["type"]): string {
  return type;
}

export function MediaCard({ item }: { item: UnifiedCatalogItem }) {
  const href = `/item/${item.type}/${item.key}`;

  return (
    <Link href={href} className="block h-full">
      <GlassCard
        variant="clickable"
        className="group h-full overflow-hidden border-white/10 transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:border-white/15 motion-safe:animate-[fadeUp_160ms_ease-out]"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden">
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
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-70" aria-hidden>
            <div className="absolute inset-y-0 left-1/4 w-1/2 bg-gradient-to-r from-transparent via-white/12 to-transparent rotate-12" />
          </div>
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
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="border-white/20 bg-white/5 px-2 py-1 text-[11px] font-medium capitalize text-foreground/90">
              {typeLabel(item.type)}
            </Badge>
            {item.year ? <span className="text-xs text-muted-foreground/80">{item.year}</span> : null}
          </div>
          <p className="line-clamp-2 text-sm font-semibold text-foreground">{item.title}</p>
        </div>
      </GlassCard>
    </Link>
  );
}
