import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOutAction } from "@/features/auth/actions";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const email = session.user.email ?? "(sin email)";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Inicio</h1>
          <p className="text-sm text-zinc-600">Logged in as {email}</p>
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" className="w-full">
            Logout
          </Button>
        </form>
      </div>
    </div>
  );
}
