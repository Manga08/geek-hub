import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const glassCardVariants = cva(
  "relative overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-[0_20px_80px_-60px_rgba(0,0,0,0.8)] backdrop-blur-md transition-transform transition-shadow duration-200",
  {
    variants: {
      variant: {
        default: "",
        clickable: "hover:-translate-y-[1px] hover:shadow-[0_30px_80px_-60px_rgba(124,92,255,0.45)]",
        selected: "ring-1 ring-primary/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function GlassCard({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof glassCardVariants>) {
  return <div className={cn(glassCardVariants({ variant }), className)} {...props} />
}

export { GlassCard, glassCardVariants }
