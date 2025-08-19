/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration
  reactStrictMode: false,
  swcMinify: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  
  // Output standalone for better Docker compatibility
  output: 'standalone',
  
  // Environment variables
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://brennholz-koenig.de'
  },
  
  // Disable strict checks for production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
