import { Library } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";

function Skeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-white/10 bg-white/[0.03]">
      <div className="aspect-[2/3] w-full bg-white/5" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-12 rounded bg-white/10" />
        <div className="h-4 w-full rounded bg-white/10" />
        <div className="h-4 w-2/3 rounded bg-white/10" />
      </div>
    </div>
  );
}

export default function LibraryLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Library className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <div className="h-7 w-40 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-20 animate-pulse rounded bg-white/5" />
        </div>
      </div>

      {/* Filters skeleton */}
      <GlassCard className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-20 animate-pulse rounded-full bg-white/5"
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-24 animate-pulse rounded-full bg-white/5"
            />
          ))}
        </div>
      </GlassCard>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    </div>
  );
}
