"use client";

import Image from "next/image";
import { Film, Gamepad2, Tv, Clapperboard, MonitorPlay } from "lucide-react";
import { cn } from "@/lib/utils";

const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

type MediaType = "game" | "movie" | "tv" | "anime" | string;

interface MediaPosterFrameProps {
  src?: string | null;
  alt: string;
  type?: MediaType;
  priority?: boolean;
  sizes?: string;
  className?: string;
  children?: React.ReactNode;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  game: <Gamepad2 className="h-8 w-8 text-white/20" />,
  movie: <Film className="h-8 w-8 text-white/20" />,
  tv: <Tv className="h-8 w-8 text-white/20" />,
  anime: <MonitorPlay className="h-8 w-8 text-white/20" />,
};

export function MediaPosterFrame({
  src,
  alt,
  type = "movie",
  priority = false,
  sizes = "(min-width:1280px) 18vw, (min-width:1024px) 22vw, (min-width:768px) 30vw, 45vw",
  className,
  children,
}: MediaPosterFrameProps) {
  const isGame = type === "game";

  return (
    <div className={cn("relative aspect-[2/3] w-full overflow-hidden bg-muted", className)}>
      {src ? (
        <>
          {/* Smart-Fit for Games: Background Blur Layer */}
          {isGame && (
            <div className="absolute inset-0 z-0">
               <Image
                src={src}
                alt=""
                fill
                className="object-cover opacity-60 blur-xl scale-110"
                aria-hidden
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>
          )}

          {/* Main Image Layer */}
          <Image
            src={src}
            alt={alt}
            fill
            className={cn(
              "transition-transform duration-500 will-change-transform group-hover:scale-105",
              isGame ? "object-contain p-4 z-10" : "object-cover"
            )}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            sizes={sizes}
            priority={priority}
          />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/10 via-white/5 to-black/40">
          {TYPE_ICONS[type] || <Clapperboard className="h-8 w-8 text-white/20" />}
        </div>
      )}

      {/* Gradient Overlay for text readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10 opacity-60 transition-opacity duration-300 group-hover:opacity-80" />

      {/* Content Slot */}
      {children}
    </div>
  );
}
