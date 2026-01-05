import Link from "next/link";

export function AttributionFooter() {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-zinc-600">
      <span>
        Datos de videojuegos: <Link href="https://rawg.io/" className="font-medium text-blue-600 hover:underline">RAWG</Link>
      </span>
      <span className="text-zinc-400">•</span>
      <span>
        Películas/series: <Link href="/credits" className="font-medium text-blue-600 hover:underline">TMDb (créditos)</Link>
      </span>
      <span className="text-zinc-400">•</span>
      <Link href="/credits" className="font-medium text-blue-600 hover:underline">
        Créditos
      </Link>
    </div>
  );
}
