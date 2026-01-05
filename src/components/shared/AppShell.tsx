import * as React from "react"

import { Navbar } from "@/components/shared/Navbar"
import { cn } from "@/lib/utils"

export function AppShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative min-h-screen bg-background text-foreground", className)}>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_at_20%_20%,rgba(124,92,255,0.14),transparent_45%),radial-gradient(1000px_at_80%_0%,rgba(56,189,248,0.12),transparent_40%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-primary/50 via-transparent to-primary/40" aria-hidden />
      <Navbar />
      <main className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-4 sm:px-6 sm:pt-6">{children}</main>
    </div>
  )
}
