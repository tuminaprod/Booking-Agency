import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: path.resolve(__dirname) },
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    qualities: [60, 75, 85],
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/photo-*" }],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
