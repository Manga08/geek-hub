"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Activity, BarChart3, Bell, Bookmark, ListChecks, Search, Settings } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { GroupSwitcher } from "@/features/groups"
import { useProfile } from "@/features/profile"
import { useUnreadActivityCount } from "@/features/activity"

const links = [
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: Bookmark },
  { href: "/lists", label: "Lists", icon: ListChecks },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/stats", label: "Stats", icon: BarChart3 },
]

// =========================
// Notification Badge
// =========================
function NotificationBadge() {
  const { data: unreadData } = useUnreadActivityCount();
  const count = unreadData?.count ?? 0;

  return (
    <Link
      href="/activity"
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
      title="Actividad"
    >
      <Bell className="h-4 w-4 text-muted-foreground" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-lg">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

function UserMenu() {
  const { data: profile, isLoading } = useProfile();
  
  const initials = (profile?.display_name ?? profile?.email ?? "U")[0].toUpperCase();
  const displayName = profile?.display_name ?? profile?.email?.split("@")[0] ?? "Usuario";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 pr-3 hover:bg-white/10 transition-colors">
          {isLoading ? (
            <div className="h-7 w-7 rounded-full bg-gray-700 animate-pulse" />
          ) : profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-300">
              {initials}
            </div>
          )}
          <span className="text-sm text-gray-300 hidden md:block max-w-24 truncate">
            {displayName}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{displayName}</p>
          {profile?.email && (
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/profile" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
          <NotificationBadge />
          <UserMenu />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" aria-hidden />
      </div>
    </header>
  )
}
