"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, BarChart3, Bookmark, ListChecks, Search, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { GroupSwitcher } from "@/features/groups"

const links = [
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: Bookmark },
  { href: "/lists", label: "Lists", icon: ListChecks },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/stats", label: "Stats", icon: BarChart3 },
]

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 mb-4 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_0_6px_rgba(124,92,255,0.15)]" aria-hidden />
            <span className="text-sm font-semibold tracking-tight text-foreground">GeekHub</span>
          </div>
          {/* Group Switcher */}
          <GroupSwitcher />
          <div className="hidden items-center gap-1 rounded-full border border-white/5 bg-white/5 px-1 text-sm text-muted-foreground shadow-sm sm:flex">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-full px-3 py-1 transition-colors",
                  pathname?.startsWith(href)
                    ? "bg-primary/20 text-foreground"
                    : "hover:text-foreground"
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 shadow-sm sm:hidden">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground transition-colors",
                  pathname?.startsWith(href) && "bg-primary/15 text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
          <Button variant="ghost" size="icon-sm" className="border border-white/10 bg-white/5">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="border border-white/10 bg-white/5">
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="border border-white/10 bg-white/5">
            <User className="h-4 w-4" />
          </Button>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" aria-hidden />
      </div>
    </header>
  )
}
