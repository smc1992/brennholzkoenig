'use client';

import { useEffect, useState } from 'react';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';

interface SEOMetadata {
  title?: string;
  description?: string;
  keywords?: string | string[];
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  canonical_url?: string;
  robots?: string;
  schema_markup?: any;
}

export interface SEOMetadataProps {
  title: string;
  description: string;
  keywords?: string[];
  url: string;
}

interface SEOManagerProps {
  pagePath: string;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultImage?: string;
}

export default function SEOManager({ 
  pagePath, 
  defaultTitle, 
  defaultDescription, 
  defaultImage 
}: SEOManagerProps) {
  const [seoData, setSeoData] = useState<SEOMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSEOData();
  }, [pagePath]);

  const loadSEOData = async () => {
    try {
      const { data } = await supabase
        .from('seo_metadata')
        .select('*')
        .eq('page_path', pagePath)
        .single();
      
      setSeoData(data);
    } catch (error) {
      console.error('SEO-Daten konnten nicht geladen werden:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const title = seoData?.title || defaultTitle || 'Brennholz König';
  const description = seoData?.description || defaultDescription || 'Premium Brennholz direkt vom Erzeuger';
  const ogTitle = seoData?.og_title || title;
  const ogDescription = seoData?.og_description || description;
  const ogImage = seoData?.og_image || defaultImage || 'https://readdy.ai/api/search-image?query=Premium%20stacked%20firewood%20logs%20in%20forest%20setting%20with%20warm%20sunlight%20filtering%20through%20trees%2C%20natural%20wood%20texture%2C%20sustainable%20forestry%2C%20high%20quality%20dried%20wood%20for%20fireplace%2C%20rustic%20outdoor%20atmosphere%2C%20professional%20photography&width=1200&height=630&seq=seo-default&orientation=landscape';
  
  const canonicalUrl = seoData?.canonical_url || `https://brennholz-koenig.de${pagePath}`;
  const robots = seoData?.robots || 'index,follow';

  // Generate Schema.org structured data
  const generateSchemaMarkup = () => {
    if (seoData?.schema_markup) {
      return seoData.schema_markup;
    }

    // Default schema for business
    const defaultSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Brennholz König",
      "description": description,
      "url": "https://brennholz-koenig.de",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Frankfurter Straße 3",
        "addressLocality": "Buttlar",
        "postalCode": "36419",
        "addressCountry": "DE"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+49-123-456789",
        "contactType": "customer service"
      },
      "openingHours": "Mo-Fr 08:00-18:00, Sa 09:00-16:00"
    };

    // Page-specific schema
    if (pagePath === '/shop') {
      return {
        "@context": "https://schema.org",
        "@type": "Store",
        "name": "Brennholz König Shop",
        "description": "Hochwertiges Brennholz online kaufen",
        "url": "https://brennholz-koenig.de/shop"
      };
    } else if (pagePath.startsWith('/shop/')) {
      return {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": title,
        "description": description,
        "category": "Brennholz"
      };
    }

    return defaultSchema;
  };

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {seoData?.keywords && <meta name="keywords" content={Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : seoData.keywords} />}
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Brennholz König" />
      <meta property="og:locale" content="de_DE" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={seoData?.twitter_title || ogTitle} />
      <meta property="twitter:description" content={seoData?.twitter_description || ogDescription} />
      <meta property="twitter:image" content={seoData?.twitter_image || ogImage} />

      {/* Additional Meta Tags */}
      <meta name="author" content="Brennholz König" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="German" />
      <meta name="geo.region" content="DE-TH" />
      <meta name="geo.placename" content="Buttlar" />

      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateSchemaMarkup())
        }}
      />
    </Head>
  );
}