export function MediaCardSkeleton() {
  return (
    <div className="h-full animate-pulse overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur">
      <div className="relative aspect-[2/3] w-full bg-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10" />
      </div>
      <div className="space-y-2 p-3">
        <div className="h-3 w-16 rounded-full bg-white/10" />
        <div className="h-4 w-24 rounded bg-white/10" />
        <div className="h-4 w-3/4 rounded bg-white/10" />
      </div>
    </div>
  );
}

export function MediaGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, idx) => (
        <MediaCardSkeleton key={idx} />
      ))}
    </div>
  );
}
