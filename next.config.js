/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Changed to false to avoid double-rendering in production
  swcMinify: true,
  images: { unoptimized: true },
  // Production optimizations
  poweredByHeader: false,
  // Improved output configuration
  output: 'standalone',
  // Adjust server configuration
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  // Adjust for Coolify deployment
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://brennholz-koenig.de'
  }
};

module.exports = nextConfig;
