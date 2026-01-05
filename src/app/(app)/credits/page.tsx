import Link from "next/link";

import { GlassCard } from "@/components/shared/GlassCard";

export default function CreditsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold text-foreground">Créditos</h1>
      <GlassCard className="space-y-3 p-5">
        <p className="text-sm text-muted-foreground">
          Esta aplicación usa datos de terceros. No está afiliada ni respaldada por ellos.
        </p>
        <div className="space-y-3 text-sm text-foreground">
          <div className="space-y-1">
            <span className="font-medium text-foreground">The Movie Database (TMDb)</span>: datos de películas y series.
            <br />
            <Link
              href="https://www.themoviedb.org/"
              className="text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              https://www.themoviedb.org/
            </Link>
          </div>
          <div className="space-y-1">
            <span className="font-medium text-foreground">RAWG</span>: datos de videojuegos.
            <br />
            <Link href="https://rawg.io/" className="text-primary hover:underline" target="_blank" rel="noreferrer">
              https://rawg.io/
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">No endorsed or certified by TMDb or RAWG.</p>
        </div>
      </GlassCard>
    </div>
  );
}
