import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.rawg.io" },
      { protocol: "https", hostname: "image.tmdb.org" },
    ],
  },
  // Silencia el warning de Turbopack cuando usamos webpack
  turbopack: {},
};

export default nextConfig;
