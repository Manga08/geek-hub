import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.rawg.io" },
      { protocol: "https", hostname: "image.tmdb.org" },
      // Supabase Storage
      {
        protocol: "https",
        hostname: "skthoyxeyhrhrwlszmay.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Reduce image quality warnings
    qualities: [75, 80, 85],
  },
  // Silencia el warning de Turbopack cuando usamos webpack
  turbopack: {},
};

export default nextConfig;
