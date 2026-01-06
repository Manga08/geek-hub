"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, Edit, Trash2, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EntryDialog } from "./EntryDialog";
import {
  libraryKeys,
  toggleFavorite,
  deleteEntry,
} from "@/features/library/queries";
import {
  type LibraryEntry,
  type EntryStatus,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/features/library/types";

const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const cardVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  hover: { y: -2, scale: 1.008 },
};

interface LibraryCardProps {
  entry: LibraryEntry;
}

export function LibraryCard({ entry }: LibraryCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  const href = `/item/${entry.type}/${entry.provider}-${entry.external_id}`;
  const isGame = entry.type === "game";
  const mediaAspect = isGame ? "aspect-[16/9]" : "aspect-[2/3]";

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: libraryKeys.all });
  };

  const favoriteMutation = useMutation({
    mutationFn: () => toggleFavorite(entry.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: libraryKeys.all });
      // Optimistic update in list cache
      queryClient.setQueriesData<LibraryEntry[]>(
        { queryKey: libraryKeys.all },
        (old) =>
          old?.map((e) =>
            e.id === entry.id ? { ...e, is_favorite: !e.is_favorite } : e
          )
      );
    },
    onSettled: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEntry(entry.id),
    onSuccess: () => {
      setDeleteOpen(false);
      invalidateAll();
    },
  });

  return (
    <>
      <motion.article
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        transition={{ duration: 0.2 }}
        className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] shadow-lg backdrop-blur-sm"
      >
        {/* Image link */}
        <Link href={href} className="block">
          <div className={`relative w-full overflow-hidden ${mediaAspect}`}>
            {entry.poster_url ? (
              <Image
                src={entry.poster_url}
                alt={entry.title || ""}
                fill
                quality={80}
                sizes="(min-width:1280px) 18vw, (min-width:768px) 25vw, 45vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-white/5 to-black/20 text-sm text-muted-foreground/60">
                Sin imagen
              </div>
            )}

            {/* Gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Status + Rating badges on image */}
            <div className="absolute bottom-2 left-2 flex flex-wrap items-center gap-1.5">
              <Badge
                className={`border text-[10px] ${STATUS_COLORS[entry.status as EntryStatus]}`}
              >
                {STATUS_LABELS[entry.status as EntryStatus]}
              </Badge>
              {entry.rating ? (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-400"
                >
                  ★ {entry.rating}/10
                </Badge>
              ) : null}
            </div>

            {/* Favorite indicator */}
            {entry.is_favorite && (
              <div className="absolute top-2 right-2">
                <Heart className="h-4 w-4 fill-red-400 text-red-400 drop-shadow" />
              </div>
            )}
          </div>
        </Link>

        {/* Info + Actions */}
        <div className="space-y-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Badge
                variant="outline"
                className="mb-1.5 border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
              >
                {entry.type}
              </Badge>
              <p className="line-clamp-2 text-sm font-medium leading-tight text-foreground/90">
                {entry.title || "Sin título"}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1 pt-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className={`h-7 w-7 rounded-full ${
                entry.is_favorite
                  ? "text-red-400 hover:bg-red-500/10"
                  : "text-muted-foreground hover:bg-white/5"
              }`}
              onClick={() => favoriteMutation.mutate()}
              disabled={favoriteMutation.isPending}
            >
              {favoriteMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Heart
                  className={`h-3.5 w-3.5 ${entry.is_favorite ? "fill-red-400" : ""}`}
                />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 rounded-full text-muted-foreground hover:bg-white/5"
              onClick={() => setEditOpen(true)}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 rounded-full text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </motion.article>

      {/* Edit dialog */}
      <EntryDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        itemType={entry.type}
        provider={entry.provider}
        externalId={entry.external_id}
        title={entry.title || "Sin título"}
        posterUrl={entry.poster_url}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar entrada?</DialogTitle>
            <DialogDescription>
              Se eliminará &quot;{entry.title}&quot; de tu biblioteca. Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
