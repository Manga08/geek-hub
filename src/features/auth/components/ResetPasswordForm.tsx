"use client";

import { useFormState, useFormStatus } from "react-dom";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePasswordAction } from "@/features/auth/actions";

const initialState = { error: undefined as string | undefined };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Actualizando..." : "Actualizar contraseña"}
    </Button>
  );
}

export function ResetPasswordForm() {
  const [state, formAction] = useFormState(updatePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-center gap-3 pb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
          <KeyRound className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
        </p>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Nueva contraseña</label>
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          minLength={6}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Confirmar contraseña</label>
        <Input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          minLength={6}
          required
        />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
