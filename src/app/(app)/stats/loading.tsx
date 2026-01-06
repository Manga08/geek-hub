import { BarChart3 } from "lucide-react";

export default function StatsLoading() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Estadísticas
        </h1>
        <p className="text-gray-400 mt-1">
          Resumen de tu actividad en la biblioteca
        </p>
      </header>

      {/* Filters Skeleton */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-gray-700 rounded-full animate-pulse" />
          <div className="h-8 w-24 bg-gray-700 rounded-full animate-pulse" />
          <div className="h-8 w-20 bg-gray-700 rounded-full animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-8 w-16 bg-gray-700 rounded-full animate-pulse" />
          <div className="h-8 w-20 bg-gray-700 rounded-full animate-pulse" />
          <div className="h-8 w-16 bg-gray-700 rounded-full animate-pulse" />
          <div className="h-8 w-16 bg-gray-700 rounded-full animate-pulse" />
          <div className="h-8 w-18 bg-gray-700 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-gray-900/50 p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-700 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-gray-700 rounded" />
                  <div className="h-6 w-12 bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4">
            <div className="h-4 w-32 bg-gray-700 rounded mb-4 animate-pulse" />
            <div className="space-y-2">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-4 bg-gray-700 rounded animate-pulse" />
                  <div className="flex-1 h-6 bg-gray-700 rounded-full animate-pulse" />
                  <div className="w-8 h-4 bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4">
            <div className="h-4 w-32 bg-gray-700 rounded mb-4 animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-6 h-6 bg-gray-700 rounded" />
                  <div className="w-10 h-14 bg-gray-700 rounded" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-32 bg-gray-700 rounded" />
                    <div className="h-3 w-16 bg-gray-700 rounded" />
                  </div>
                  <div className="w-10 h-5 bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
