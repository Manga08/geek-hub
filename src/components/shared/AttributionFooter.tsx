"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

/**
 * Global attribution footer for TMDb and RAWG compliance.
 * Discreto y premium, se muestra al final de todas las páginas del app layout.
 */
export function AttributionFooter() {
  const [tmdbLogoError, setTmdbLogoError] = useState(false);
  const [rawgLogoError, setRawgLogoError] = useState(false);

  return (
    <footer className="mt-auto border-t border-white/5 bg-black/20 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
        {/* TMDb Attribution */}
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start">
          {!tmdbLogoError ? (
            <Link
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 transition-opacity hover:opacity-80"
            >
              <Image
                src="/logos/tmdb.svg"
                alt="TMDb Logo"
                width={80}
                height={20}
                className="h-5 w-auto"
                onError={() => setTmdbLogoError(true)}
              />
            </Link>
          ) : (
            <Link
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-400 hover:underline"
            >
              TMDb
            </Link>
          )}
          <p className="max-w-xs text-[10px] leading-tight text-muted-foreground/70">
            This product uses the TMDb API but is not endorsed or certified by{" "}
            <Link
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400/80 hover:underline"
            >
              TMDb
            </Link>
            .
          </p>
        </div>

        {/* RAWG Attribution */}
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start">
          {!rawgLogoError ? (
            <Link
              href="https://rawg.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 transition-opacity hover:opacity-80"
            >
              <Image
                src="/logos/rawg.svg"
                alt="RAWG Logo"
                width={60}
                height={20}
                className="h-5 w-auto"
                onError={() => setRawgLogoError(true)}
              />
            </Link>
          ) : (
            <Link
              href="https://rawg.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-emerald-400 hover:underline"
            >
              RAWG
            </Link>
          )}
          <p className="max-w-xs text-[10px] leading-tight text-muted-foreground/70">
            Game data powered by{" "}
            <Link
              href="https://rawg.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400/80 hover:underline"
            >
              RAWG
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
