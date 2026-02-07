import { redirect } from "next/navigation";
import { Brand } from "@/components/shared/Brand";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Esta página requiere sesión (viene del link de recuperación)
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground">
      {/* Radial gradient background */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_at_18%_18%,rgba(139,92,246,0.16),transparent_45%),radial-gradient(1100px_at_82%_0%,rgba(34,211,238,0.14),transparent_40%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,rgba(139,92,246,0.4),transparent,rgba(139,92,246,0.4),transparent)]" aria-hidden />
      
      <div className="relative w-full max-w-lg">
        <div className="absolute inset-0 -z-10 rounded-3xl bg-primary/15 blur-3xl opacity-50" aria-hidden />
        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 shadow-2xl backdrop-blur-xl transition-transform duration-200 ease-out hover:-translate-y-0.5">
          <div className="flex flex-col items-center gap-8 w-full">
            <div className="flex flex-col items-center gap-2">
              <Brand className="scale-110" />
            </div>

            <Card className="w-full max-w-md border-0 bg-transparent shadow-none p-0">
              <CardHeader className="text-center space-y-2 pb-6 pt-0 px-0">
                <CardTitle className="text-2xl font-bold tracking-tight">Nueva contraseña</CardTitle>
                <CardDescription className="text-base">
                  Establece una contraseña segura para tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6 px-0">
                <ResetPasswordForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
