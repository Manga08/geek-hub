import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // Early-return for API routes - they handle auth via request-context
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  const response = NextResponse.next({ request: { headers: request.headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (process.env.NODE_ENV === "development") {
      throw new Error("Supabase URL or key is missing. Check your env vars.");
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value;
      },
      set(name, value, options) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name, options) {
        response.cookies.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });

  // Refresh session/claims if needed
  await supabase.auth.getClaims();

  return response;
}
