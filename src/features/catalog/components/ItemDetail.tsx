"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, Plus, Loader2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExpandableText } from "@/components/shared/ExpandableText";
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
        <div className="relative h-48 w-full sm:h-64">
          {item.backdropUrl ? (
            <Image
              src={item.backdropUrl}
              alt={item.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-white/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col gap-6 p-4 pt-0 sm:p-6 sm:flex-row sm:pt-6">
          <div className="w-36 -mt-20 mx-auto sm:mx-0 sm:mt-0 sm:w-48 shrink-0">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-black/40 shadow-2xl">
              {item.posterUrl ? (
                <Image src={item.posterUrl} alt={item.title} fill sizes="(max-width: 640px) 150px, 200px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sin imagen</div>
              )}
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex flex-col gap-2 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge variant="secondary" className="capitalize">
                  {item.type}
                </Badge>
                {item.year ? <span className="text-sm text-muted-foreground/90">{item.year}</span> : null}
                <span className="text-xs uppercase tracking-wide text-muted-foreground/80">{item.provider}</span>
              </div>
              <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">{item.title}</h1>
              {item.genres.length ? (
                <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
                  {item.genres.map((genre) => (
                    <Badge key={genre} variant="outline" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            {item.summary ? (
              <ExpandableText text={item.summary} className="text-center sm:text-left" />
            ) : null}

            {/* Library Entry Info */}
            {isInLibrary && entry ? (
              <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 sm:justify-start">
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
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              {isInLibrary ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => toggleFavorite()}
                    disabled={isTogglingFavorite}
                    className={`h-11 w-full sm:w-auto ${isFavorite ? "border-red-500/30 text-red-400" : ""}`}
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
                <Button onClick={() => setDialogOpen(true)} disabled={isLoading} className="h-11 w-full sm:w-auto text-base">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Agregar a biblioteca
                </Button>
              )}
              <div className="flex w-full sm:w-auto">
                <AddToListButton
                  itemType={item.type}
                  provider={item.provider}
                  externalId={item.externalId}
                  title={item.title}
                  posterUrl={item.posterUrl ?? null}
                  className="h-11 w-full text-base sm:w-auto"
                />
               </div>
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
    </div>
  );
}
