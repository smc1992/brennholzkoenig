
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: (...args: unknown[]) => void;
  }
}

interface FacebookPixelProps {
  pixelId: string;
}

export default function FacebookPixel({ pixelId }: FacebookPixelProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pixelId || typeof window === 'undefined') return;

    // Initialize Facebook Pixel
    const initFacebookPixel = (): void => {
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
      `;
      document.head.appendChild(script);

      // Initialize pixel and track page view
      if (window.fbq) {
        window.fbq('init', pixelId);
        window.fbq('track', 'PageView');
      }
    };

    initFacebookPixel();
  }, [pixelId]);

  // Track page views when pathname changes
  useEffect(() => {
    if (window.fbq && pathname) {
      window.fbq('track', 'PageView');
    }
  }, [pathname]);

  // Tracking functions
  const trackEvent = (eventName: string, parameters?: Record<string, unknown>): void => {
    if (window.fbq) {
      window.fbq('track', eventName, parameters);
    }
  };

  const trackCustomEvent = (eventName: string, parameters?: Record<string, unknown>): void => {
    if (window.fbq) {
      window.fbq('trackCustom', eventName, parameters);
    }
  };

  // Make tracking functions globally available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).fbPixelTrack = trackEvent;
      (window as any).fbPixelTrackCustom = trackCustomEvent;
    }
  }, []);

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
