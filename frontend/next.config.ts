import path from "path";
import type { NextConfig } from "next";

const isExport =
  process.env.NEXT_EXPORT === "true" ||
  process.env.npm_lifecycle_event === "cap:build";

const nextConfig: NextConfig = {
  // Only apply static export for Capacitor mobile builds, never in development or web production
  ...(isExport ? { output: "export", trailingSlash: true } : {}),

  // Set Turbopack root explicitly to this frontend directory
  turbopack: {
    root: path.resolve(__dirname),
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async rewrites() {
    // Rewrites are not permitted with static export
    if (isExport) {
      return [];
    }
    return [
      {
        source: "/api/backend/:path*",
        destination: "http://127.0.0.1:8000/:path*",
      },
    ];
  },
};

export default nextConfig;
