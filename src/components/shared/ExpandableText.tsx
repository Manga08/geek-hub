"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExpandableTextProps {
  text: string;
  limit?: number;
  className?: string;
}

export function ExpandableText({ text, limit = 150, className }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  if (text.length <= limit) {
    return <p className={cn("text-sm text-muted-foreground", className)}>{text}</p>;
  }

  return (
    <div className={cn("space-y-1", className)}>
      <p className={cn("text-sm text-muted-foreground transition-all", expanded ? "" : "line-clamp-3")}>
        {text}
      </p>
      <Button
        variant="link"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="h-auto p-0 text-xs text-primary font-medium hover:text-primary/80"
      >
        {expanded ? "Mostrar menos" : "Mostrar más"}
      </Button>
    </div>
  );
}
