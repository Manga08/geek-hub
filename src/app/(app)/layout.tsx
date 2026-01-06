import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shared/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  // Use getSession() instead of getUser() - faster, no extra roundtrip
  // Session is already validated by middleware for page routes
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
