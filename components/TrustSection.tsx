
'use client';

import { useEffect, useState, useRef } from 'react';
import DynamicContent from './DynamicContent';

export default function TrustSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-[#F5F0E0] to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <div className="inline-flex items-center bg-[#D4A520] text-[#1A1A1A] px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-sm sm:text-base mb-6 sm:mb-8">
            <i className="ri-shield-check-line mr-2"></i>
            <DynamicContent
              page="home"
              section="trust"
              contentType="badge_text"
              fallback="VERTRAUEN & QUALITÄT"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-[#1A1A1A] mb-4 sm:mb-6" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            <DynamicContent
              page="home"
              section="trust"
              contentType="title_part1"
              fallback="WARUM"
            /> <span className="text-[#C04020]">
              <DynamicContent
                page="home"
                section="trust"
                contentType="title_part2"
                fallback="6.847 KUNDEN"
              />
            </span> <DynamicContent
              page="home"
              section="trust"
              contentType="title_part3"
              fallback="UNS VERTRAUEN"
            />
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            <DynamicContent
              page="home"
              section="trust"
              contentType="subtitle"
              fallback="27 Jahre Erfahrung, königliche Qualität und persönlicher Service. Entdecken Sie, was uns zum Brennholzkönig macht."
            />
          </p>
        </div>

        {/* Trust Elements Grid - Now centered with 2 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 max-w-3xl mx-auto mb-12 sm:mb-16 justify-items-center">
          
          {/* Erfahrung */}
          <div className={`bg-white rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-gradient-to-br from-[#D4A520] to-[#B8941A] rounded-2xl mx-auto mb-4 shadow-lg">
                <i className="ri-award-fill text-white text-2xl sm:text-3xl"></i>
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#D4A520] mb-2">
                <DynamicContent
                  page="home"
                  section="trust"
                  contentType="experience_number"
                  fallback="27"
                />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#1A1A1A]" style={{ fontFamily: 'Inter, sans-serif' }}>
                <DynamicContent
                  page="home"
                  section="trust"
                  contentType="experience_title"
                  fallback="JAHRE ERFAHRUNG"
                />
              </h3>
            </div>
            <p className="text-sm sm:text-base text-gray-700 text-center leading-relaxed">
              <DynamicContent
                page="home"
                section="trust"
                contentType="experience_description"
                fallback="Persönlich, leidenschaftlich & zuverlässig"
              />
            </p>
          </div>

          {/* Kunden */}
          <div className={`bg-white rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-gradient-to-br from-[#C04020] to-[#A03318] rounded-2xl mx-auto mb-4 shadow-lg">
                <i className="ri-group-fill text-white text-2xl sm:text-3xl"></i>
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#C04020] mb-2">
                <DynamicContent
                  page="home"
                  section="trust"
                  contentType="customers_number"
                  fallback="6.847"
                />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#1A1A1A]" style={{ fontFamily: 'Inter, sans-serif' }}>
                <DynamicContent
                  page="home"
                  section="trust"
                  contentType="customers_title"
                  fallback="ZUFRIEDENE KUNDEN"
                />
              </h3>
            </div>
            <p className="text-sm sm:text-base text-gray-700 text-center leading-relaxed">
              <DynamicContent
                page="home"
                section="trust"  
                contentType="customers_description"
                fallback="Über 6.847 Familien vertrauen auf unsere Qualität. 97% würden uns weiterempfehlen - das spricht für sich."
              />
            </p>
          </div>
        </div>

        {/* Vertrauen durch Bilder */}
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 max-w-6xl mx-auto mb-12 sm:mb-16">
          {/* Familie bei Kamin */}
          <div className={`bg-white rounded-2xl p-6 sm:p-8 shadow-xl transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <div className="aspect-video rounded-xl overflow-hidden mb-6 shadow-lg">
              <img 
                src="https://readdy.ai/api/search-image?query=Happy%20German%20family%20with%20children%20gathered%20around%20cozy%20fireplace%20using%20premium%20quality%20firewood%2C%20warm%20winter%20evening%20scene%2C%20satisfied%20customers%20enjoying%20clean%20burning%20wood%20fire%2C%20comfortable%20living%20room%20with%20stone%20fireplace%2C%20family%20bonding%20time%20around%20crackling%20fire&width=800&height=450&seq=family-fireplace-trust&orientation=landscape"
                alt="Zufriedene Familie am warmen Kamin"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#1A1A1A] mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              FAMILIEN VERTRAUEN UNS
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Über 6.847 Familien schaffen mit unserem Premium-Brennholz warme, 
              gemütliche Momente. <strong className="text-[#C04020]">Sauberes, trockenes Holz </strong> 
              bedeutet weniger Arbeit und mehr Zeit für die schönen Dinge im Leben.
            </p>
          </div>

          {/* Qualitätskontrolle */}
          <div className={`bg-white rounded-2xl p-6 sm:p-8 shadow-xl transition-all duration-700 transform delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="aspect-video rounded-xl overflow-hidden mb-6 shadow-lg">
              <img 
                src="https://static.readdy.ai/image/5cb98375ce345c7331a1619afba21cba/fc6bd73633df28293b3a47852f59e15a.webp"
                alt="Professionelle Qualitätskontrolle"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#1A1A1A] mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              GEPRÜFTE QUALITÄT
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Jedes Holzstück wird vor der Auslieferung geprüft. 
              <strong className="text-[#C04020]">6-8 % Restfeuchte garantiert</strong> - 
              gemessen mit professionellen Geräten. So brennt Ihr Holz perfekt ab dem ersten Tag.
            </p>
          </div>
        </div>

        {/* Vertrauens-Siegel */}
        <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2A2A2A] rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-white shadow-2xl max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 sm:mb-6" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              <DynamicContent
                page="home"
                section="trust"
                contentType="guarantees_title_part1"
                fallback="UNSERE"
              /> <span className="text-[#D4A520]">
                <DynamicContent
                  page="home"
                  section="trust"
                  contentType="guarantees_title_part2"
                  fallback="GARANTIEN"
                />
              </span>
            </h3>
            <p className="text-base sm:text-lg lg:text-xl opacity-90 max-w-3xl mx-auto">
              <DynamicContent
                page="home"
                section="trust"
                contentType="guarantees_subtitle"
                fallback="Weil Vertrauen das Wichtigste ist - deshalb geben wir Ihnen diese Garantien"
              />
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-[#D4A520] rounded-full mx-auto mb-3 sm:mb-4">
                <i className="ri-tree-line text-white text-xl sm:text-2xl"></i>
              </div>
              <h4 className="font-black text-base sm:text-lg mb-2">6-8% RESTFEUCHTE</h4>
              <p className="text-xs sm:text-sm opacity-80">Industrieholz garantiert</p>
            </div>

            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-[#D4A520] rounded-full mx-auto mb-3 sm:mb-4">
                <i className="ri-truck-line text-white text-xl sm:text-2xl"></i>
              </div>
              <h4 className="font-black text-base sm:text-lg mb-2">PÜNKTLICHE LIEFERUNG</h4>
              <p className="text-xs sm:text-sm opacity-80">Sie können sich auf uns verlassen</p>
            </div>

            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-[#D4A520] rounded-full mx-auto mb-3 sm:mb-4">
                <i className="ri-recycle-line text-white text-xl sm:text-2xl"></i>
              </div>
              <h4 className="font-black text-base sm:text-lg mb-2">SAUBER</h4>
            <p className="text-xs sm:text-sm opacity-80">Keine Rinde, kein Ungeziefer</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
