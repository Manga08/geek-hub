"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Lock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePasswordAction } from "@/features/auth/actions";

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
          Actualizando...
        </>
      ) : (
        "Actualizar contraseña"
      )}
    </Button>
  );
}

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="flex items-center gap-4 pb-2 p-3 bg-white/5 rounded-lg border border-white/5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
          <KeyRound className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground leading-snug">
          Ingresa tu nueva contraseña. Debe tener al menos <span className="text-foreground font-medium">6 caracteres</span>.
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground/90 ml-1">Nueva contraseña</label>
        <div className="relative group">
          <Lock className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-300" />
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={6}
            className="pl-11 h-11 border-white/10 bg-black/20 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-300"
            required
          />
        </div>
      </div>
      
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground/90 ml-1">Confirmar contraseña</label>
        <div className="relative group">
          <Lock className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-300" />
          <Input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={6}
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
