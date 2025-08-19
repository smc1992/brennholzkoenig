/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration
  reactStrictMode: false,
  swcMinify: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  
  // Output standalone for better Docker compatibility
  output: 'standalone',
  // Explizite Konfiguration für Produktionsumgebung
  distDir: '.next',
  
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

// Explizit Port 3000 setzen und sicherstellen, dass er nicht überschrieben wird
process.env.PORT = '3000';
// Explizit auf alle Netzwerkinterfaces binden
process.env.HOSTNAME = '0.0.0.0';

module.exports = nextConfig;
