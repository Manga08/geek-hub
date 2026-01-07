import Link from "next/link";
import { User, Users, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Administra tu cuenta y las preferencias de tu grupo.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Link href="/settings/profile" className="group block focus:outline-none">
          <GlassCard variant="clickable" className="h-full p-6 flex flex-col justify-between overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 ring-1 ring-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-blue-400 transition-colors">
                  Perfil Personal
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Actualiza tu avatar, nombre visible y contraseña.
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-6 flex items-center text-sm font-medium text-blue-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              Ir al perfil <ChevronRight className="ml-1 h-4 w-4" />
            </div>

            {/* Subtle gradient blob on hover */}
            <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl transition-opacity opacity-0 group-hover:opacity-100 duration-500" />
          </GlassCard>
        </Link>

        {/* Group Card */}
        <Link href="/settings/group" className="group block focus:outline-none">
          <GlassCard variant="clickable" className="h-full p-6 flex flex-col justify-between overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 ring-1 ring-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-amber-400 transition-colors">
                  Gestión del Grupo
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Administra miembros, roles e invitaciones.
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-6 flex items-center text-sm font-medium text-amber-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              Gestionar grupo <ChevronRight className="ml-1 h-4 w-4" />
            </div>

            {/* Subtle gradient blob on hover */}
            <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl transition-opacity opacity-0 group-hover:opacity-100 duration-500" />
          </GlassCard>
        </Link>
      </div>
    </div>
  );
}
