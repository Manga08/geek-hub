import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml (SEO)
     * - api/* (API routes handle their own auth via request-context)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)",
  ],
};
