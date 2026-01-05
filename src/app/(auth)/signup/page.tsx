import Link from "next/link";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/features/auth/components/SignupForm";

export default function SignupPage() {
  return (
    <Card className="w-full max-w-md border-white/10 bg-card/90 shadow-2xl backdrop-blur-sm transition-transform duration-300 ease-out hover:-translate-y-0.5">
      <CardHeader>
        <CardTitle className="text-xl">Crear cuenta</CardTitle>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
      <CardFooter className="justify-between text-sm text-muted-foreground">
        <span>¿Ya tienes cuenta?</span>
        <Link href="/login" className="font-medium text-primary underline underline-offset-4">
          Inicia sesión
        </Link>
      </CardFooter>
    </Card>
  );
}
