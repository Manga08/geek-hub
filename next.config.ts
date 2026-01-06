import type { NextConfig } from "next";

// Parse Supabase URL for image host
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.rawg.io" },
      { protocol: "https", hostname: "image.tmdb.org" },
      // Supabase Storage for avatars
      ...(supabaseHostname
        ? [{ protocol: "https" as const, hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }]
        : []),
    ],
  },
  // Silencia el warning de Turbopack cuando usamos webpack
  turbopack: {},
};

export default nextConfig;
