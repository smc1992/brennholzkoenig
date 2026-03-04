
'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    fbq: (...args: any[]) => void;
  }
}

export default function GoogleAnalytics() {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMountedRef.current || typeof window === 'undefined') {
      console.log('GoogleAnalytics: Component not mounted or window undefined');
      return;
    }

    console.log('GoogleAnalytics: Checking cookie consent...');

    // Prüfe Cookie-Einwilligung
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      console.log('GoogleAnalytics: No cookie consent found');
      return;
    }

    console.log('GoogleAnalytics: Cookie consent found:', consent);

    const consentData = JSON.parse(consent);
    if (!consentData.preferences || !consentData.preferences.analytics) {
      console.log('GoogleAnalytics: Analytics not allowed in preferences:', consentData.preferences);
      return;
    }

    console.log('GoogleAnalytics: Analytics allowed, loading tracking scripts...');

    // Lade Tracking-Scripts wenn Einwilligung vorhanden
    loadTrackingScripts();
  }, []);

  const loadTrackingScripts = async () => {
    if (!isMountedRef.current || typeof window === 'undefined') return;

    try {
      // Lade Konfiguration aus API
      const response = await fetch('/api/tracking-config');
      const config = await response.json();

      // Prüfe ob Tracking aktiviert ist
      if (!config.tracking_active) {
        console.log('Tracking deaktiviert in Admin-Konfiguration');
        return;
      }

      // Lade Google Analytics wenn aktiviert
      if (config.google_analytics_enabled && config.google_analytics_id && config.google_analytics_id !== 'GA_MEASUREMENT_ID' && isMountedRef.current) {
        console.log('Loading Google Analytics:', config.google_analytics_id);
        loadGA4(config.google_analytics_id);
      }

      // Lade Google Tag Manager wenn aktiviert
      if (config.google_tag_manager_enabled && config.google_tag_manager_id && config.google_tag_manager_id !== 'GTM-XXXXXXX' && isMountedRef.current) {
        console.log('Loading Google Tag Manager:', config.google_tag_manager_id);
        loadGTM(config.google_tag_manager_id);
      }

      // Lade Facebook Pixel wenn aktiviert
      if (config.facebook_pixel_enabled && config.facebook_pixel_id && config.facebook_pixel_id !== '123456789012345' && isMountedRef.current) {
        console.log('Loading Facebook Pixel:', config.facebook_pixel_id);
        loadFacebookPixel(config.facebook_pixel_id);
      }

    } catch (error) {
      console.error('Fehler beim Laden der Tracking-Konfiguration:', error);
    }
  };

  const loadGA4 = (gaId: string) => {
    if (!isMountedRef.current || typeof window === 'undefined' || typeof document === 'undefined') return;

    // Lade Google Analytics GA4 Script wenn nicht bereits geladen
    if (!document.querySelector(`[src*="googletagmanager.com/gtag/js?id=${gaId}"]`)) {
      const gaScript = document.createElement('script');
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(gaScript);

      // Initialisiere gtag
      window.gtag = function() {
        if (!window.dataLayer) window.dataLayer = [];
        window.dataLayer.push(arguments);
      };

      window.gtag('js', new Date()); 

      // Konfiguriere mit GDPR-konformen Einstellungen
      window.gtag('config', gaId, {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false
      });
    }
  };

  const loadGTM = (gtmId: string) => {
    if (!isMountedRef.current || typeof window === 'undefined' || typeof document === 'undefined') return;

    // Lade Google Tag Manager wenn nicht bereits geladen
    if (!document.querySelector(`[src*="googletagmanager.com/gtm.js?id=${gtmId}"]`)) {
      // GTM Script
      const gtmScript = document.createElement('script');
      gtmScript.async = true;
      gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
      document.head.appendChild(gtmScript);

      // GTM Inline Script
      const gtmInlineScript = document.createElement('script');
      gtmInlineScript.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');
      `;
      document.head.appendChild(gtmInlineScript);

      // GTM NoScript (für Body)
      const gtmNoScript = document.createElement('noscript');
      gtmNoScript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
      document.body.appendChild(gtmNoScript);
    }
  };

  const loadFacebookPixel = (pixelId: string) => {
    if (!isMountedRef.current || typeof window === 'undefined' || typeof document === 'undefined') return;

    // Lade Facebook Pixel wenn nicht bereits geladen
    if (!document.querySelector('[src*="connect.facebook.net"]')) {
      // Facebook Pixel Script
      const fbScript = document.createElement('script');
      fbScript.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
      `;
      document.head.appendChild(fbScript);

      // Initialisiere Pixel
      if (window.fbq) {
        window.fbq('init', pixelId);
        window.fbq('track', 'PageView');
      }
    }
  };

  return null;
}

// Tracking-Funktionen für E-Commerce
export const trackPurchase = (transactionId: string, value: number, items: any[], tax?: number, shipping?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: 'EUR',
      tax: tax || 0,
      shipping: shipping || 0,
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        category: item.category || 'Brennholz',
        quantity: item.quantity,
        price: item.price
      }))
    });
  }

  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', {
      value: value,
      currency: 'EUR'
    });
  }
};

export const trackAddToCart = (itemId: string, itemName: string, category: string, quantity: number, price: number, woodType?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: 'EUR',
      value: price * quantity,
      items: [{
        item_id: itemId,
        item_name: itemName,
        category: category,
        quantity: quantity,
        price: price,
        item_variant: woodType
      }]
    });
  }

  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddToCart', {
      value: price * quantity,
      currency: 'EUR'
    });
  }
};

export const trackViewProduct = (itemId: string, itemName: string, category: string, price: number, woodType?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_item', {
      currency: 'EUR',
      value: price,
      items: [{
        item_id: itemId,
        item_name: itemName,
        category: category,
        price: price,
        item_variant: woodType
      }]
    });
  }

  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'ViewContent', {
      value: price,
      currency: 'EUR'
    });
  }
};

export const trackSearch = (searchTerm: string, results?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'search', {
      search_term: searchTerm,
      results: results
    });
  }
};

export const trackContact = (method: string, location?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'contact', {
      method: method,
      location: location
    });
  }

  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Contact');
  }
};

export const trackQuoteRequest = (woodType: string, quantity: number, deliveryType: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'generate_lead', {
      currency: 'EUR',
      wood_type: woodType,
      quantity: quantity,
      delivery_type: deliveryType
    });
  }

  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead');
  }
};
