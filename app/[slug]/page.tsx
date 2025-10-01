'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import CityHeroSection from '@/components/CityHeroSection';
import USPSection from '@/components/USPSection';
import LocalServiceSection from '@/components/LocalServiceSection';
import TrustSection from '@/components/TrustSection';
import TestimonialSection from '@/components/TestimonialSection';
import CostCalculatorSection from '@/components/CostCalculatorSection';
import ComparisonSection from '@/components/ComparisonSection';
import ProcessSection from '@/components/ProcessSection';
import SafetySection from '@/components/SafetySection';
import OptimizedProductSection from '@/components/OptimizedProductSection';
import RegionSection from '@/components/RegionSection';
import SEOMetadata from '@/components/SEOMetadata';
import LocalLandmarksSection from '@/components/LocalLandmarksSection';
import LocalTestimonialsSection from '@/components/LocalTestimonialsSection';
import ServiceAreaDetailsSection from '@/components/ServiceAreaDetailsSection';
import LocalFAQSection from '@/components/LocalFAQSection';
import LocalPartnershipsSection from '@/components/LocalPartnershipsSection';
import ExtendedDeliveryInfoSection from '@/components/ExtendedDeliveryInfoSection';
import SeasonalEventsSection from '@/components/SeasonalEventsSection';
import GoogleMapsIntegrationSection from '@/components/GoogleMapsIntegrationSection';
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
    cta_text: string;
  }>;
  local_service_expertise_title?: string;
  local_service_expertise_description?: string;
  local_service_expertise_benefits?: Array<{
    title: string;
    description: string;
  }>;
  local_service_rooted_title?: string;
  local_service_rooted_description?: string;
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
  delivery_zones?: {
    id: string;
    name: string;
    description: string;
    delivery_fee: number;
    min_order: number;
  }[];
  delivery_routes?: {
    id: string;
    name: string;
    areas: string[];
    schedule: string;
    contact: string;
  }[];
  seasonal_events?: {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    discount?: number;
  }[];
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
        
        // Fallback Test-Daten
        const testCities = [
          {
            id: 'test-berlin',
            slug: 'berlin',
            city_name: 'Berlin',
            meta_title: 'Brennholz Berlin - Premium Kaminholz Lieferung | Brennholzkönig',
            meta_description: 'Hochwertiges Brennholz in Berlin bestellen. Schnelle Lieferung, faire Preise. Buche, Eiche, Birke - ofenfertig und kammergetrocknet.',
            hero_title: 'Premium Brennholz für Berlin',
            hero_subtitle: 'Hochwertige Kaminholz-Lieferung direkt zu Ihnen nach Hause',
            hero_image_url: '/images/brennholz-hero.jpg',
            city_image_url: '/images/berlin-city.jpg',
            content_section_1_main_title: 'Lokale Expertise für {city_name}',
            content_section_1_subtitle: 'Entdecken Sie die Tradition und Qualität unseres regionalen Brennholzes in {city_name} und Umgebung',
            content_section_1_title: 'Brennholz Berlin - Ihre lokale Quelle für Premium Kaminholz',
            content_section_1_content: '<p>Als führender Brennholz-Lieferant in Berlin bieten wir Ihnen hochwertiges, kammergetrocknetes Kaminholz direkt vor Ihre Haustür. Unsere langjährige Erfahrung und unser Engagement für Qualität machen uns zur ersten Wahl für Berliner Haushalte.</p><p>Ob für gemütliche Abende am Kamin oder als zuverlässige Heizquelle - unser Brennholz erfüllt höchste Qualitätsstandards und wird nachhaltig aus regionalen Wäldern gewonnen.</p>',
            content_section_2_title: 'Warum Brennholzkönig in Berlin wählen?',
            content_section_2_content: '<p>✓ Schnelle Lieferung in alle Berliner Bezirke<br>✓ Kammergetrocknetes Holz mit unter 20% Restfeuchte<br>✓ Nachhaltige Forstwirtschaft aus der Region<br>✓ Faire Preise ohne versteckte Kosten<br>✓ Professionelle Beratung und Service</p>',
            local_keywords: ['Brennholz Berlin', 'Kaminholz Berlin', 'Holz Lieferung Berlin', 'Feuerholz Berlin', 'Brennholz kaufen Berlin'],
            postal_codes: ['10115', '10117', '10119', '10178', '10179', '10435', '10437', '10439', '10551', '10553', '10555', '10557', '10559', '10585', '10587', '10589', '10623', '10625', '10627', '10629', '10707', '10709', '10711', '10713', '10715', '10717', '10719', '10777', '10779', '10781', '10783', '10785', '10787', '10789', '10823', '10825', '10827', '10829', '10961', '10963', '10965', '10967', '10969', '10997', '10999'],
            service_areas: ['Mitte', 'Friedrichshain-Kreuzberg', 'Pankow', 'Charlottenburg-Wilmersdorf', 'Spandau', 'Steglitz-Zehlendorf', 'Tempelhof-Schöneberg', 'Neukölln', 'Treptow-Köpenick', 'Marzahn-Hellersdorf', 'Lichtenberg', 'Reinickendorf'],
            contact_phone: '+49 30 12345678',
            contact_email: 'berlin@brennholz-koenig.de',
            contact_address: 'Musterstraße 123, 10115 Berlin',
            delivery_info: 'Zuverlässige Lieferung in ganz Berlin (42,50€ Liefergebühr). Lieferzeit: 2-3 Werktage.',
            special_offers: 'Neukunden erhalten 10% Rabatt auf die erste Bestellung!',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'test-muenchen',
            slug: 'muenchen',
            city_name: 'München',
            meta_title: 'Brennholz München - Premium Kaminholz Lieferung | Brennholzkönig',
            meta_description: 'Hochwertiges Brennholz in München bestellen. Schnelle Lieferung, faire Preise. Buche, Eiche, Birke - ofenfertig und kammergetrocknet.',
            hero_title: 'Premium Brennholz für München',
            hero_subtitle: 'Hochwertige Kaminholz-Lieferung direkt zu Ihnen nach Hause',
            hero_image_url: '/images/brennholz-hero.jpg',
            city_image_url: '/images/muenchen-city.jpg',
            content_section_1_main_title: 'Lokale Expertise für {city_name}',
            content_section_1_subtitle: 'Entdecken Sie die Tradition und Qualität unseres regionalen Brennholzes in {city_name} und Umgebung',
            content_section_1_title: 'Brennholz München - Ihre lokale Quelle für Premium Kaminholz',
            content_section_1_content: '<p>Als führender Brennholz-Lieferant in München bieten wir Ihnen hochwertiges, kammergetrocknetes Kaminholz direkt vor Ihre Haustür. Unsere langjährige Erfahrung und unser Engagement für Qualität machen uns zur ersten Wahl für Münchener Haushalte.</p><p>Ob für gemütliche Abende am Kamin oder als zuverlässige Heizquelle - unser Brennholz erfüllt höchste Qualitätsstandards und wird nachhaltig aus bayerischen Wäldern gewonnen.</p>',
            content_section_2_title: 'Warum Brennholzkönig in München wählen?',
            content_section_2_content: '<p>✓ Schnelle Lieferung in alle Münchener Stadtteile<br>✓ Kammergetrocknetes Holz mit unter 20% Restfeuchte<br>✓ Nachhaltige Forstwirtschaft aus Bayern<br>✓ Faire Preise ohne versteckte Kosten<br>✓ Professionelle Beratung und Service</p>',
            local_keywords: ['Brennholz München', 'Kaminholz München', 'Holz Lieferung München', 'Feuerholz München', 'Brennholz kaufen München'],
            postal_codes: ['80331', '80333', '80335', '80336', '80337', '80339', '80469', '80538', '80539', '80634', '80636', '80637', '80638', '80639', '80687', '80689', '80796', '80797', '80798', '80799', '80801', '80802', '80803', '80804', '80805', '80807', '80809', '80933', '80935', '80937', '80939', '80992', '80993', '80995', '80997', '81241', '81243', '81245', '81247', '81249', '81369', '81371', '81373', '81375', '81377', '81379', '81475', '81476', '81477', '81479', '81539', '81541', '81543', '81545', '81547', '81549', '81667', '81669', '81671', '81673', '81675', '81677', '81679', '81735', '81737', '81739', '81825', '81827', '81829', '81925', '81927', '81929'],
            service_areas: ['Altstadt-Lehel', 'Ludwigsvorstadt-Isarvorstadt', 'Maxvorstadt', 'Schwabing-West', 'Au-Haidhausen', 'Sendling', 'Sendling-Westpark', 'Schwanthalerhöhe', 'Neuhausen-Nymphenburg', 'Moosach', 'Milbertshofen-Am Hart', 'Schwabing-Freimann', 'Bogenhausen', 'Berg am Laim', 'Trudering-Riem', 'Ramersdorf-Perlach', 'Obergiesing-Fasangarten', 'Untergiesing-Harlaching', 'Thalkirchen-Obersendling-Forstenried-Fürstenried-Solln', 'Hadern', 'Pasing-Obermenzing', 'Aubing-Lochhausen-Langwied', 'Allach-Untermenzing', 'Feldmoching-Hasenbergl', 'Laim'],
            contact_phone: '+49 89 12345678',
            contact_email: 'muenchen@brennholz-koenig.de',
            contact_address: 'Musterstraße 456, 80331 München',
            delivery_info: 'Zuverlässige Lieferung in ganz München (42,50€ Liefergebühr). Lieferzeit: 2-3 Werktage.',
            special_offers: 'Neukunden erhalten 10% Rabatt auf die erste Bestellung!',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

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
            // Fallback zu Test-Daten
            const testCity = testCities.find(city => city.slug === slug);
            if (testCity) {
              setCityPage(testCity);
            } else {
              console.log('No city page found for slug:', slug);
              notFound();
              return;
            }
          }
        } catch (supabaseError) {
          console.log('Supabase error, using test data:', supabaseError);
          // Fallback zu Test-Daten
          const testCity = testCities.find(city => city.slug === slug);
          if (testCity) {
            setCityPage(testCity);
          } else {
            console.log('No test city found for slug:', slug);
            notFound();
            return;
          }
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
            
            {/* Content Section 1 mit Stadtbild */}
            {cityPage.content_section_1_content && (
              <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                {/* Text Links */}
                <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
                  {cityPage.content_section_1_title && (
                    <h3 className="text-2xl md:text-3xl font-bold text-primary-700 mb-6">
                      <LocalContentEnhancer
                        cityName={cityPage.city_name}
                        postalCodes={cityPage.postal_codes}
                        serviceAreas={cityPage.service_areas}
                        originalContent={cityPage.content_section_1_title}
                        contentType="title"
                      />
                    </h3>
                  )}
                  <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                    <LocalContentEnhancer
                      cityName={cityPage.city_name}
                      postalCodes={cityPage.postal_codes}
                      serviceAreas={cityPage.service_areas}
                      originalContent={cityPage.content_section_1_content || ''}
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
            )}
            
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
        />

        {/* Trust Section */}
        <TrustSection />

        {/* Testimonial Section */}
        <TestimonialSection cityData={cityPage} />

        {/* Lokale Wahrzeichen */}
        <LocalLandmarksSection cityName={cityPage.city_name} />

        {/* Lokale Kundenbewertungen */}
        <LocalTestimonialsSection cityName={cityPage.city_name} />

        {/* Zweiter Content-Bereich: Premium-Service */}
        <section className="py-20 px-4 bg-gradient-to-b from-wood-50 to-pergament">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-primary-700 mb-6">
                Premium-Service für {cityPage.city_name}
              </h2>
              <p className="text-xl text-wood-800 max-w-3xl mx-auto">
                Höchste Qualität und erstklassiger Service direkt vor Ihrer Haustür
              </p>
            </div>
            
            {/* Content Section 2 */}
            {cityPage.content_section_2_content && (
              <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
                {/* Text Links */}
                <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
                  {cityPage.content_section_2_title && (
                    <h3 className="text-2xl md:text-3xl font-bold text-primary-700 mb-6">
                      {cityPage.content_section_2_title}
                    </h3>
                  )}
                  <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed" 
                       dangerouslySetInnerHTML={{ __html: cityPage.content_section_2_content }} />
                </div>
                
                {/* Bild oder Spezielle Angebote Rechts */}
                {cityPage.content_section_2_image_url ? (
                  <div className="relative rounded-2xl shadow-lg overflow-hidden">
                    <img 
                      src={cityPage.content_section_2_image_url} 
                      alt={`${cityPage.city_name} - ${cityPage.content_section_2_title || 'Content Bereich'}`}
                      className="w-full h-full object-cover min-h-[300px]"
                      loading="lazy"
                    />
                  </div>
                ) : cityPage.special_offers ? (
                  <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-lg p-8 lg:p-12 text-white">
                    <h3 className="text-2xl md:text-3xl font-bold mb-6">
                      Exklusive Angebote für {cityPage.city_name}
                    </h3>
                    <div className="prose prose-lg prose-invert max-w-none leading-relaxed" 
                         dangerouslySetInnerHTML={{ __html: cityPage.special_offers }} />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>

        {/* Servicegebiete Details */}
        <ServiceAreaDetailsSection 
          cityName={cityPage.city_name}
          postalCodes={cityPage.postal_codes}
          serviceAreas={cityPage.service_areas_details}
        />

        {/* Erweiterte Lieferinformationen */}
        <ExtendedDeliveryInfoSection 
          cityName={cityPage.city_name}
          deliveryZones={cityPage.delivery_zones}
          deliveryRoutes={cityPage.delivery_routes}
        />

        {/* Interaktive Komponenten */}
        <CostCalculatorSection cityData={cityPage} />
        <ComparisonSection />
        <ProcessSection cityData={cityPage} />
        <SafetySection />
        <OptimizedProductSection 
          initialProducts={[]}
          loadTime={0}
          error={null}
        />

        {/* Lokale FAQs */}
        <LocalFAQSection 
          cityName={cityPage.city_name} 
          customFAQs={cityPage.local_faqs}
        />

        {/* Lokale Partnerschaften */}
        <LocalPartnershipsSection cityName={cityPage.city_name} />

        {/* Saisonale Events */}
        <SeasonalEventsSection 
          cityName={cityPage.city_name}
          seasonalEvents={cityPage.seasonal_events}
        />

        {/* Google Maps Integration */}
        <GoogleMapsIntegrationSection 
          cityName={cityPage.city_name}
          contactAddress={cityPage.contact_address}
          contactPhone={cityPage.contact_phone}
        />
        
        {/* Zusätzlicher Content-Bereich falls vorhanden */}
        {cityPage.content_section_3_content && (
          <section className="py-16 px-4 bg-wood-50">
            <div className="max-w-6xl mx-auto">
              {cityPage.content_section_3_image_url ? (
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
                    {cityPage.content_section_3_title && (
                      <h3 className="text-2xl md:text-3xl font-bold text-primary-700 mb-6">
                        {cityPage.content_section_3_title}
                      </h3>
                    )}
                    <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed" 
                         dangerouslySetInnerHTML={{ __html: cityPage.content_section_3_content }} />
                  </div>
                  <div className="relative rounded-2xl shadow-lg overflow-hidden">
                    <img 
                      src={cityPage.content_section_3_image_url} 
                      alt={`${cityPage.city_name} - ${cityPage.content_section_3_title || 'Content Bereich 3'}`}
                      className="w-full h-full object-cover min-h-[300px]"
                      loading="lazy"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
                  {cityPage.content_section_3_title && (
                    <h3 className="text-2xl md:text-3xl font-bold text-primary-700 mb-6 text-center">
                      {cityPage.content_section_3_title}
                    </h3>
                  )}
                  <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed" 
                       dangerouslySetInnerHTML={{ __html: cityPage.content_section_3_content }} />
                </div>
              )}
            </div>
          </section>
        )}

        <RegionSection />
      </div>
    </>
  );
}