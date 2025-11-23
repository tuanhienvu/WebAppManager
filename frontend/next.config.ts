import type { NextConfig } from 'next';

const isStaticExport = process.env.STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  productionBrowserSourceMaps: false,
  output: isStaticExport ? 'export' : 'standalone',
  images: {
    unoptimized: isStaticExport,
  },
  trailingSlash: isStaticExport,
};

export default nextConfig;
