"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

const initialState = { error: undefined as string | undefined };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full h-11 font-semibold text-base shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 active:scale-[0.98]"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Iniciando sesión...
        </>
      ) : (
        "Iniciar sesión"
      )}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(signInAction, initialState);
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "ok";

  return (
    <form action={formAction} className="space-y-6">
      {resetSuccess ? (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400 flex items-center gap-3">
           <span className="text-lg">✓</span> Contraseña actualizada correctamente.
        </div>
      ) : null}

      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground/90 ml-1">Correo electrónico</label>
        <div className="relative group">
          <Mail className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-300" />
          <Input
            name="email"
            type="email"
            placeholder="usuario@ejemplo.com"
            autoComplete="email"
            className="pl-11 h-11 border-white/10 bg-black/20 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-300"
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between ml-1">
          <label className="text-sm font-medium text-foreground/90">Contraseña</label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="relative group">
          <Lock className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-300" />
          <Input
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className="pl-11 h-11 border-white/10 bg-black/20 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-300"
            required
          />
        </div>
      </div>

      {state?.error ? (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1 text-center">
          {state.error}
        </div>
      ) : null}

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
