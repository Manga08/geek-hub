import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";

export function EmptyState({ message, className }: { message: string, className?: string }) {
  return (
    <GlassCard className={cn("p-8 text-center", className)}>
      <p className="text-sm text-muted-foreground">{message}</p>
    </GlassCard>
  );
}
