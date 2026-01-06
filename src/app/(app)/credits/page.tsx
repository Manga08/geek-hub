"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { GlassCard } from "@/components/shared/GlassCard";

export default function CreditsPage() {
  const [tmdbLogoError, setTmdbLogoError] = useState(false);
  const [rawgLogoError, setRawgLogoError] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-foreground">Créditos y Atribución</h1>
      
      <p className="text-sm text-muted-foreground">
        GeekHub utiliza datos de las siguientes fuentes externas. No estamos afiliados ni respaldados por ninguna de ellas.
      </p>

      {/* TMDb Section */}
      <GlassCard className="space-y-4 p-6">
        <div className="flex items-start gap-4">
          {!tmdbLogoError ? (
            <Link
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 rounded-lg bg-[#0d253f] p-3 transition-opacity hover:opacity-80"
            >
              <Image
                src="/logos/tmdb.svg"
                alt="The Movie Database (TMDb)"
                width={120}
                height={30}
                className="h-8 w-auto"
                onError={() => setTmdbLogoError(true)}
              />
            </Link>
          ) : (
            <Link
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 rounded-lg bg-[#0d253f] px-4 py-3 text-lg font-bold text-[#01b4e4] transition-opacity hover:opacity-80"
            >
              TMDb
            </Link>
          )}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">The Movie Database (TMDb)</h2>
            <p className="text-sm text-muted-foreground">
              Datos de películas y series de televisión, incluyendo sinopsis, reparto, calificaciones e imágenes.
            </p>
          </div>
        </div>
        
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Aviso legal:</strong> Este producto utiliza la API de TMDb pero{" "}
            <strong>no está avalado ni certificado por TMDb</strong>.
          </p>
          <Link
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-blue-400 hover:underline"
          >
            Visitar themoviedb.org →
          </Link>
        </div>
      </GlassCard>

      {/* RAWG Section */}
      <GlassCard className="space-y-4 p-6">
        <div className="flex items-start gap-4">
          {!rawgLogoError ? (
            <Link
              href="https://rawg.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 rounded-lg bg-zinc-900 p-3 transition-opacity hover:opacity-80"
            >
              <Image
                src="/logos/rawg.svg"
                alt="RAWG Video Games Database"
                width={100}
                height={30}
                className="h-8 w-auto"
                onError={() => setRawgLogoError(true)}
              />
            </Link>
          ) : (
            <Link
              href="https://rawg.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 rounded-lg bg-zinc-900 px-4 py-3 text-lg font-bold text-white transition-opacity hover:opacity-80"
            >
              RAWG
            </Link>
          )}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">RAWG Video Games Database</h2>
            <p className="text-sm text-muted-foreground">
              La mayor base de datos de videojuegos. Datos de juegos, plataformas, géneros, capturas e información de lanzamiento.
            </p>
          </div>
        </div>
        
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Atribución:</strong> Datos e imágenes de videojuegos proporcionados por{" "}
            <Link
              href="https://rawg.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              RAWG.io
            </Link>
            .
          </p>
          <Link
            href="https://rawg.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-emerald-400 hover:underline"
          >
            Visitar rawg.io →
          </Link>
        </div>
      </GlassCard>

      {/* Additional Info */}
      <GlassCard className="p-4">
        <p className="text-xs text-muted-foreground">
          Todas las marcas, logotipos y nombres de productos mencionados son propiedad de sus respectivos dueños.
          El uso de estos nombres, logotipos y marcas no implica respaldo.
        </p>
      </GlassCard>
    </div>
  );
}
