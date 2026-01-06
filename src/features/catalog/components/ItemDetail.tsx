"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, Plus, Loader2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttributionFooter } from "@/components/shared/AttributionFooter";
import { EntryDialog, OurRatingsPanel } from "@/features/library/components";
import { useLibraryEntry, STATUS_LABELS, STATUS_COLORS, type EntryStatus } from "@/features/library";
import { AddToListButton } from "@/features/lists";
import type { UnifiedCatalogItem } from "@/features/catalog/normalize/unified.types";

export function ItemDetail({ item }: { item: UnifiedCatalogItem }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    entry,
    isInLibrary,
    isFavorite,
    isLoading,
    toggleFavorite,
    isTogglingFavorite,
  } = useLibraryEntry({
    type: item.type,
    provider: item.provider,
    externalId: item.externalId,
    title: item.title,
    posterUrl: item.posterUrl,
  });

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

            {/* Library Entry Info */}
            {isInLibrary && entry ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
                <Badge className={`border ${STATUS_COLORS[entry.status as EntryStatus]}`}>
                  {STATUS_LABELS[entry.status as EntryStatus]}
                </Badge>
                {entry.rating ? (
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400">
                    ★ {entry.rating}/10
                  </Badge>
                ) : null}
                {isFavorite ? (
                  <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400">
                    <Heart className="mr-1 h-3 w-3 fill-red-400" />
                    Favorito
                  </Badge>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDialogOpen(true)}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  <Edit className="mr-1.5 h-4 w-4" />
                  Editar
                </Button>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {isInLibrary ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => toggleFavorite()}
                    disabled={isTogglingFavorite}
                    className={isFavorite ? "border-red-500/30 text-red-400" : ""}
                  >
                    {isTogglingFavorite ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Heart className={`mr-2 h-4 w-4 ${isFavorite ? "fill-red-400" : ""}`} />
                    )}
                    {isFavorite ? "Quitar favorito" : "Añadir a favoritos"}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setDialogOpen(true)} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Agregar a biblioteca
                </Button>
              )}
              <AddToListButton
                itemType={item.type}
                provider={item.provider}
                externalId={item.externalId}
                title={item.title}
                posterUrl={item.posterUrl ?? null}
              />
            </div>
          </div>
        </div>
      </div>

      <EntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        itemType={item.type}
        provider={item.provider}
        externalId={item.externalId}
        title={item.title}
        posterUrl={item.posterUrl}
      />

      {/* Our Ratings Panel - Group summary */}
      <OurRatingsPanel
        type={item.type}
        provider={item.provider}
        externalId={item.externalId}
      />

      <AttributionFooter />
    </div>
  );
}
