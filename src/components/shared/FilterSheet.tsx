"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

interface FiltersSheetProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  triggerLabel?: string;
  onApply?: () => void;
  onClear?: () => void;
  isPending?: boolean;
}

export function FilterSheet({
  children,
  title = "Filtros",
  description = "Ajusta los parámetros de búsqueda",
  triggerLabel = "Filtros",
  onApply,
  onClear,
  isPending,
}: FiltersSheetProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [open, setOpen] = useState(false);

  // Desktop: Render children directly (inline)
  if (isDesktop) {
    return <>{children}</>;
  }

  // Mobile: Sheet
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
           <SlidersHorizontal className="h-4 w-4" />
           {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col rounded-t-xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 px-1">
           {children}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
           {onClear && (
               <Button variant="outline" className="flex-1" onClick={() => { onClear(); setOpen(false); }}>
                 Limpiar
               </Button>
           )}
           <Button className="flex-1" onClick={() => { onApply?.(); setOpen(false); }} disabled={isPending}>
             {isPending ? "Aplicando..." : "Aplicar filtros"}
           </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
