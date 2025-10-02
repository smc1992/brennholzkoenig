
'use client';

import { useEffect } from 'react';

interface SEOMetadataProps {
  pageSlug?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  url?: string;
  image?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  product?: {
    name?: string;
    price?: number | string;
    currency?: string;
    availability?: string;
    brand?: string;
  };
}

export function SEOMetadata({
  pageSlug = '/',
  title,
  description,
  keywords,
  url,
  defaultTitle = 'Brennholz König - Premium Brennholz & Kaminholz online kaufen',
  defaultDescription = 'Bestellen Sie hochwertiges Brennholz und Kaminholz beim Brennholz König. Schnelle Lieferung, faire Preise und erstklassige Qualität für Ihren Kamin und Ofen.',
  image = '/images/brennholz-hero.jpg',
  product
}: SEOMetadataProps) {
  
  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = finalTitle;
      
      let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', finalDescription);
      
      // Handle keywords
      if (keywords && keywords.length > 0) {
        let metaKeywords = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
        if (!metaKeywords) {
          metaKeywords = document.createElement('meta');
          metaKeywords.setAttribute('name', 'keywords');
          document.head.appendChild(metaKeywords);
        }
        metaKeywords.setAttribute('content', keywords.join(', '));
      }
      
      const updateMetaProperty = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };
      
      updateMetaProperty('og:title', finalTitle);
      updateMetaProperty('og:description', finalDescription);
      updateMetaProperty('og:image', image);
      updateMetaProperty('og:url', window.location.href);
      updateMetaProperty('og:type', product ? 'product' : 'website');
      
      const updateTwitterMeta = (name: string, content: string) => {
        let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };
      
      updateTwitterMeta('twitter:card', 'summary_large_image');
      updateTwitterMeta('twitter:title', finalTitle);
      updateTwitterMeta('twitter:description', finalDescription);
      updateTwitterMeta('twitter:image', image);

      // Inject JSON-LD Product schema if product data is provided
      if (product && (product.name || finalTitle)) {
        const priceValue = typeof product.price === 'number' ? product.price.toFixed(2) : (product.price || '');
        const currency = product.currency || 'EUR';
        const isAvailable = String(product.availability || '').toLowerCase();
        const availabilityUrl = isAvailable === 'outofstock' || isAvailable === 'out_of_stock'
          ? 'http://schema.org/OutOfStock'
          : 'http://schema.org/InStock';

        const productSchema = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name || finalTitle,
          description: finalDescription,
          image,
          brand: product.brand || 'Brennholz König',
          category: 'Brennholz',
          offers: {
            '@type': 'Offer',
            url: window.location.href,
            priceCurrency: currency,
            price: priceValue,
            availability: availabilityUrl,
            itemCondition: 'http://schema.org/NewCondition'
          }
        };

        let script = document.getElementById('jsonld-product') as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement('script');
          script.type = 'application/ld+json';
          script.id = 'jsonld-product';
          document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(productSchema);
      }
    }
  }, [finalTitle, finalDescription, image, product, keywords, url]);

  return null;
}

export default SEOMetadata;
