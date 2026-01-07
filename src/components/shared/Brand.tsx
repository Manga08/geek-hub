import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandMark } from "./BrandMark";

interface BrandProps {
  className?: string;
  variant?: "full" | "icon";
}

export function Brand({ className, variant = "full" }: BrandProps) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "group flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg",
        className
      )}
      aria-label="Ir al inicio"
    >
      <div className="relative flex items-center justify-center">
        {/* Glow effect - adjusted for subtlety */}
        <div className="absolute inset-0 -z-10 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-150" />

        <BrandMark
          className="h-7 w-7 transition-all duration-300 group-hover:scale-105 group-active:scale-95"
        />
      </div>

      {variant === "full" && (
        <span className="font-bold text-xl tracking-tighter text-foreground/90 transition-colors group-hover:text-foreground">
          GeekHub
        </span>
      )}
    </Link>
  );
}
