import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Remove dev tools in production build
  devIndicators: false,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
