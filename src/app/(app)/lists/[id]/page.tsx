"use client";

import { useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  X,
  MoreVertical,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  useListDetail,
  useUpdateList,
  useDeleteList,
  useRemoveListItem,
  useUpdateListItem,
} from "@/features/lists/hooks";
import type { ListItem } from "@/features/lists/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

function EditListDialog({
  listId,
  currentName,
  currentDescription,
  open,
  onOpenChange,
}: {
  listId: string;
  currentName: string;
  currentDescription: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription ?? "");
  const updateList = useUpdateList(listId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await updateList.mutateAsync({
      name: name.trim(),
      description: description.trim() || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Lista</DialogTitle>
          <DialogDescription>
            Modifica el nombre o descripción de la lista.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-name" className="text-sm font-medium">
              Nombre
            </label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="edit-description" className="text-sm font-medium">
              Descripción (opcional)
            </label>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || updateList.isPending}>
              {updateList.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ListItemCard({
  item,
  listId,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  item: ListItem;
  listId: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const removeItem = useRemoveListItem(listId);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleRemove = async () => {
    await removeItem.mutateAsync({
      itemType: item.item_type,
      provider: item.provider,
      externalId: item.external_id,
    });
    setShowDeleteDialog(false);
  };

  const itemUrl = `/item/${item.item_type}/${item.provider}-${item.external_id}`;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className="group"
      >
        <GlassCard className="flex items-center gap-4 p-3 transition-all hover:border-primary/30">
          {/* Poster */}
          <Link href={itemUrl} className="shrink-0">
            <div className="relative h-20 w-14 overflow-hidden rounded-lg bg-white/5">
              {item.poster_url ? (
                <Image
                  src={item.poster_url}
                  alt={item.title ?? ""}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  N/A
                </div>
              )}
            </div>
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Link href={itemUrl} className="hover:underline">
              <h3 className="font-medium truncate">{item.title ?? "Sin título"}</h3>
            </Link>
            <p className="text-xs text-muted-foreground capitalize">
              {item.item_type} · {item.provider}
            </p>
            {item.note && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                {item.note}
              </p>
            )}
          </div>

          {/* Actions - Desktop */}
          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isFirst}
              onClick={onMoveUp}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isLast}
              onClick={onMoveDown}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Link href={itemUrl}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions - Mobile */}
          <div className="sm:hidden">
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                     <MoreVertical className="h-4 w-4" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onMoveUp} disabled={isFirst}>
                     <ChevronUp className="mr-2 h-4 w-4" /> Mover arriba
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onMoveDown} disabled={isLast}>
                     <ChevronDown className="mr-2 h-4 w-4" /> Mover abajo
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <Link href={itemUrl} className="w-full">
                     <DropdownMenuItem>
                        <ExternalLink className="mr-2 h-4 w-4" /> Ver detalles
                     </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive font-medium">
                     <Trash2 className="mr-2 h-4 w-4" /> Quitar
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </GlassCard>
      </motion.div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar de la lista?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitará &quot;{item.title}&quot; de esta lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeItem.isPending ? "Quitando..." : "Quitar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EmptyItems() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-4">
        <Plus className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">Lista vacía</h3>
      <p className="mb-6 max-w-sm text-muted-foreground">
        Agrega elementos desde el catálogo usando el botón &quot;Agregar a lista&quot; en cada item.
      </p>
      <Link href="/search">
        <Button>Buscar contenido</Button>
      </Link>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/5"
        />
      ))}
    </div>
  );
}

export default function ListDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, error } = useListDetail(id);
  const deleteList = useDeleteList();
  const updateItem = useUpdateListItem(id);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    await deleteList.mutateAsync(id);
    router.push("/lists");
  };

  const handleMoveItem = async (item: ListItem, direction: "up" | "down", items: ListItem[]) => {
    const currentIndex = items.findIndex(
      (i) =>
        i.item_type === item.item_type &&
        i.provider === item.provider &&
        i.external_id === item.external_id
    );

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const targetItem = items[targetIndex];

    // Swap positions
    await updateItem.mutateAsync({
      itemType: item.item_type,
      provider: item.provider,
      externalId: item.external_id,
      dto: { position: targetItem.position },
    });
    await updateItem.mutateAsync({
      itemType: targetItem.item_type,
      provider: targetItem.provider,
      externalId: targetItem.external_id,
      dto: { position: item.position },
    });
  };

  if (error) {
    return (
      <div className="container max-w-4xl py-8">
        <GlassCard className="p-8 text-center">
          <p className="text-destructive">Error al cargar la lista</p>
          <Link href="/lists" className="mt-4 inline-block text-primary hover:underline">
            Volver a listas
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Back button */}
      <Link
        href="/lists"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a listas
      </Link>

      {isLoading ? (
        <>
          <div className="mb-8 h-10 w-64 animate-pulse rounded-lg bg-white/10" />
          <LoadingSkeleton />
        </>
      ) : data ? (
        <>
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-4 sm:mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate sm:text-3xl">{data.list.name}</h1>
              {data.list.description && (
                <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">{data.list.description}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                {data.items.length} {data.items.length === 1 ? "elemento" : "elementos"}
              </p>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowEditDialog(true)}
                title="Editar lista"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setShowDeleteDialog(true)}
                title="Eliminar lista"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Actions */}
            <div className="sm:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar detalles
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => setShowDeleteDialog(true)}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar lista
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>

          {/* Items */}
          {data.items.length === 0 ? (
            <EmptyItems />
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {data.items.map((item, index) => (
                  <ListItemCard
                    key={`${item.item_type}-${item.provider}-${item.external_id}`}
                    item={item}
                    listId={id}
                    isFirst={index === 0}
                    isLast={index === data.items.length - 1}
                    onMoveUp={() => handleMoveItem(item, "up", data.items)}
                    onMoveDown={() => handleMoveItem(item, "down", data.items)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Edit Dialog */}
          <EditListDialog
            listId={id}
            currentName={data.list.name}
            currentDescription={data.list.description}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
          />

          {/* Delete Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar lista?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará &quot;{data.list.name}&quot; y
                  todos sus elementos.
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
      ) : null}
    </div>
  );
}
