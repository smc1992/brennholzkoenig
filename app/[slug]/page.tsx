'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import CityHeroSection from '@/components/CityHeroSection';
import USPSection from '@/components/USPSection';
import QualifierSection from '@/components/QualifierSection';
import LocalServiceSection from '@/components/LocalServiceSection';
import RegionSection from '@/components/RegionSection';
import SEOMetadata from '@/components/SEOMetadata';
import LocalLandmarksSection from '@/components/LocalLandmarksSection';
// ServiceAreaDetailsSection entfernt
import LocalFAQSection from '@/components/LocalFAQSection';
import LocalPartnershipsSection from '@/components/LocalPartnershipsSection';
// ExtendedDeliveryInfoSection entfernt
// GoogleMapsIntegrationSection entfernt
import LocalKeywordOptimizer from '@/components/LocalKeywordOptimizer';
import LocalContentEnhancer from '@/components/LocalContentEnhancer';
import { notFound } from 'next/navigation';

interface CityPage {
  id: string;
  slug: string;
  city_name: string;
  meta_title: string;
  meta_description: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url?: string;
  city_image_url?: string;
  content_section_1_main_title?: string;
  content_section_1_subtitle?: string;
  content_section_1_title?: string;
  content_section_1_content?: string;
  content_section_1_image_url?: string;
  content_section_2_title?: string;
  content_section_2_content?: string;
  content_section_2_image_url?: string;
  content_section_3_title?: string;
  content_section_3_content?: string;
  content_section_3_image_url?: string;
  local_keywords: string[];
  postal_codes: string[];
  service_areas?: string[];
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  delivery_info?: string;
  special_offers?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Lokale Service-Sektion Felder
  local_service_title?: string;
  local_service_subtitle?: string;
  local_service_description?: string;
  local_service_areas?: Array<{
    name: string;
    category: string;
    title: string;
    description: string;
    badge: string;
    cta_text?: string;
  }>;
  local_service_expertise_title?: string;
  local_service_expertise_description?: string;
  local_service_expertise_benefits?: Array<{
    title: string;
    description: string;
  }>;
  local_service_rooted_title?: string;
  local_service_rooted_description?: string;

