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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_at_18%_18%,rgba(139,92,246,0.16),transparent_45%),radial-gradient(1100px_at_82%_0%,rgba(34,211,238,0.14),transparent_40%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-primary/40 via-transparent to-primary/40" aria-hidden />
      <div className="relative w-full max-w-lg">
        <div className="absolute inset-0 -z-10 rounded-3xl bg-primary/15 blur-3xl" aria-hidden />
        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 shadow-2xl backdrop-blur-xl transition-transform duration-200 ease-out hover:-translate-y-0.5">
          {children}
        </div>
      </div>
    </div>
  );
}
