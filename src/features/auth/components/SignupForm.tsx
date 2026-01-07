"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUpAction } from "@/features/auth/actions";

const initialState = { error: undefined as string | undefined, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Registrando..." : "Crear cuenta"}
    </Button>
  );
}

export function SignupForm() {
  const [state, formAction] = useFormState(signUpAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Correo electrónico</label>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Contraseña</label>
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? (
        <p className="text-sm text-emerald-400">
          Revisa tu correo para confirmar la cuenta y luego inicia sesión.
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