  // Testimonial Section Felder
  testimonial_badge_text?: string;
  testimonial_title?: string;
  testimonial_description?: string;
  testimonial_image_url?: string;
  testimonial_reviews?: Array<{
    name: string;
    initials?: string;
    role?: string;
    order_info?: string;
    rating?: number;
    text?: string;
    date?: string;
    verified?: boolean;
  }>;
  testimonial_cta_text?: string;
  // Local SEO Fields - Editierbare Inhalte
  local_faqs?: {
    id: string;
    question: string;
    answer: string;
    category: 'delivery' | 'quality' | 'pricing' | 'local' | 'service';
  }[];
  service_areas_details?: {
    id: string;
    name: string;
    description: string;
    postal_codes: string[];
    delivery_time: string;
  }[];
  // Erweiterte Lieferinformationen (Datenbank-Formate)
  // Editierbare Texte für die Lieferservice-Sektion
  extended_delivery_info_title?: string;
  extended_delivery_info_description?: string;
  delivery_zones?: Array<{
    name: string;
    areas: string[];
    delivery_time: string;
    fee: number;
    min_order?: number;
    special_notes?: string;
    postal_codes: string[];
  }>;
  delivery_routes?: Array<{
    name: string;
    days: string[];
    time_slots: string[];
    zones: string[];
  }>;
  seasonal_events?: Array<{
    title: string;
    description: string;
    season: 'spring' | 'summer' | 'autumn' | 'winter';
    month: number;
    type: 'festival' | 'market' | 'tradition' | 'weather' | 'special_offer';
    icon: string;
    relevant_products?: string[];
    special_offer?: {
      discount: number;
      description: string;
      valid_until: string;
    };
  }>;
}

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CityLandingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [cityPage, setCityPage] = useState<CityPage | null>(null);
  const [localBusinessData, setLocalBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCityPage() {
      try {
        setLoading(true);
        

        // Versuche zuerst Supabase-Daten zu laden
        try {
          const { data, error } = await supabase
            .from('city_pages')
            .select('*')
            .eq('slug', slug)
            .eq('is_active', true);

          if (!error && data && data.length > 0) {
            setCityPage(data[0]);
          } else {
            console.log('No city page found for slug:', slug);
            notFound();
            return;
          }
        } catch (supabaseError) {
          console.log('Supabase error:', supabaseError);
          notFound();
          return;
        }

        // Versuche Local Business-Daten zu laden (optional)
        try {
          const { data: businessData, error: businessError } = await supabase
            .from('local_business_settings')
            .select('*')
            .single();

          if (!businessError && businessData) {
            setLocalBusinessData(businessData);
          }
        } catch (businessError) {
          console.log('Business data not available:', businessError);
        }

      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Unerwarteter Fehler beim Laden der Seite');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchCityPage();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-pergament flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Seite wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-pergament flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-wood-800 mb-4">Fehler</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!cityPage) {
    notFound();
    return null;
  }

  // Strukturierte Daten für Local SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": localBusinessData?.business_name ? 
      `${localBusinessData.business_name} ${cityPage.city_name}` : 
      `Brennholz König ${cityPage.city_name}`,
    "description": localBusinessData?.business_description || cityPage.meta_description,
    "url": localBusinessData?.website_url || `https://brennholz-koenig.de/${cityPage.slug}`,
    "telephone": localBusinessData?.phone || cityPage.contact_phone,
    "email": localBusinessData?.email || cityPage.contact_email,
    "address": localBusinessData?.address ? {
      "@type": "PostalAddress",
      "streetAddress": localBusinessData.address,
      "addressLocality": cityPage.city_name,
      "addressCountry": "DE"
    } : undefined,
    "geo": localBusinessData?.latitude && localBusinessData?.longitude ? {
      "@type": "GeoCoordinates",
      "latitude": localBusinessData.latitude,
      "longitude": localBusinessData.longitude
    } : undefined,
    "areaServed": localBusinessData?.service_areas ? 
      localBusinessData.service_areas.map((area: string) => ({
        "@type": "City",
        "name": area
      })) : 
      (cityPage.service_areas || [cityPage.city_name]).map(area => ({
        "@type": "City",
        "name": area
      })),
    "serviceType": "Brennholz Lieferung",
    "priceRange": localBusinessData?.price_range || "€€",
    "openingHours": localBusinessData?.opening_hours || "Mo-Fr 08:00-18:00, Sa 09:00-16:00",
    "paymentAccepted": localBusinessData?.payment_methods || ["Cash", "Credit Card", "Bank Transfer"],
    "currenciesAccepted": localBusinessData?.accepted_currencies || "EUR",
    "sameAs": localBusinessData?.google_maps_url ? [localBusinessData.google_maps_url] : undefined
  };

  return (
    <>
      <SEOMetadata 
        pageSlug={`/${cityPage.slug}`}
        defaultTitle={cityPage.meta_title}
        defaultDescription={cityPage.meta_description}
        keywords={cityPage.local_keywords}
      />

      {/* Strukturierte Daten für Local SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />

      <div className="min-h-dvh bg-pergament w-full">
        {/* Hero Section mit stadtspezifischen Inhalten */}
        <CityHeroSection 
          cityName={cityPage.city_name}
          heroTitle={cityPage.hero_title}
          heroSubtitle={cityPage.hero_subtitle}
          heroImageUrl={cityPage.hero_image_url}
          postalCodes={cityPage.postal_codes}
          cityData={cityPage}
        />

        {/* Erster Content-Bereich: Lokale Expertise mit Stadtbild */}
        <LocalKeywordOptimizer
          cityName={cityPage.city_name}
          postalCodes={cityPage.postal_codes}
          serviceAreas={cityPage.service_areas}
          localKeywords={cityPage.local_keywords}
        >
          <section className="py-20 px-4 bg-gradient-to-b from-pergament to-wood-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-primary-700 mb-6">
                  {cityPage.content_section_1_main_title?.replace('{city_name}', cityPage.city_name) || `Lokale Expertise für ${cityPage.city_name}`}
                </h2>
                <p className="text-xl text-wood-800 max-w-3xl mx-auto">
                  {cityPage.content_section_1_subtitle?.replace('{city_name}', cityPage.city_name) || `Entdecken Sie die Tradition und Qualität unseres regionalen Brennholzes in ${cityPage.city_name} und Umgebung`}
                </p>
              </div>
            
            {/* Content Section 1 mit Stadtbild — immer sichtbar mit sinnvollen Defaults */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
              {/* Text Links */}
              <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
                <h3 className="text-2xl md:text-3xl font-bold text-primary-700 mb-6">
                  <LocalContentEnhancer
                    cityName={cityPage.city_name}
                    postalCodes={cityPage.postal_codes}
                    serviceAreas={cityPage.service_areas}
                    originalContent={cityPage.content_section_1_title || `Brennholz-Service für ${cityPage.city_name}`}
                    contentType="title"
                  />
                </h3>
                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                  <LocalContentEnhancer
                    cityName={cityPage.city_name}
                    postalCodes={cityPage.postal_codes}
                    serviceAreas={cityPage.service_areas}
                    originalContent={
                      (cityPage.content_section_1_content || `Wir liefern regionales Brennholz in ${cityPage.city_name} und Umgebung. Kurze Wege, faire Preise und nachhaltige Qualität aus der Region.`)
                    }
                    contentType="text"
                  />
                </div>
              </div>
              
              {/* Stadtbild Rechts */}
              <div className="relative">
                {cityPage.city_image_url ? (
                  <div className="relative overflow-hidden rounded-2xl shadow-lg">
                    <img 
                      src={cityPage.city_image_url} 
                      alt={`Stadtansicht von ${cityPage.city_name}`}
                      className="w-full h-96 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="text-lg font-semibold">{cityPage.city_name}</p>
                      <p className="text-sm opacity-90">Ihre Region für Premium-Brennholz</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-wood-100 to-wood-200 rounded-2xl shadow-lg h-96 flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      <p className="font-semibold">{cityPage.city_name}</p>
                      <p className="text-sm">Stadtbild wird geladen...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </section>
        </LocalKeywordOptimizer>

        {/* USP Section */}
        <USPSection />

        {/* Local Service Section */}
        <LocalServiceSection 
          cityName={cityPage.city_name}
          title={cityPage.local_service_title}
          subtitle={cityPage.local_service_subtitle}
          description={cityPage.local_service_description}
          serviceAreas={cityPage.local_service_areas}
          expertiseTitle={cityPage.local_service_expertise_title}
          expertiseDescription={cityPage.local_service_expertise_description}
          expertiseBenefits={cityPage.local_service_expertise_benefits}
          localRootedTitle={cityPage.local_service_rooted_title}
          localRootedDescription={cityPage.local_service_rooted_description}
          expertiseImageUrl={cityPage.expertise_image_url}
          compact={true}
          maxAreas={3}
        />

        

        

        

        

        

        {/* Servicegebiete Details entfernt */}

        {/* ExtendedDeliveryInfoSection entfernt */}

        

        <LocalFAQSection 
          cityName={cityPage.city_name} 
          customFAQs={cityPage.local_faqs}
          maxItems={5}
          compact={true}
        />

        

        

        

        {/* GoogleMapsIntegrationSection entfernt */}
        
        

        <RegionSection />
      </div>
    </>
  );
}
