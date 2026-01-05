"use client";

import { useState } from "react";
import Link from "next/link";
import { List, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLists, useCreateList, useDeleteList } from "@/features/lists/hooks";
import type { ListWithItemCount } from "@/features/lists/types";

function CreateListDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createList = useCreateList();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createList.mutateAsync({ name: name.trim(), description: description.trim() || null });
    setName("");
    setDescription("");
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Lista
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nueva Lista</DialogTitle>
          <DialogDescription>
            Crea una lista para organizar y compartir contenido con tu grupo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Nombre
            </label>
            <Input
              id="name"
              placeholder="Mi lista de películas..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descripción (opcional)
            </label>
            <Input
              id="description"
              placeholder="Una breve descripción..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || createList.isPending}>
              {createList.isPending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ListCard({ list, onDelete }: { list: ListWithItemCount; onDelete: () => void }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteList = useDeleteList();

  const handleDelete = async () => {
    await deleteList.mutateAsync(list.id);
    setShowDeleteDialog(false);
    onDelete();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        layout
      >
        <Link href={`/lists/${list.id}`}>
          <GlassCard className="group relative overflow-hidden p-4 transition-all hover:border-primary/50 hover:shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <List className="h-5 w-5 text-primary shrink-0" />
                  <h3 className="font-semibold text-foreground truncate">
                    {list.name}
                  </h3>
                </div>
                {list.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {list.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {list.item_count} {list.item_count === 1 ? "elemento" : "elementos"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </GlassCard>
        </Link>
      </motion.div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar lista?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará &quot;{list.name}&quot; y todos sus elementos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteList.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-4">
        <List className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">No tienes listas</h3>
      <p className="mb-6 max-w-sm text-muted-foreground">
        Crea tu primera lista para organizar películas, series, juegos y anime con tu grupo.
      </p>
      <CreateListDialog />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-xl border border-white/10 bg-white/5"
        />
      ))}
    </div>
  );
}

export default function ListsPage() {
  const { data: lists, isLoading, error } = useLists();

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Listas</h1>
          <p className="mt-1 text-muted-foreground">
            Organiza y comparte contenido con tu grupo
          </p>
        </div>
        {lists && lists.length > 0 && <CreateListDialog />}
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <GlassCard className="p-8 text-center">
          <p className="text-destructive">Error al cargar las listas</p>
        </GlassCard>
      ) : !lists || lists.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {lists.map((list) => (
              <ListCard key={list.id} list={list} onDelete={() => {}} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
