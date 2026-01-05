import Link from "next/link";

export default function CreditsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-semibold">Créditos</h1>
      <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-zinc-700">
          Esta aplicación usa datos de terceros. No está afiliada ni respaldada por ellos.
        </p>
        <div className="space-y-2 text-sm text-zinc-700">
          <div>
            <span className="font-medium">The Movie Database (TMDb)</span>: datos de películas y series.
            <br />
            <Link
              href="https://www.themoviedb.org/"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              https://www.themoviedb.org/
            </Link>
          </div>
          <div>
            <span className="font-medium">RAWG</span>: datos de videojuegos.
            <br />
            <Link href="https://rawg.io/" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
              https://rawg.io/
            </Link>
          </div>
          <p className="text-xs text-zinc-500">No endorsed or certified by TMDb or RAWG.</p>
        </div>
      </div>
    </div>
  );
}
