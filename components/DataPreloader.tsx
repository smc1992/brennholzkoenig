'use client';
import { usePreloadData } from '@/hooks/usePreloadData';
import { useEffect } from 'react';

// Komponente für das Preloading kritischer Daten
export default function DataPreloader() {
  // Preload kritische Daten beim App-Start
  usePreloadData();

  useEffect(() => {
    // Service Worker für besseres Caching registrieren (falls verfügbar)
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Prefetch kritische Ressourcen
    const prefetchResources = () => {
      // Prefetch wichtige Bilder
      const criticalImages = [
        '/images/brennholzkoenig-logo.webp?v=1', // Logo
        '/images/brennholzkoenig-logo-white.webp?v=1', // Footer Logo
      ];

      criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = src;
        document.head.appendChild(link);
      });

      // Prefetch wichtige Schriftarten
      const fontLink = document.createElement('link');
      fontLink.rel = 'prefetch';
      fontLink.href = 'https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css';
      document.head.appendChild(fontLink);
    };

    // Verzögertes Prefetching für bessere Initial Load Performance
    const timer = setTimeout(prefetchResources, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Diese Komponente rendert nichts sichtbares
  return null;
}