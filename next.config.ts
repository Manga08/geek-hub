import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.rawg.io" },
      { protocol: "https", hostname: "image.tmdb.org" },
    ],
  },
};

export default nextConfig;
