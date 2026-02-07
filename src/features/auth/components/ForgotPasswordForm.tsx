"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordResetAction } from "@/features/auth/actions";

const initialState = { error: undefined as string | undefined, success: undefined as boolean | undefined };

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
          Enviando...
        </>
      ) : (
        "Enviar enlace"
      )}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialState);

  if (state?.success) {
    return (
      <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shadow-lg shadow-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">Revisa tu email</h3>
          <p className="text-base text-muted-foreground leading-relaxed">
            Si existe una cuenta con ese email, te hemos enviado un enlace para restablecer tu contraseña.
          </p>
        </div>
        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <p className="text-sm text-muted-foreground text-center px-2">
        Ingresa tu email y te enviaremos las instrucciones para recuperar tu acceso.
      </p>
      
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground/90 ml-1">Correo electrónico</label>
        <div className="relative group">
          <Mail className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-300" />
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
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
      
      <div className="text-center pt-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio de sesión
        </Link>
      </div>
    </form>
  );
}
