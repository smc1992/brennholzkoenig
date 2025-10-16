
'use client';

import { useEffect, useState, useRef } from 'react';
// Wir verwenden direkte /public-URLs (WebP), um Build-Import-Probleme zu vermeiden
// Bilddarstellung: Fallback auf <img> für maximale Robustheit
import DynamicContent from './DynamicContent';

export default function USPSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsVisible(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative z-20 py-12 sm:py-16 md:py-20 bg-gradient-to-b from-[#F5F0E0] to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Haupt-USP Karten – Weißes Card-Design mit Bild oben */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 max-w-6xl mx-auto">
            {/* Card 1 */}
            <div className={`bg-white rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'} max-w-[560px] mx-auto`}> 
              {/* Bild oben – festes Seitenverhältnis für identische Höhen */}
              <div className="relative w-full aspect-[4/3] rounded-t-2xl overflow-hidden">
                <img
                  src="/images/Kein Dreck in der Wohnung.webp"
                  alt="Familien vertrauen uns"
                  className="w-full h-full object-cover block"
                  loading="eager"
                />
              </div>
              {/* Inhalt */}
              <div className="text-left px-6 sm:px-7 md:px-8 py-6 sm:py-7">
                <h3 className="text-[#1A1A1A] uppercase tracking-wide text-lg sm:text-xl md:text-2xl font-black mb-3 sm:mb-4 leading-tight" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                  <DynamicContent
                    page="home"
                    section="usp"
                    contentType="card1_title"
                    fallback="FAMILIEN VERTRAUEN UNS"
                    tag="span"
                  />
                </h3>
                <p className="text-[#3a3a3a] text-sm sm:text-base md:text-lg leading-relaxed" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                  Über 6.847 Familien schaffen mit unserem Premium-Brennholz warme, gemütliche Momente. 
                  <span className="text-[#C04020] font-semibold"> Sauberes, trockenes Holz </span>
                  bedeutet weniger Arbeit und mehr Zeit für die schönen Dinge im Leben.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className={`bg-white rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100' : 'opacity-0'} max-w-[560px] mx-auto`}> 
              {/* Bild oben – festes Seitenverhältnis für identische Höhen */}
              <div className="relative w-full aspect-[4/3] rounded-t-2xl overflow-hidden">
                <img
                  src="/images/Perfektes Möbelholz.webp"
                  alt="Geprüfte Qualität"
                  className="w-full h-full object-cover block"
                  loading="eager"
                />
              </div>
              {/* Inhalt */}
              <div className="text-left px-6 sm:px-7 md:px-8 py-6 sm:py-7">
                <h3 className="text-[#1A1A1A] uppercase tracking-wide text-lg sm:text-xl md:text-2xl font-black mb-3 sm:mb-4 leading-tight" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                  <DynamicContent
                    page="home"
                    section="usp"
                    contentType="card2_title"
                    fallback="GEPRÜFTE QUALITÄT"
                    tag="span"
                  />
                </h3>
                <p className="text-[#3a3a3a] text-sm sm:text-base md:text-lg leading-relaxed" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                  Jedes Holzstück wird vor der Auslieferung geprüft. 
                  <span className="text-[#C04020] font-semibold"> 6–8 % </span>
                  <span className="text-[#C04020] font-semibold"> Restfeuchte garantiert </span>
                  – gemessen mit professionellen Geräten. So brennt Ihr Holz perfekt ab dem ersten Tag.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main USP - 70% höherer Heizwert - Mobile responsive */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className={`inline-flex items-center bg-gradient-to-r from-[#D4A520] to-[#FFD700] text-[#1A1A1A] px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 rounded-xl sm:rounded-2xl shadow-2xl transition-all duration-1000 delay-600 hover:scale-105 ${isVisible ? 'opacity-100' : 'opacity-0'} max-w-full`}>
            <div className="flex items-center">
              <div className="w-10 sm:w-12 md:w-16 h-10 sm:h-12 md:h-16 flex items-center justify-center bg-[#C04020] rounded-full mr-3 sm:mr-4 md:mr-6 shadow-lg flex-shrink-0">
                <i className="ri-fire-line text-white text-lg sm:text-2xl md:text-3xl"></i>
              </div>
              <div className="text-left min-w-0">
                <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black block leading-tight" style={{ fontFamily: 'Inter, Arial, sans-serif', fontWeight: '900' }}>
                  <DynamicContent
                    page="home"
                    section="usp"
                    contentType="main_usp_title"
                    fallback="70% HÖHERE HEIZLEISTUNG"
                    tag="span"
                  />
                </span>
                <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold leading-tight" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                  <DynamicContent
                    page="home"
                    section="usp"
                    contentType="main_usp_subtitle"
                    fallback="im Vergleich zum weitverbreiteten Scheitholz"
                    tag="span"
                  />
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Grid - Mobile responsive Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto px-2 sm:px-4">
          {[ 
            {
              icon: 'ri-truck-line',
              bg: 'from-[#C04020] to-[#A03318]',
              title: 'GÜNSTIGE LIEFERUNG',
              desc: 'ab 3 Schüttraummeter für nur 43,50€',
              detail: '✓ 150km Lieferradius',
              delay: 800
            },
            {
              icon: 'ri-leaf-line',
              bg: 'from-[#1A1A1A] to-[#2A2A2A]',
              title: 'REGIONAL & NACHHALTIG',
              desc: '100% aus heimischen Wäldern der Region',
              detail: '✓ Kurze Transportwege',
              delay: 1000
            },
            {
              icon: 'ri-award-line',
              bg: 'from-[#D4A520] to-[#B8941A]',
              title: '27 JAHRE ERFAHRUNG',
              desc: 'Persönlich, leidenschaftlich & zuverlässig',
              detail: '✓ Seit 1997',
              delay: 1200
            },
            {
              icon: 'ri-shield-check-line',
              bg: 'from-[#C04020] to-[#A03318]',
              title: 'QUALITÄTSGARANTIE',
              desc: 'Premium Brennholz mit königlicher Qualität',
              detail: '✓ 100% Zufriedenheit',
              delay: 1400
            }
          ].map((item, index) => (
            <div key={index} className={`text-center bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg transition-all duration-800 hover:shadow-xl hover:-translate-y-2 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${item.delay}ms` }}>
              <div className={`w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 flex items-center justify-center bg-gradient-to-br ${item.bg} rounded-full mx-auto mb-3 sm:mb-4 md:mb-6 shadow-lg`}>
                <i className={`${item.icon} text-white text-lg sm:text-2xl md:text-3xl`}></i>
              </div>
              <h3 className="text-sm sm:text-lg md:text-xl font-bold text-[#1A1A1A] mb-1 sm:mb-2 md:mb-3 leading-tight" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                {item.title}
              </h3>
              <p className="text-[#666] text-xs sm:text-sm leading-relaxed" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                {item.desc}
              </p>
              <div className="mt-2 sm:mt-3 md:mt-4 text-[#D4A520] font-bold text-xs sm:text-sm" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                {item.detail}
              </div>
            </div>
          ))}
        </div>

        {/* Trust indicators - Mobile responsive */}
        <div className="mt-8 sm:mt-12 md:mt-16 text-center px-2 sm:px-4">
          <div className={`flex flex-wrap items-center justify-center gap-2 sm:gap-4 md:gap-8 text-[#666] max-w-6xl mx-auto transition-all duration-1000 delay-1600 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center text-xs sm:text-sm bg-white px-2 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 mb-1 sm:mb-0" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              <div className="w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center mr-1 sm:mr-2">
                <i className="ri-time-line text-[#D4A520] text-sm sm:text-base md:text-lg"></i>
              </div>
              <span className="whitespace-nowrap">24-48h Express Lieferung</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm bg-white px-2 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 mb-1 sm:mb-0" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              <div className="w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center mr-1 sm:mr-2">
                <i className="ri-customer-service-line text-[#D4A520] text-sm sm:text-base md:text-lg"></i>
              </div>
              <span className="whitespace-nowrap">Persönliche Beratung</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm bg-white px-2 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 mb-1 sm:mb-0" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              <div className="w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center mr-1 sm:mr-2">
                <i className="ri-star-line text-[#D4A520] text-sm sm:text-base md:text-lg"></i>
              </div>
              <span className="whitespace-nowrap">10.000+ Kunden</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm bg-white px-2 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 mb-1 sm:mb-0" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              <div className="w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center mr-1 sm:mr-2">
                <i className="ri-map-pin-line text-[#D4A520] text-sm sm:text-base md:text-lg"></i>
              </div>
              <span className="whitespace-nowrap">Bad Hersfeld</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm bg-white px-2 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 mb-1 sm:mb-0" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              <div className="w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center mr-1 sm:mr-2">
                <i className="ri-map-pin-line text-[#D4A520] text-sm sm:text-base md:text-lg"></i>
              </div>
              <span className="whitespace-nowrap">Alsfeld</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm bg-white px-2 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 mb-1 sm:mb-0" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              <div className="w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center mr-1 sm:mr-2">
                <i className="ri-map-pin-line text-[#D4A520] text-sm sm:text-base md:text-lg"></i>
              </div>
              <span className="whitespace-nowrap">Bad Kissingen</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm bg-white px-2 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 mb-1 sm:mb-0" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              <div className="w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center mr-1 sm:mr-2">
                <i className="ri-map-pin-line text-[#D4A520] text-sm sm:text-base md:text-lg"></i>
              </div>
              <span className="whitespace-nowrap">Lauterbach</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm bg-white px-2 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 mb-1 sm:mb-0" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              <div className="w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center mr-1 sm:mr-2">
                <i className="ri-map-pin-line text-[#D4A520] text-sm sm:text-base md:text-lg"></i>
              </div>
              <span className="whitespace-nowrap">Gersfeld</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
