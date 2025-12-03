import { useMemo } from 'react';

export interface CityButtonConfig {
  primary_cta_text?: string;
  primary_cta_url?: string;
  secondary_cta_text?: string;
  secondary_cta_url?: string;
  contact_phone_display?: string;
  contact_whatsapp_url?: string;
  shop_url?: string;
  contact_url?: string;
  calculator_cta_text?: string;
  testimonial_cta_text?: string;
  process_cta_text?: string;
  hero_cta_text?: string;
  hero_secondary_cta_text?: string;
  custom_buttons?: Record<string, any>;
}

interface CityPageData {
  slug?: string;
  city_name?: string;
  contact_phone?: string;
  contact_email?: string;
  primary_cta_text?: string;
  primary_cta_url?: string;
  secondary_cta_text?: string;
  secondary_cta_url?: string;
  contact_phone_display?: string;
  contact_whatsapp_url?: string;
  shop_url?: string;
  contact_url?: string;
  calculator_cta_text?: string;
  testimonial_cta_text?: string;
  process_cta_text?: string;
  hero_cta_text?: string;
  hero_secondary_cta_text?: string;
  custom_buttons?: Record<string, any>;
}

// Default fallback values
const DEFAULT_CONFIG: CityButtonConfig = {
  primary_cta_text: 'Jetzt bestellen',
  primary_cta_url: '/shop',
  secondary_cta_text: 'Kostenlose Beratung',
  secondary_cta_url: 'tel:+4917671085234',
  contact_phone_display: '+49 176 71085234',
  contact_whatsapp_url: 'https://wa.me/4917671085234',
  shop_url: '/shop',
  contact_url: '/kontakt',
  calculator_cta_text: 'Jetzt Premium-Qualität bestellen',
  testimonial_cta_text: 'Jetzt Premium-Qualität bestellen',
  process_cta_text: 'Jetzt bestellen & sparen',
  hero_cta_text: 'Jetzt bestellen',
  hero_secondary_cta_text: 'Kostenlose Beratung',
  custom_buttons: {}
};

export function useCityButtons(cityData?: CityPageData | null): CityButtonConfig {
  return useMemo(() => {
    if (!cityData) {
      return DEFAULT_CONFIG;
    }

    // Merge city-specific data with defaults
    return {
      primary_cta_text: cityData.primary_cta_text || DEFAULT_CONFIG.primary_cta_text,
      primary_cta_url: cityData.primary_cta_url || cityData.shop_url || DEFAULT_CONFIG.primary_cta_url,
      secondary_cta_text: cityData.secondary_cta_text || DEFAULT_CONFIG.secondary_cta_text,
      secondary_cta_url: cityData.secondary_cta_url || (cityData.contact_phone_display || cityData.phone_display ? `tel:${(cityData.contact_phone_display || cityData.phone_display).replace(/\s+/g, '')}` : DEFAULT_CONFIG.secondary_cta_url),
      contact_phone_display: cityData.contact_phone_display || cityData.phone_display || cityData.contact_phone || DEFAULT_CONFIG.contact_phone_display,
      contact_whatsapp_url: cityData.contact_whatsapp_url || cityData.whatsapp_url || DEFAULT_CONFIG.contact_whatsapp_url,
      shop_url: cityData.shop_url || DEFAULT_CONFIG.shop_url,
      contact_url: cityData.contact_url || '/kontakt',
      calculator_cta_text: cityData.calculator_cta_text || cityData.cost_calculator_cta_text || DEFAULT_CONFIG.calculator_cta_text,
      testimonial_cta_text: cityData.testimonial_cta_text || DEFAULT_CONFIG.testimonial_cta_text,
      process_cta_text: cityData.process_cta_text || DEFAULT_CONFIG.process_cta_text,
      hero_cta_text: cityData.hero_cta_text || DEFAULT_CONFIG.hero_cta_text,
      hero_secondary_cta_text: cityData.hero_secondary_cta_text || DEFAULT_CONFIG.hero_secondary_cta_text,
      custom_buttons: cityData.custom_buttons || DEFAULT_CONFIG.custom_buttons
    };
  }, [cityData]);
}

// Helper function to get phone link
export function getPhoneLink(cityData?: CityPageData | null): string {
  const config = useCityButtons(cityData);
  const phone = config.contact_phone_display || DEFAULT_CONFIG.contact_phone_display;
  return `tel:${phone?.replace(/\s+/g, '')}`;
}

// Helper function to get WhatsApp link
export function getWhatsAppLink(cityData?: CityPageData | null): string {
  const config = useCityButtons(cityData);
  return config.contact_whatsapp_url || DEFAULT_CONFIG.contact_whatsapp_url!;
}

// Helper function to get shop link
export function getShopLink(cityData?: CityPageData | null): string {
  const config = useCityButtons(cityData);
  return config.shop_url || DEFAULT_CONFIG.shop_url!;
}

// Helper function to get contact link
export function getContactLink(cityData?: CityPageData | null): string {
  const config = useCityButtons(cityData);
  return config.contact_url || DEFAULT_CONFIG.contact_url!;
}
