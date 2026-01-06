import { GlassCard } from "@/components/shared/GlassCard";

export default function LoadingItemPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <GlassCard className="relative overflow-hidden border-white/10 bg-white/5 p-4 sm:p-6 backdrop-blur">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5" />
        <div className="grid gap-6 md:grid-cols-[240px,1fr]">
          <div className="aspect-[2/3] w-full animate-pulse rounded-xl bg-white/10" />
          <div className="space-y-4">
            <div className="h-4 w-20 animate-pulse rounded-full bg-white/10" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-6 w-16 animate-pulse rounded-full bg-white/10" />
              ))}
            </div>
            <div className="space-y-3">
              <div className="h-3 w-full animate-pulse rounded bg-white/10" />
              <div className="h-3 w-11/12 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-10/12 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-9/12 animate-pulse rounded bg-white/10" />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
