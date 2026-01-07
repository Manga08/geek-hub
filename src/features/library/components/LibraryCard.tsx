"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Edit, Loader2 } from "lucide-react";
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
import { MediaPosterFrame } from "@/components/shared/MediaPosterFrame";
import { cn } from "@/lib/utils";
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

const cardVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  hover: { y: -4, transition: { duration: 0.2 } },
  tap: { scale: 0.98 },
};

interface LibraryCardProps {
  entry: LibraryEntry;
}

export function LibraryCard({ entry }: LibraryCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  const href = `/item/${entry.type}/${entry.provider}-${entry.external_id}`;

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
        whileTap="tap"
        className="group relative h-full flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-sm transition-colors hover:border-white/20 hover:bg-white/5"
      >
        {/* Link wrapper */}
        <Link href={href} className="relative block w-full outline-none">
          <MediaPosterFrame
            src={entry.poster_url}
            alt={entry.title || "Library Entry"}
            type={entry.type}
          >
             {/* Badge */}
             <div className="absolute left-2 top-2 z-10">
               <Badge 
                 className={cn("px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider opacity-90 backdrop-blur-md")}
                 style={{ backgroundColor: STATUS_COLORS[entry.status as EntryStatus] }}
               >
                 {STATUS_LABELS[entry.status as EntryStatus]}
               </Badge>
             </div>

             {/* Actions */}
             <div className="absolute right-2 top-2 z-10 flex translate-y-[-10px] flex-col gap-1.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
               <Button
                 size="icon-sm"
                 variant="ghost" 
                 className="h-8 w-8 rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 hover:text-red-400"
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   favoriteMutation.mutate();
                 }}
               >
                 <Heart className={cn("h-4 w-4", entry.is_favorite && "fill-current text-red-500")} />
               </Button>
               <Button
                  size="icon-sm"
                  variant="ghost"
                  className="h-8 w-8 rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 hover:text-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
             </div>
          </MediaPosterFrame>

          {/* Footer */}
          <div className="flex flex-1 flex-col gap-1 p-3">
             <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-sm font-medium leading-tight text-foreground/90 group-hover:text-primary transition-colors">
                  {entry.title}
                </h3>
                  {entry.rating && entry.rating > 0 ? (
                  <span className="shrink-0 text-[10px] font-bold text-yellow-500/90 pt-0.5">
                    ★ {entry.rating}
                  </span>
                ) : null}
             </div>
             {/* Optional: Add extra library info here like updated_at or notes snippet */}
          </div>
        </Link>
      </motion.article>

      <EntryDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        itemType={entry.type}
        provider={entry.provider}
        externalId={entry.external_id}
        title={entry.title || "Sin título"}
        posterUrl={entry.poster_url}
      />

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
