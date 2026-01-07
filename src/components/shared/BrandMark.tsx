import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  variant?: "hub" | "glyph";
}

export function BrandMark({ className, variant = "hub" }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary shrink-0", className)}
      aria-hidden="true"
    >
      {variant === "hub" ? (
        <>
          {/* Central Hub Core (Diamond/Rhombus) */}
          <path
            d="M12 7.5L16.5 12L12 16.5L7.5 12L12 7.5Z"
            fill="currentColor"
            fillOpacity="0.15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          
          {/* Core Center Dot */}
          <circle cx="12" cy="12" r="1" fill="currentColor" />

          {/* Connections to Peripherals */}
          <path
            d="M12 4V7.5M16.5 12H20M12 16.5V20M7.5 12H4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Peripheral Nodes - Top, Right, Bottom, Left */}
          <circle cx="12" cy="3" r="1.5" className="fill-current" />
          <circle cx="21" cy="12" r="1.5" className="fill-current" />
          <circle cx="12" cy="21" r="1.5" className="fill-current" />
          <circle cx="3" cy="12" r="1.5" className="fill-current" />
        </>
      ) : (
        /* Legacy Glyph Variant */
        <>
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            fill="currentColor"
            fillOpacity="0.5"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 7L12 12L22 7M12 22V12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
