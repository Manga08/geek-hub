"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, X, Save, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateEntry, libraryKeys } from "@/features/library/queries";
import type { LibraryEntry } from "@/features/library/types";

interface NotesModalProps {
  entry: LibraryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotesModal({ entry, open, onOpenChange }: NotesModalProps) {
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  // Sync state when entry changes
  useEffect(() => {
    if (entry) {
      setNotes(entry.notes ?? "");
    }
  }, [entry]);

  const mutation = useMutation({
    mutationFn: async (newNotes: string) => {
      if (!entry) throw new Error("No entry selected");
      return updateEntry(entry.id, { notes: newNotes || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
      onOpenChange(false);
    },
  });

  const handleSave = () => {
    mutation.mutate(notes);
  };

  const hasChanges = entry ? notes !== (entry.notes ?? "") : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-zinc-900 border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Notas
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {entry?.title ?? "Sin título"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Escribe tus notas aquí..."
            rows={6}
            maxLength={2000}
            className="resize-none bg-white/5 border-white/10 focus:border-primary/50"
          />
          <p className="mt-2 text-xs text-muted-foreground text-right">
            {notes.length}/2000
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar
          </Button>
        </DialogFooter>

        {mutation.isError && (
          <p className="text-sm text-red-400 text-center">
            Error al guardar las notas
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
