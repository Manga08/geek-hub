import Link from "next/link";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Inicia sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="justify-between text-sm">
          <span className="text-zinc-600">¿No tienes cuenta?</span>
          <Link href="/signup" className="font-medium text-zinc-900 underline">
            Crear cuenta
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
