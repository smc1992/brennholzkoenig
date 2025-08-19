/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration
  reactStrictMode: false,
  swcMinify: true,
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
  
  // Explizite Server-Konfiguration
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  
  // Erhöhte Timeouts für API-Routen
  serverRuntimeConfig: {
    api: {
      bodyParser: {
        sizeLimit: '1mb',
      },
      responseLimit: '4mb',
    },
  },
};

// Wir lassen die PORT und HOSTNAME Umgebungsvariablen vom Start-Skript setzen
// und nicht hier, um Konflikte zu vermeiden

module.exports = nextConfig;
