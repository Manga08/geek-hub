import Link from "next/link";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/features/auth/components/SignupForm";

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
