"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
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
        <label className="block text-sm font-medium">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium">Password</label>
        <input
          name="password"
          type="password"
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.success ? (
        <p className="text-sm text-green-700">
          Revisa tu correo para confirmar la cuenta y luego inicia sesión.
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
