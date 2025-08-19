/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Changed to false to avoid double-rendering in production
  swcMinify: true,
  images: { unoptimized: true },
  // Production optimizations
  poweredByHeader: false,
  // Improved output configuration for Coolify Docker deployment
  output: 'standalone',
  // Disable server actions for better compatibility
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    serverActions: false
  },
  // Adjust for Coolify deployment
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://brennholz-koenig.de'
  },
  // Explicitly set distDir for Coolify
  distDir: '.next',
  // Increase timeout for API routes
  serverRuntimeConfig: {
    api: {
      bodyParser: {
        sizeLimit: '1mb',
      },
      responseLimit: '4mb',
    },
  },
  // Disable strict mode for production
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
