export function MediaCardSkeleton() {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-sm">
      {/* Poster Frame aspect-ratio matches MediaPosterFrame (2/3) */}
      <div className="relative aspect-[2/3] w-full bg-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10" />
        {/* Badge Placeholder (Top Left) */}
        <div className="absolute left-2 top-2 h-5 w-16 rounded bg-white/10" />
      </div>

      {/* Footer Area */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          {/* Title Placeholder */}
          <div className="h-4 w-3/4 rounded bg-white/10" />
          {/* Rating Placeholder (Top Right of text area) */}
          <div className="h-3 w-8 rounded bg-white/10" />
        </div>
        {/* Year Placeholder */}
        <div className="h-3 w-12 rounded bg-white/10" />
      </div>
    </div>
  );
}

export function MediaGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid min-h-[400px] gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, idx) => (
        <MediaCardSkeleton key={idx} />
      ))}
    </div>
  );
}
