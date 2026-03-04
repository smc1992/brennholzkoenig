
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
    if (!preferences.preferences || !preferences.preferences.marketing) return;

    loadGoogleAds();
  }, []);

  const loadGoogleAds = async () => {
    try {
      // Lade Konfiguration aus API
      const res = await fetch('/api/google-ads-config');
      const cfg = await res.json();

      const conversionId = cfg.google_ads_id as string;
      const enabled = Boolean(cfg.conversion_tracking);

      if (!enabled || !conversionId || conversionId === 'AW-XXXXXXXXX') return;

      // Lade Google Ads Script wenn nicht bereits geladen
      // Wenn gtag nicht vorhanden (z.B. Analytics nicht erlaubt), lade gtag mit Ads-ID
      if (typeof window === 'undefined') return;
      const hasGtagScript = document.querySelector(`[src*="googletagmanager.com/gtag/js?id=${conversionId}"]`);
      if (!window.gtag && !hasGtagScript) {
        const gtagScript = document.createElement('script');
        gtagScript.async = true;
        gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${conversionId}`;
        document.head.appendChild(gtagScript);

        window.gtag = function() {
          if (!window.dataLayer) window.dataLayer = [];
          window.dataLayer.push(arguments);
        };

        window.gtag('js', new Date());
      }

      // Konfiguriere Ads-ID (auch wenn gtag bereits durch GA4 vorhanden ist)
      if (window.gtag) {
        window.gtag('config', conversionId, {
          allow_ad_personalization_signals: false
        });
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

export const trackGoogleAdsPurchase = async (orderId: string, value: number) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  // Consent-Gating
  try {
    const consentRaw = localStorage.getItem('cookie-consent');
    const consent = consentRaw ? JSON.parse(consentRaw) : null;
    if (!consent?.preferences?.marketing) return;
  } catch {}

  try {
    const res = await fetch('/api/google-ads-config');
    const cfg = await res.json();
    const conversionId: string | undefined = cfg.google_ads_id;
    const purchaseLabel: string | undefined = cfg.purchase_label;
    const remarketingEnabled: boolean = Boolean(cfg.remarketing);
    if (!cfg.conversion_tracking || !conversionId || !purchaseLabel) return;

    // Idempotenz-Guard pro Bestellung
    const guardKey = `ads-conv-${orderId}`;
    const alreadySent = window.sessionStorage?.getItem(guardKey) === '1';
    if (!alreadySent) {
      window.gtag('event', 'conversion', {
        send_to: `${conversionId}/${purchaseLabel}`,
        transaction_id: orderId,
        value: value || 0,
        currency: 'EUR'
      });
      try { window.sessionStorage?.setItem(guardKey, '1'); } catch {}
    }

    if (remarketingEnabled) {
      window.gtag('event', 'page_view', {
        send_to: `${conversionId}/${purchaseLabel}`,
        currency: 'EUR'
      });
    }
  } catch (error) {
    console.warn('Google Ads Purchase Tracking Fehler:', error);
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
