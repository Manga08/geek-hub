import Link from "next/link";
import { Brand } from "@/components/shared/Brand";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="flex flex-col items-center gap-2">
        <Brand className="scale-110" />
      </div>

      <Card className="w-full max-w-md border-0 bg-transparent shadow-none p-0">
        <CardHeader className="text-center space-y-2 pb-6 pt-0 px-0">
          <CardTitle className="text-2xl font-bold tracking-tight">Recuperar contraseña</CardTitle>
          <CardDescription className="text-base">
            No te preocupes, te ayudaremos a recuperar tu acceso
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6 px-0">
          <ForgotPasswordForm />
        </CardContent>
        <CardFooter className="flex flex-col gap-5 text-sm text-muted-foreground pt-2 px-0">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 w-full">
            <span>¿Recordaste tu contraseña?</span>
            <Link 
              href="/login" 
              className="font-semibold text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
            >
              Inicia sesión
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
