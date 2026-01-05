export function MediaCardSkeleton() {
  return (
    <div className="h-full animate-pulse overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="aspect-[2/3] w-full bg-zinc-100" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-16 rounded bg-zinc-100" />
        <div className="h-4 w-24 rounded bg-zinc-100" />
        <div className="h-4 w-3/4 rounded bg-zinc-100" />
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
