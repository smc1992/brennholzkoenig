'use client';

import React from 'react';
import Link from 'next/link';
import { useCityButtons, CityButtonConfig } from '@/hooks/useCityButtons';

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

interface CityButtonProps {
  type: 'primary' | 'secondary' | 'calculator' | 'testimonial' | 'process' | 'hero' | 'hero_secondary' | 'shop' | 'contact' | 'phone' | 'whatsapp';
  cityData?: CityPageData | null;
  className?: string;
  children?: React.ReactNode;
  customText?: string;
  customUrl?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const getButtonStyles = (variant: string = 'default', size: string = 'md') => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'bg-[#C04020] text-white hover:bg-[#A03318] focus:ring-[#C04020]',
    outline: 'border-2 border-[#C04020] text-[#C04020] hover:bg-[#C04020] hover:text-white focus:ring-[#C04020]',
    ghost: 'text-[#C04020] hover:bg-[#C04020]/10 focus:ring-[#C04020]'
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-lg'
  };
  
  return `${baseStyles} ${variants[variant as keyof typeof variants]} ${sizes[size as keyof typeof sizes]}`;
};

export function CityButton({ 
  type, 
  cityData, 
  className = '', 
  children, 
  customText, 
  customUrl,
  variant = 'default',
  size = 'md'
}: CityButtonProps) {
  const buttonConfig = useCityButtons(cityData);
  
  const getButtonData = () => {
    if (customText && customUrl) {
      return { text: customText, url: customUrl };
    }
    
    switch (type) {
      case 'primary':
        return { 
          text: buttonConfig.primary_cta_text || 'Jetzt bestellen', 
          url: buttonConfig.primary_cta_url || '/shop' 
        };
      case 'secondary':
        return { 
          text: buttonConfig.secondary_cta_text || 'Kostenlose Beratung', 
          url: buttonConfig.secondary_cta_url || 'tel:+4917671085234' 
        };
      case 'calculator':
        return { 
          text: buttonConfig.calculator_cta_text || 'Jetzt Premium-Qualität bestellen', 
          url: buttonConfig.shop_url || '/shop' 
        };
      case 'testimonial':
        return { 
          text: buttonConfig.testimonial_cta_text || 'Jetzt Premium-Qualität bestellen', 
          url: buttonConfig.shop_url || '/shop' 
        };
      case 'process':
        return { 
          text: buttonConfig.process_cta_text || 'Jetzt bestellen & sparen', 
          url: buttonConfig.shop_url || '/shop' 
        };
      case 'hero':
        return { 
          text: buttonConfig.hero_cta_text || 'Jetzt bestellen', 
          url: buttonConfig.primary_cta_url || '/shop' 
        };
      case 'hero_secondary':
        return { 
          text: buttonConfig.hero_secondary_cta_text || 'Kostenlose Beratung', 
          url: buttonConfig.secondary_cta_url || 'tel:+4917671085234' 
        };
      case 'shop':
        return { 
          text: 'Zum Shop', 
          url: buttonConfig.shop_url || '/shop' 
        };
      case 'contact':
        return { 
          text: 'Kontakt', 
          url: buttonConfig.contact_url || '/kontakt' 
        };
      case 'phone':
        const phone = buttonConfig.contact_phone_display || '+49 176 71085234';
        return { 
          text: phone, 
          url: `tel:${phone.replace(/\s+/g, '')}` 
        };
      case 'whatsapp':
        return { 
          text: 'WhatsApp', 
          url: buttonConfig.contact_whatsapp_url || 'https://wa.me/4917671085234' 
        };
      default:
        return { text: 'Button', url: '#' };
    }
  };
  
  const { text, url } = getButtonData();
  const buttonStyles = getButtonStyles(variant, size);
  
  // Check if it's an external link or special protocol
  const isExternal = url.startsWith('http') || url.startsWith('tel:') || url.startsWith('mailto:');
  
  if (isExternal) {
    return (
      <a
        href={url}
        className={`${buttonStyles} ${className}`}
        target={url.startsWith('http') ? '_blank' : undefined}
        rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children || text}
      </a>
    );
  }
  
  return (
    <Link href={url} className={`${buttonStyles} ${className}`}>
      {children || text}
    </Link>
  );
}

// Convenience components for common button types
export function PrimaryCityButton(props: Omit<CityButtonProps, 'type'>) {
  return <CityButton {...props} type="primary" />;
}

export function SecondaryCityButton(props: Omit<CityButtonProps, 'type'>) {
  return <CityButton {...props} type="secondary" variant="outline" />;
}

export function ShopCityButton(props: Omit<CityButtonProps, 'type'>) {
  return <CityButton {...props} type="shop" />;
}

export function ContactCityButton(props: Omit<CityButtonProps, 'type'>) {
  return <CityButton {...props} type="contact" variant="outline" />;
}

export function PhoneCityButton(props: Omit<CityButtonProps, 'type'>) {
  return <CityButton {...props} type="phone" variant="ghost" />;
}

export function WhatsAppCityButton(props: Omit<CityButtonProps, 'type'>) {
  return <CityButton {...props} type="whatsapp" variant="outline" />;
}