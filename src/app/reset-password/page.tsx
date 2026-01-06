import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="absolute inset-0 -z-10 rounded-3xl bg-primary/15 blur-3xl" aria-hidden />
        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-1 shadow-2xl backdrop-blur-xl transition-transform duration-200 ease-out hover:-translate-y-0.5">
          <Card className="w-full border-white/10 bg-white/10 shadow-[0_20px_80px_-60px_rgba(0,0,0,0.9)] backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl">Nueva contraseña</CardTitle>
            </CardHeader>
            <CardContent>
              <ResetPasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
