
'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export default function GoogleAdsTracking() {
  useEffect(() => {
    // Prüfe Cookie-Einwilligung
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) return;

    const preferences = JSON.parse(consent);
    if (!preferences.marketing) return;

    // Deaktiviert bis gültige Conversion-ID konfiguriert ist
    // loadGoogleAds();
  }, []);

  const loadGoogleAds = async () => {
    try {
      // Nur laden wenn gültige Conversion-ID vorhanden ist
      const config = {
        google_ads_enabled: false,
        google_ads_conversion_id: '',
        google_ads_conversion_labels: {
          purchase: '',
          lead: '',
          signup: ''
        }
      };

      if (!config.google_ads_enabled || !config.google_ads_conversion_id || config.google_ads_conversion_id === 'AW-XXXXXXXXX') return;

      // Lade Google Ads Script wenn nicht bereits geladen
      if (!document.querySelector(`[src*="googleadservices.com/pagead/conversion"]`)) {
        const adsScript = document.createElement('script');
        adsScript.async = true;
        adsScript.src = `https://www.googleadservices.com/pagead/conversion_async.js`;
        document.head.appendChild(adsScript);

        // Initialisiere Google Ads Tracking
        window.gtag = window.gtag || function() {
          if (!window.dataLayer) window.dataLayer = [];
          window.dataLayer.push(arguments);
        };

        window.gtag('config', config.google_ads_conversion_id);
      }
    } catch (error) {
      console.error('Fehler beim Laden von Google Ads Tracking:', error);
    }
  };

  return null;
}

// Google Ads Conversion Tracking Functions
export const trackGoogleAdsConversion = (conversionId: string, conversionLabel: string, value?: number, currency = 'EUR') => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      'send_to': `${conversionId}/${conversionLabel}`,
      'value': value || 0,
      'currency': currency,
      'transaction_id': Date.now().toString()
    });
  }
};

export const trackGoogleAdsPurchase = (orderId: string, value: number, items: any[]) => {
  if (typeof window !== 'undefined' && window.gtag) {
    // Standard Enhanced Ecommerce
    window.gtag('event', 'purchase', {
      'send_to': 'AW-XXXXXXXXX/PURCHASE_LABEL', // Wird über Admin konfiguriert
      'transaction_id': orderId,
      'value': value,
      'currency': 'EUR',
      'items': items.map(item => ({
        'item_id': item.id,
        'item_name': item.name,
        'category': 'Brennholz',
        'quantity': item.quantity,
        'price': item.price
      }))
    });

    // Zusätzliche Brennholz-spezifische Conversion
    window.gtag('event', 'conversion', {
      'send_to': 'AW-XXXXXXXXX/BRENNHOLZ_ORDER',
      'value': value,
      'currency': 'EUR',
      'custom_parameters': {
        'wood_type': items[0]?.wood_type || 'mixed',
        'delivery_region': items[0]?.delivery_region || 'standard',
        'order_season': new Date().getMonth() < 3 || new Date().getMonth() > 8 ? 'winter' : 'summer'
      }
    });
  }
};

export const trackGoogleAdsLead = (leadType: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      'send_to': 'AW-XXXXXXXXX/LEAD_LABEL',
      'value': value || 1,
      'currency': 'EUR',
      'custom_parameters': {
        'lead_type': leadType,
        'source_page': window.location.pathname
      }
    });
  }
};

export const trackGoogleAdsSignup = (method: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      'send_to': 'AW-XXXXXXXXX/SIGNUP_LABEL',
      'custom_parameters': {
        'signup_method': method
      }
    });
  }
};

export const trackGoogleAdsPageView = (pageTitle?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      'send_to': 'AW-XXXXXXXXX',
      'page_title': pageTitle || document.title,
      'page_location': window.location.href
    });
  }
};
