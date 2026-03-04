'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import CityHeroSection from '@/components/CityHeroSection';
import USPSection from '@/components/USPSection';
import LocalFAQSection from '@/components/LocalFAQSection';
import RegionSection from '@/components/RegionSection';
import SEOMetadata from '@/components/SEOMetadata';
import Link from 'next/link';
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
  local_faqs?: {
    id: string;
    question: string;
    answer: string;
    category: 'delivery' | 'quality' | 'pricing' | 'local' | 'service';
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

        const { data, error } = await supabase
          .from('city_pages')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          setCityPage(data[0]);
        } else {
          notFound();
          return;
        }

        // Local Business-Daten (optional)
        try {
          const { data: businessData, error: businessError } = await supabase
            .from('local_business_settings')
            .select('*')
            .single();

          if (!businessError && businessData) {
            setLocalBusinessData(businessData);
          }
        } catch (e) {
          // silently fail — not critical
        }
      } catch (err) {
        console.error('Error loading city page:', err);
        setError('Seite konnte nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    }

    if (slug) fetchCityPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-pergament flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Seite wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error || !cityPage) {
    notFound();
    return null;
  }

  // Structured Data für Local SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Brennholz König ${cityPage.city_name}`,
    "description": cityPage.meta_description,
    "url": `https://brennholz-koenig.de/${cityPage.slug}`,
    "telephone": localBusinessData?.phone || cityPage.contact_phone,
    "email": localBusinessData?.email || cityPage.contact_email,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": cityPage.city_name,
      "addressCountry": "DE"
    },
    "areaServed": {
      "@type": "City",
      "name": cityPage.city_name
    },
    "serviceType": "Brennholz Lieferung",
    "priceRange": "€€",
  };

  return (
    <>
      <SEOMetadata
        pageSlug={`/${cityPage.slug}`}
        defaultTitle={cityPage.meta_title}
        defaultDescription={cityPage.meta_description}
        keywords={cityPage.local_keywords}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-dvh bg-pergament w-full">
        {/* 1. HERO — Stadt-Hintergrundbild + CTA */}
        <CityHeroSection
          cityName={cityPage.city_name}
          heroTitle={cityPage.hero_title}
          heroSubtitle={cityPage.hero_subtitle}
          heroImageUrl={cityPage.hero_image_url}
          postalCodes={cityPage.postal_codes}
          cityData={cityPage}
        />

        {/* 2. CONTENT SECTION 1 — Lokale Expertise mit Stadtbild */}
        <section className="pt-20 pb-16 md:pt-28 md:pb-24 px-4 bg-gradient-to-b from-pergament to-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-primary-700 mb-4">
                {cityPage.content_section_1_main_title || `Ihr Brennholz-Partner in ${cityPage.city_name}`}
              </h2>
              <p className="text-lg md:text-xl text-wood-800 max-w-3xl mx-auto">
                {cityPage.content_section_1_subtitle || `Regional, nachhaltig und ofenfertig – Brennholz König liefert Premium-Brennholz nach ${cityPage.city_name}`}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-10 items-start">
              {/* Text */}
              <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
                <h3 className="text-2xl md:text-3xl font-bold text-primary-700 mb-5">
                  {cityPage.content_section_1_title || `Brennholz-Service für ${cityPage.city_name}`}
                </h3>
                <div
                  className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: cityPage.content_section_1_content ||
                      `<p>Wir liefern regionales Premium-Brennholz nach ${cityPage.city_name} und Umgebung. Kurze Wege, faire Preise und nachhaltige Qualität aus heimischen Wäldern.</p>`
                  }}
                />
                <Link
                  href="/shop"
                  className="inline-flex items-center mt-6 px-6 py-3 bg-[#C04020] hover:bg-[#A03318] text-white font-bold rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  🔥 Jetzt Brennholz bestellen
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>

              {/* Stadtbild */}
              <div className="relative">
                {cityPage.city_image_url ? (
                  <div className="relative overflow-hidden rounded-2xl shadow-xl" style={{ height: '400px', maxHeight: '400px' }}>
                    <img
                      src={cityPage.city_image_url}
                      alt={`${cityPage.city_name} – Brennholz König Liefergebiet`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="text-lg font-bold">{cityPage.city_name}</p>
                      <p className="text-sm opacity-90">Ihr regionales Brennholz direkt geliefert</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-wood-100 to-wood-200 rounded-2xl shadow-lg flex items-center justify-center" style={{ height: '400px' }}>
                    <div className="text-center text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      <p className="font-semibold">{cityPage.city_name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 3. USP Section — Brennholzkönig Vorteile */}
        <USPSection />

        {/* 4. CONTENT SECTION 2 — Regionale Qualität */}
        {(cityPage.content_section_2_title || cityPage.content_section_2_content) && (
          <section className="py-16 md:py-24 px-4 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                {/* Bild links */}
                {cityPage.content_section_2_image_url ? (
                  <div className="relative overflow-hidden rounded-2xl shadow-xl">
                    <img
                      src={cityPage.content_section_2_image_url}
                      alt={`${cityPage.content_section_2_title} – ${cityPage.city_name}`}
                      className="w-full h-[360px] object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-10 flex items-center justify-center h-[360px]">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-[#C04020] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <p className="text-xl font-bold text-gray-800">Geprüfte Qualität</p>
                      <p className="text-gray-600 mt-1">6–8% Restfeuchte garantiert</p>
                    </div>
                  </div>
                )}

                {/* Text rechts */}
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-5">
                    {cityPage.content_section_2_title || 'Regionale Qualität'}
                  </h2>
                  <div
                    className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: cityPage.content_section_2_content || ''
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 5. CONTENT SECTION 3 — Nachhaltigkeit */}
        {(cityPage.content_section_3_title || cityPage.content_section_3_content) && (
          <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-white to-pergament">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                {/* Text links */}
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-5">
                    {cityPage.content_section_3_title || 'Nachhaltigkeit'}
                  </h2>
                  <div
                    className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: cityPage.content_section_3_content || ''
                    }}
                  />
                </div>

                {/* Bild rechts */}
                {cityPage.content_section_3_image_url ? (
                  <div className="relative overflow-hidden rounded-2xl shadow-xl">
                    <img
                      src={cityPage.content_section_3_image_url}
                      alt={`Nachhaltiges Brennholz für ${cityPage.city_name}`}
                      className="w-full h-[360px] object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-10 flex items-center justify-center h-[360px]">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                        </svg>
                      </div>
                      <p className="text-xl font-bold text-gray-800">Nachhaltige Forstwirtschaft</p>
                      <p className="text-gray-600 mt-1">100% aus heimischen Wäldern</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 6. SHOP CTA — Prominent bestellen */}
        <section className="py-16 md:py-20 px-4 bg-[#1A1A1A] text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-black mb-6" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              Brennholz für <span className="text-[#D4A520]">{cityPage.city_name}</span> bestellen
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Premium Buche & Eiche – ofenfertig, trocken und direkt zu Ihnen nach {cityPage.city_name} geliefert.
              27 Jahre Erfahrung, über 10.000 zufriedene Kunden.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#C04020] hover:bg-[#A03318] text-white text-lg font-bold rounded-xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                🔥 Zum Online-Shop
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="tel:+4917671085234"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-[#D4A520] text-[#D4A520] hover:bg-[#D4A520] hover:text-[#1A1A1A] text-lg font-bold rounded-xl transition-all duration-300"
              >
                📞 Jetzt anrufen
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-gray-400">
              <span>✓ 6–8% Restfeuchte</span>
              <span>✓ Ofenfertig gespalten</span>
              <span>✓ Regional aus Hessen</span>
            </div>
          </div>
        </section>

        {/* 7. FAQs — Stadtspezifisch */}
        <LocalFAQSection
          cityName={cityPage.city_name}
          customFAQs={cityPage.local_faqs}
          maxItems={5}
          compact={true}
        />

        {/* 8. Region Section — Liefergebiet-Übersicht */}
        <RegionSection />
      </div>
    </>
  );
}
