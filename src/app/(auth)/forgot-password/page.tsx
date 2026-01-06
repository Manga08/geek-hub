import Link from "next/link";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <Card className="w-full max-w-md border-white/10 bg-white/10 shadow-[0_20px_80px_-60px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-transform duration-200 ease-out hover:-translate-y-0.5">
      <CardHeader>
        <CardTitle className="text-xl">Recuperar contraseña</CardTitle>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
      <CardFooter className="justify-between text-sm text-muted-foreground">
        <span>¿Recordaste tu contraseña?</span>
        <Link href="/login" className="font-medium text-primary underline underline-offset-4">
          Inicia sesión
        </Link>
      </CardFooter>
    </Card>
  );
}
