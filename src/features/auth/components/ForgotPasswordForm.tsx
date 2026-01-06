"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordResetAction } from "@/features/auth/actions";

const initialState = { error: undefined as string | undefined, success: undefined as boolean | undefined };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Enviando..." : "Enviar enlace de recuperación"}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState(requestPasswordResetAction, initialState);

  if (state?.success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Revisa tu email</h3>
          <p className="text-sm text-muted-foreground">
            Si existe una cuenta con ese email, te hemos enviado un enlace para restablecer tu contraseña.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
      </p>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Email</label>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          required
        />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <SubmitButton />
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al login
        </Link>
      </div>
    </form>
  );
}
