import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Remove dev tools in production build
  devIndicators: false,
  productionBrowserSourceMaps: false,
  // Generate a standalone build ideal for private hosting
  output: 'standalone',
};

export default nextConfig;
