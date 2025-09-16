
'use client';

import { useEffect, useState, useRef } from 'react';

export default function ComparisonSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-20 bg-gradient-to-b from-white to-[#F5F0E0]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className={`text-center mb-12 md:mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="inline-flex items-center bg-[#C04020] text-white px-6 py-3 rounded-full font-bold text-sm md:text-base mb-6">
            <i className="ri-vs-line mr-2"></i>
            ANBIETER-VERGLEICH
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#1A1A1A] mb-6" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            WARUM <span className="text-[#C04020]">BRENNHOLZKÖNIG</span> WÄHLEN?
          </h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            Der ehrliche Vergleich: Wir zeigen Ihnen transparent, was uns von anderen Anbietern unterscheidet.
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Comparison Table - sanfte Einblendung */}
          <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 transition-all duration-1200 delay-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-[#1A1A1A] to-[#2A2A2A] text-white">
                    <th className="px-4 md:px-6 py-4 md:py-6 text-left">
                      <span className="text-lg md:text-xl font-black">VERGLEICHSKRITERIEN</span>
                    </th>
                    <th className="px-4 md:px-6 py-4 md:py-6 text-center bg-red-500/20">
                      <div className="flex flex-col items-center">
                        <span className="text-base md:text-lg font-bold">ANDERE ANBIETER</span>
                        <span className="text-xs md:text-sm opacity-80">Durchschnitt</span>
                      </div>
                    </th>
                    <th className="px-4 md:px-6 py-4 md:py-6 text-center bg-[#D4A520]/30">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center mb-1">
                          <i className="ri-crown-line text-[#D4A520] mr-2"></i>
                          <span className="text-base md:text-lg font-black">BRENNHOLZKÖNIG</span>
                        </div>
                        <span className="text-xs md:text-sm opacity-80">Premium-Service</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[{
                    icon: 'ri-fire-line',
                    title: 'Heizleistung',
                    desc: 'Energiegehalt pro kg',
                    other: '1470 KWh',
                    us: '70% HÖHER (2499 KWh)',
                    delay: 400
                  }, {
                    icon: 'ri-drop-line',
                    title: 'Feuchtigkeit',
                    desc: 'Restfeuchtigkeit %',
                    other: '20%',
                    us: '6-8 %',
                    delay: 600
                  }, {
                    icon: 'ri-truck-line',
                    title: 'Lieferung',
                    desc: 'Kosten & Service',
                    other: '80-150€ Lieferkosten\n5-10 Tage',
                    us: '42,50€\n139€ Express',
                    delay: 800
                  }, {
                    icon: 'ri-shield-check-line',
                    title: 'Qualitätsprüfung',
                    desc: 'Kontrolle & Service',
                    other: 'Keine Garantie',
                    us: 'PRÜFUNG VOR ABLADUNG',
                    delay: 1000
                  }, {
                    icon: 'ri-customer-service-line',
                    title: 'Beratung',
                    desc: 'Persönlicher Service',
                    other: 'Standard Hotline',
                    us: '27 JAHRE EXPERTISE',
                    delay: 1200
                  }, {
                    icon: 'ri-home-warehouse-line',
                    title: 'Lagerbedingungen',
                    desc: 'Perfekte Lagerung',
                    other: 'Outdoor-Lagerung',
                    us: 'PERFEKTE LAGERBEDINGUNGEN',
                    delay: 1400
                  }, {
                    icon: 'ri-award-line',
                    title: 'Erfahrung',
                    desc: 'Jahre am Markt',
                    other: '2-8 Jahre',
                    us: 'SEIT 1997',
                    delay: 1600
                  }].map((row, index) => (
                    <tr key={index} className={`hover:bg-gray-50 transition-all duration-600 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${row.delay}ms` }}>
                      <td className="px-4 md:px-6 py-4 md:py-6">
                        <div className="flex items-center">
                          <i className={`${row.icon} text-[#C04020] mr-3 text-lg`}></i>
                          <div>
                            <span className="font-bold text-gray-800">{row.title}</span>
                            <p className="text-xs md:text-sm text-gray-600">{row.desc}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 md:py-6 text-center">
                        <div className="flex items-center justify-center">
                          <i className="ri-close-line text-red-500 mr-2"></i>
                          <span className="text-sm md:text-base whitespace-pre-line">{row.other}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 md:py-6 text-center bg-[#F5F0E0]">
                        <div className="flex items-center justify-center">
                          <i className="ri-check-line text-[#D4A520] mr-2"></i>
                          <span className="font-bold text-[#1A1A1A] text-sm md:text-base whitespace-pre-line">{row.us}</span>
                        </div>
                      </td>
                    </tr>
                  ))}

                  <tr className={`hover:bg-gray-50 transition-all duration-600 bg-gray-100 font-bold ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '1800ms' }}>
                    <td className="px-4 md:px-6 py-4 md:py-6">
                      <div className="flex items-center">
                        <i className="ri-money-euro-circle-line text-[#C04020] mr-3 text-lg"></i>
                        <span className="font-black text-gray-900 text-base md:text-lg">PREIS PRO SRM</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 md:py-6 text-center">
                      <div className="text-lg md:text-xl font-bold text-red-600">135-165€</div>
                      <span className="text-xs text-gray-600">+ Lieferkosten</span>
                    </td>
                    <td className="px-4 md:px-6 py-4 md:py-6 text-center bg-[#F5F0E0]">
                      <div className="text-lg md:text-xl font-black text-[#1A1A1A]">115€</div>
                      <span className="text-xs text-[#C04020]">Lieferung 42,50€ (3 SRM)</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Winner Box - Mobile optimiert */}
          <div className={`bg-gradient-to-r from-[#D4A520] to-[#FFD700] text-[#1A1A1A] rounded-2xl p-4 sm:p-6 lg:p-8 text-center shadow-2xl mt-6 sm:mt-8 transition-all duration-1000 delay-1800 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <div className="flex flex-col sm:flex-row items-center justify-center mb-4 sm:mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 flex items-center justify-center bg-[#C04020] rounded-full mb-3 sm:mb-0 sm:mr-4 shadow-lg flex-shrink-0">
                <i className="ri-trophy-line text-white text-xl sm:text-2xl lg:text-3xl"></i>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black mb-1 leading-tight" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                  DER KLARE GEWINNER!
                </h3>
                <p className="text-sm sm:text-base lg:text-lg font-bold">
                  Brennholzkönig überzeugt in ALLEN Kategorien
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 mb-4 sm:mb-6">
              <div className={`text-center transition-all duration-600 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`} style={{ transitionDelay: '2000ms' }}>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black mb-1">70%</div>
                <p className="text-xs sm:text-sm font-bold leading-tight">Höherer Heizwert</p>
              </div>
              <div className={`text-center transition-all duration-600 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`} style={{ transitionDelay: '2200ms' }}>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black mb-1">27</div>
                <p className="text-xs sm:text-sm font-bold leading-tight">Jahre Erfahrung</p>
              </div>
              <div className={`text-center transition-all duration-600 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`} style={{ transitionDelay: '2400ms' }}>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black mb-1">43,50€</div>
                <p className="text-xs sm:text-sm font-bold leading-tight">Lieferkosten ab 3 SRM</p>
              </div>
            </div>

            <a href="/shop" className="w-full sm:w-auto bg-[#C04020] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-[#A03318] transition-all duration-300 whitespace-nowrap cursor-pointer shadow-xl transform hover:scale-105 inline-block text-center">
              <i className="ri-award-line mr-2 sm:mr-3"></i>
              <span className="break-words">Jetzt Premium-Qualität bestellen</span>
            </a>
          </div>

          {/* Customer Quote - vertrauensvolle Präsentation */}
          <div className={`bg-white rounded-2xl p-6 md:p-8 shadow-lg mt-8 border border-gray-200 transition-all duration-1000 delay-2800 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-start">
              <div className="w-12 md:w-16 h-12 md:h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center text-white font-bold mr-4 text-lg md:text-xl flex-shrink-0">
                HM
              </div>
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h4 className="font-bold text-[#1A1A1A] mr-2">Hans Meyer</h4>
                  <span className="text-xs bg-[#F5F0E0] text-[#1A1A1A] px-2 py-1 rounded-full">Verifizierter Käufer</span>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className="ri-star-fill text-[#D4A520] text-sm"></i>
                  ))}
                </div>
                <blockquote className="text-sm md:text-base text-gray-700 italic">
                  "Ich habe 3 verschiedene Anbieter getestet. Der Unterschied ist dramatisch! 
                  Brennholzkönig liefert nicht nur 2 Tage früher, sondern das Holz brennt auch 
                  viel länger und heißer. Nie wieder einen anderen Anbieter!"
                </blockquote>
                <p className="text-xs text-gray-500 mt-2">Verifizierte Bewertung • Vor 2 Wochen</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
