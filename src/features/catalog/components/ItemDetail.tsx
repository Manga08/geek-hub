import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttributionFooter } from "@/components/shared/AttributionFooter";
import type { UnifiedCatalogItem } from "@/features/catalog/normalize/unified.types";

export function ItemDetail({ item }: { item: UnifiedCatalogItem }) {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_30px_120px_-80px_rgba(139,92,246,0.6)] backdrop-blur-md">
        {item.backdropUrl ? (
          <div className="relative h-48 w-full sm:h-64">
            <Image
              src={item.backdropUrl}
              alt={item.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          </div>
        ) : null}
        <div className="relative z-10 flex flex-col gap-4 p-6 sm:flex-row">
          <div className="w-full sm:w-48">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-black/40">
              {item.posterUrl ? (
                <Image src={item.posterUrl} alt={item.title} fill sizes="200px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sin imagen</div>
              )}
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {item.type}
              </Badge>
              {item.year ? <span className="text-sm text-muted-foreground/90">{item.year}</span> : null}
              <span className="text-xs uppercase tracking-wide text-muted-foreground/80">{item.provider}</span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground">{item.title}</h1>
            {item.genres.length ? (
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {item.genres.map((genre) => (
                  <Badge key={genre} variant="outline" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            ) : null}
            {item.summary ? <p className="text-sm text-muted-foreground">{item.summary}</p> : null}
            <div>
              <Button variant="default" disabled>
                Agregar a biblioteca
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AttributionFooter />
    </div>
  );
}
