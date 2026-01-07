"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Activity, BarChart3, Bell, Bookmark, Check, Home, ListChecks, Menu, Search, Settings, User, Users } from "lucide-react"
import { motion } from "framer-motion"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { GroupSwitcher } from "@/features/groups"
import { useProfile } from "@/features/profile"
import {
  useUnreadActivityCount,
  useMarkActivityRead,
  useActivityFeed,
  useActivityRealtime,
  flattenActivityEvents,
  getEventDescription,
  ENTITY_ICONS,
} from "@/features/activity"
import { Brand } from "./Brand"

const links = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/search", label: "Buscar", icon: Search },
  { href: "/library", label: "Biblioteca", icon: Bookmark },
  { href: "/lists", label: "Listas", icon: ListChecks },
  { href: "/activity", label: "Actividad", icon: Activity },
  { href: "/stats", label: "Estadísticas", icon: BarChart3 },
]

// =========================
// Relative Time Helper
// =========================
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "ahora";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

// =========================
// Notifications Panel
// =========================
function NotificationsPanel() {
  const { data: unreadData } = useUnreadActivityCount();
  const { data: feedData, isLoading } = useActivityFeed({ limit: 8, enabled: true });
  const { mutate: markRead, isPending: isMarking } = useMarkActivityRead();

  // Subscribe to realtime updates
  useActivityRealtime();

  const count = unreadData?.count ?? 0;
  const events = flattenActivityEvents(feedData?.pages);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          title="Notificaciones"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-lg">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
          <span className="text-sm font-semibold">Notificaciones</span>
          {count > 0 && (
            <button
              onClick={() => markRead()}
              disabled={isMarking}
              className="text-xs text-primary hover:underline disabled:opacity-50 flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Marcar como leído
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Cargando...
            </div>
          ) : events.length === 0 ? (
            <div className="py-8 text-center">
              <User className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mt-2">Sin actividad reciente</p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 px-3 py-2.5 hover:bg-white/5 border-b border-white/5 last:border-0"
              >
                {event.profiles?.avatar_url ? (
                  <Image
                    src={event.profiles.avatar_url}
                    alt=""
                    width={32}
                    height={32}
                    className="rounded-full shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-300 shrink-0">
                    {(event.profiles?.display_name ?? "U")[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm" aria-hidden>
                      {ENTITY_ICONS[event.entity_type]}
                    </span>
                    <p className="text-xs text-gray-300 line-clamp-2">
                      {getEventDescription(event)}
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {getRelativeTime(event.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/activity"
            className="flex items-center justify-center gap-2 text-sm text-primary"
          >
            <Activity className="h-4 w-4" />
            Ver toda la actividad
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// =========================
// User Menu
// =========================
function UserMenu() {
  const { data: profile, isLoading } = useProfile();

  const initials = (profile?.display_name ?? profile?.email ?? "U")[0].toUpperCase();
  const displayName = profile?.display_name ?? profile?.email?.split("@")[0] ?? "Usuario";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 pr-3 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
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
          <span className="text-sm text-gray-300 hidden md:block max-w-[100px] truncate">
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
        <DropdownMenuItem asChild>
          <Link href="/settings/group" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Gestión de grupo
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// =========================
// Navbar Subcomponents
// =========================

function NavbarLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 p-1">
      {links.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="navbar-active-pill"
                className="absolute inset-0 z-[-1] rounded-full bg-white/10 dark:bg-white/10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menú</span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[540px] pr-0">
        <SheetHeader className="px-1 text-left">
          <SheetTitle asChild>
             <div className="scale-90 origin-left"><Brand /></div>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-8 flex flex-col gap-2">
           <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Navegación</p>
          {links.map(({ href, label, icon: Icon }) => {
             const isActive = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2",
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// =========================
// Main Navbar
// =========================

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60 h-16">
      <div className="relative mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-4">
          <Brand />
        </div>

        {/* Center: Desktop Links */}
        <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <NavbarLinks />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* GroupSwitcher visible on desktop, hidden on mobile to save space (can be added to sheet if needed, but keeping simple for now) */}
          <div className="hidden md:block">
            <GroupSwitcher />
          </div>

          <div className="hidden md:block h-6 w-px bg-white/10" />

          <NotificationsPanel />
          <UserMenu />

          <MobileNav />
        </div>
      </div>
    </header>
  );
}
