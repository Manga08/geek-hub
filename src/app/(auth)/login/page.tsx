import Link from "next/link";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md border-white/10 bg-card/90 shadow-2xl backdrop-blur-sm transition-transform duration-300 ease-out hover:-translate-y-0.5">
      <CardHeader>
        <CardTitle className="text-xl">Inicia sesión</CardTitle>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className="justify-between text-sm text-muted-foreground">
        <span>¿No tienes cuenta?</span>
        <Link href="/signup" className="font-medium text-primary underline underline-offset-4">
          Crear cuenta
        </Link>
      </CardFooter>
    </Card>
  );
}
