
'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
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
    if (!isMountedRef.current || typeof window === 'undefined') return;

    // Prüfe Cookie-Einwilligung
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) return;

    const preferences = JSON.parse(consent);
    if (!preferences.analytics) return;

    // Deaktiviert bis gültige IDs konfiguriert sind
    // loadTrackingScripts();
  }, []);

  const loadTrackingScripts = async () => {
    if (!isMountedRef.current || typeof window === 'undefined') return;

    try {
      // Nur laden wenn gültige Tracking-IDs vorhanden sind
      const config = {
        tracking_active: false, // Deaktiviert
        google_analytics_enabled: false,
        google_tag_manager_enabled: false,
        google_analytics_id: '',
        google_tag_manager_id: ''
      };

      if (!config.tracking_active || !config.google_analytics_id || config.google_analytics_id === 'GA_MEASUREMENT_ID') return;

      // Lade Google Analytics wenn aktiviert
      if (config.google_analytics_id && config.google_analytics_enabled && isMountedRef.current) {
        loadGA4(config.google_analytics_id);
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

      // Konfiguriere Consent nur wenn component mounted ist
      if (isMountedRef.current) {
        const consent = localStorage.getItem('cookie-consent');
        const preferences = consent ? JSON.parse(consent) : {};

        window.gtag('consent', 'default', {
          'analytics_storage': 'granted',
          'ad_storage': preferences.marketing ? 'granted' : 'denied',
          'functionality_storage': 'granted', 
          'personalization_storage': preferences.marketing ? 'granted' : 'denied',
          'security_storage': 'granted'
        });

        // Konfiguriere GA4 mit DSGVO-Einstellungen
        window.gtag('config', gaId, {
          anonymize_ip: true,
          cookie_flags: 'secure;samesite=lax',
          send_page_view: true
        });
      }
    }
  };

  return null;
}

// Erweiterte Ecommerce Tracking Functions
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
        category: 'Brennholz',
        category2: item.wood_type || 'Mixed',
        quantity: item.quantity,
        price: item.price,
        item_brand: 'Brennholzkönig',
        custom_parameters: {
          moisture_content: item.moisture || 'nicht angegeben',
          wood_species: item.species || 'gemischt',
          delivery_region: item.delivery_region || 'standard'
        }
      }))
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
        category2: woodType || 'Mixed',
        quantity: quantity,
        price: price,
        item_brand: 'Brennholzkönig'
      }]
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
        category2: woodType || 'Mixed',
        price: price,
        item_brand: 'Brennholzkönig'
      }]
    });
  }
};

export const trackSearch = (searchTerm: string, results?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'search', {
      search_term: searchTerm,
      number_of_results: results || 0,
      event_category: 'engagement'
    });
  }
};

export const trackContact = (method: string, location?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'contact', {
      method: method,
      event_category: 'engagement',
      event_label: 'Brennholz Beratung',
      contact_location: location || 'website'
    });
  }
};

export const trackQuoteRequest = (woodType: string, quantity: number, deliveryType: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'generate_lead', {
      event_category: 'lead_generation',
      event_label: 'Kostenvoranschlag',
      wood_type: woodType,
      quantity: quantity,
      delivery_type: deliveryType,
      value: 1,
      currency: 'EUR'
    });
  }
};
