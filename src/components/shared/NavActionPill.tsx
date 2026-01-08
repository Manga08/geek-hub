import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const navActionPillVariants = cva(
  "relative flex items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 backdrop-blur-md outline-none disabled:opacity-50 disabled:pointer-events-none after:absolute after:-inset-1 after:content-['']",
  {
    variants: {
      size: {
        default: "h-9 px-3",
        icon: "h-9 w-9",
      },
      active: {
        true: "bg-white/10 border-white/20",
        false: "hover:bg-white/10",
      },
    },
    defaultVariants: {
      size: "default",
      active: false,
    },
  }
)

export interface NavActionPillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof navActionPillVariants> {
  asChild?: boolean
}

const NavActionPill = React.forwardRef<HTMLButtonElement, NavActionPillProps>(
  ({ className, size, active, asChild = false, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    // If wrapping a child (Slot), 'type' might be ignored or passed down depending on Radix Slot behavior,
    // but for the default "button" case, we want specific type="button" to avoid form submission.
    const buttonProps = asChild ? props : { type, ...props }

    return (
      <Comp
        className={cn(navActionPillVariants({ size, active, className }))}
        ref={ref}
        {...buttonProps}
      />
    )
  }
)
NavActionPill.displayName = "NavActionPill"

export { NavActionPill, navActionPillVariants }
