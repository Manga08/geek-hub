import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase URL or key is missing. Check your env vars.");
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        try {
          return cookieStore.getAll();
        } catch {
          return [];
        }
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        } catch {
          // In Server Components, cookies.set throws; swallow to avoid crashing the render.
        }
      },
    },
  });
}
