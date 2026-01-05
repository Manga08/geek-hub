import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/search");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),transparent_45%)]" aria-hidden />
      <div className="relative w-full max-w-lg">
        <div className="absolute inset-0 -z-10 rounded-3xl bg-primary/15 blur-3xl" aria-hidden />
        <div className="relative rounded-2xl border border-white/10 bg-black/60 p-1 shadow-2xl backdrop-blur transition-transform duration-300 ease-out hover:-translate-y-0.5">
          {children}
        </div>
      </div>
    </div>
  );
}
