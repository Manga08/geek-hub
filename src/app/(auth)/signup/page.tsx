import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signUpAction } from "@/features/auth/actions";

const initialState = { error: undefined as string | undefined, success: false };

function SubmitButton() {
  "use client";
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Registrando..." : "Crear cuenta"}
    </Button>
  );
}

function SignupForm() {
  "use client";
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
      {state?.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="text-sm text-green-700">
          Revisa tu correo para confirmar la cuenta y luego inicia sesión.
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Crear cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
        <CardFooter className="justify-between text-sm">
          <span className="text-zinc-600">¿Ya tienes cuenta?</span>
          <Link href="/login" className="font-medium text-zinc-900 underline">
            Inicia sesión
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
