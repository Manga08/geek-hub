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
        "group flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg",
        className
      )}
      aria-label="Ir al inicio"
    >
      <div className="relative flex items-center justify-center">
        {/* Glow effect */}
        <div className="absolute inset-0 -z-10 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <BrandMark
          className="h-8 w-8 transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
        />
      </div>

      {variant === "full" && (
        <span className="font-bold text-lg tracking-tight text-foreground/90 transition-colors group-hover:text-foreground">
          GeekHub
        </span>
      )}
    </Link>
  );
}
