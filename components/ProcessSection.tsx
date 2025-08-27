
'use client';

import { useEffect, useState, useRef } from 'react';
import DynamicContent from './DynamicContent';

export default function ProcessSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-20 bg-gradient-to-b from-[#F5F0E0] to-white">
      <div className="container mx-auto px-4">
        <div className={`text-center mb-12 md:mb-16 transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center bg-[#C04020] text-white px-6 py-3 rounded-full font-bold text-sm md:text-base mb-6 transform hover:scale-105 transition-all duration-300">
            <i className="ri-route-line mr-2"></i>
            <DynamicContent
              page="home"
              section="process"
              contentType="badge_text"
              fallback="SO EINFACH GEHT'S"
            />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#1A1A1A] mb-6" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            <DynamicContent
              page="home"
              section="process"
              contentType="title_part1"
              fallback="IHR WEG ZUM"
            /> <span className="text-[#C04020...">
              <DynamicContent
                page="home"
                section="process"
                contentType="title_part2"
                fallback="PREMIUM-BRENNHOLZ"
              />
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            <DynamicContent
              page="home"
              section="process"
              contentType="subtitle"
              fallback="Von der Bestellung bis zur gemütlichen Wärme in nur wenigen Schritten. Einfacher geht es nicht!"
            />
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Process Steps */}
          <div className="relative">
            {/* Animated Connection Line */}
            <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-[#C04020] via-[#D4A520] to-[#C04020] rounded-full z-10 overflow-hidden">
              <div className={`h-full bg-white/30 transform transition-all duration-2000 ${isVisible ? 'translate-x-0' : '-translate-x-full'}`}></div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 relative z-20">
              {/* Step 1 */}
              <div className={`text-center transition-all duration-700 delay-200 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 border border-gray-100 group">
                  <div className="w-20 h-20 flex items-center justify-center bg-gradient-to-br from-[#C04020] to-[#A03318] rounded-2xl mx-auto mb-6 shadow-lg relative transition-all duration-300 group-hover:rotate-6">
                    <i className="ri-shopping-cart-line text-white text-3xl transition-all duration-300 group-hover:scale-110"></i>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#D4A520] rounded-full flex items-center justify-center text-white font-black text-sm animate-pulse">
                      1
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-[#1A1A1A] mb-4" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                    <DynamicContent
                      page="home"
                      section="process"
                      contentType="step1_title"
                      fallback="BESTELLEN"
                    />
                  </h3>
                  <p className="text-sm md:text-base text-gray-700 mb-4">
                    <DynamicContent
                      page="home"
                      section="process"
                      contentType="step1_description"
                      fallback="Wählen Sie Ihr Brennholz und die gewünschte Menge. Online in 2 Minuten oder telefonisch."
                    />
                  </p>
                  <ul className="text-xs md:text-sm text-gray-600 space-y-1">
                    <li className="flex items-center transform transition-all duration-300 hover:translate-x-2">
                      <i className="ri-check-line text-green-600 mr-2"></i>
                      Online oder per Telefon
                    </li>
                    <li className="flex items-center transform transition-all duration-300 hover:translate-x-2">
                      <i className="ri-check-line text-green-600 mr-2"></i>
                      Kostenlose Beratung
                    </li>
                    <li className="flex items-center transform transition-all duration-300 hover:translate-x-2">
                      <i className="ri-check-line text-green-600 mr-2"></i>
                      Flexible Mengen
                    </li>
                  </ul>
                </div>
              </div>

              {/* Step 2 */}
              <div className={`text-center transition-all duration-700 delay-400 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 border border-gray-100 group">
                  <div className="w-20 h-20 flex items-center justify-center bg-gradient-to-br from-[#D4A520] to-[#B8941A] rounded-2xl mx-auto mb-6 shadow-lg relative transition-all duration-300 group-hover:rotate-6">
                    <i className="ri-calendar-check-line text-white text-3xl transition-all duration-300 group-hover:scale-110"></i>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#C04020] rounded-full flex items-center justify-center text-white font-black text-sm animate-pulse">
                      2
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-[#1A1A1A] mb-4" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                    <DynamicContent
                      page="home"
                      section="process"
                      contentType="step2_title"
                      fallback="TERMINPLANUNG"
                    />
                  </h3>
                  <p className="text-sm md:text-base text-gray-700 mb-4">
                    <DynamicContent
                      page="home"
                      section="process"
                      contentType="step2_description"
                      fallback="Wir kontaktieren Sie zur Terminabsprache - ganz nach Ihrem Wunsch!"
                    />
                  </p>
                  <ul className="text-xs md:text-sm text-gray-600 space-y-1">
                    <li className="flex items-center transform transition-all duration-300 hover:translate-x-2">
                      <i className="ri-check-line text-green-600 mr-2"></i>
                      Wunschtermin möglich
                    </li>
                    <li className="flex items-center transform transition-all duration-300 hover:translate-x-2">
                      <i className="ri-check-line text-green-600 mr-2"></i>
                      24-48h Express-Option
                    </li>
                    <li className="flex items-center transform transition-all duration-300 hover:translate-x-2">
                      <i className="ri-check-line text-green-600 mr-2"></i>
                      Auch Wochenende
                    </li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className={`text-center transition-all duration-700 delay-600 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 border border-gray-100 group">
                  <div className="w-20 h-20 flex items-center justify-center bg-gradient-to-br from-[#2C5545] to-[#1A3A2E] rounded-2xl mx-auto mb-6 shadow-lg relative transition-all duration-300 group-hover:rotate-6">
                    <i className="ri-truck-line text-white text-3xl transition-all duration-300 group-hover:scale-110"></i>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#D4A520] rounded-full flex items-center justify-center text-white font-black text-sm animate-pulse">
                      3
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-[#1A1A1A] mb-4" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                    <DynamicContent
                      page="home"
                      section="process"
                      contentType="step3_title"
                      fallback="LIEFERUNG"
                    />
                  </h3>
                  <p className="text-sm md:text-base text-gray-700 mb-4">
                    <DynamicContent
                      page="home"
                      section="process"
                      contentType="step3_description"
                      fallback="Pünktliche Lieferung direkt vor Ihr Haus. Nur 43,50€ ab 3 SRM im 150km Umkreis."
                    />
                  </p>
                  <ul className="text-xs md:text-sm text-gray-600 space-y-1">
                    <li className="flex items-center transform transition-all duration-300 hover:translate-x-2">
                      <i className="ri-check-line text-green-600 mr-2"></i>
                      Pünktlich & zuverlässig
                    </li>
                    <li className="flex items-center transform transition-all duration-300 hover:translate-x-2">
                      <i className="ri-check-line text-green-600 mr-2"></i>
                      Nur 43,50€ ab 3 SRM
                    </li>
                    <li className="flex items-center transform transition-all duration-300 hover:translate-x-2">
                      <i className="ri-check-line text-green-600 mr-2"></i>
                      Professionelle Abladung
                    </li>
                  </ul>
                </div>
              </div>

              {/* Step 4 */}
              <div className={`text-center transition-all duration-700 delay-800 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 border border-gray-100 group">
                  <div className="w-20 h-20 flex items-center justify-center bg-gradient-to-br from-[#C04020] to-[#A03318] rounded-2xl mx-auto mb-6 shadow-lg relative transition-all duration-300 group-hover:rotate-6">
                    <i className="ri-fire-line text-white text-3xl transition-all duration-300 group-hover:scale-110"></i>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#C04020] rounded-full flex items-center justify-center text-white font-black text-sm animate-pulse">
                      4
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-[#1A1A1A] mb-4" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                    <DynamicContent
                      page="home"
                      section="process"
                      contentType="step4_title"
                      fallback="GENIESSEN"
                    />
                  </h3>
                  <p className="text-sm md:text-base text-gray-700 mb-4">
                    <DynamicContent
                      page="home"
                      section="process"
                      contentType="step4_description"
                      fallback="Sofort einsatzbereit! Lehnen Sie sich zurück und genießen Sie 70% mehr Wärme bei weniger Verbrauch."
                    />
                  </p>
                  <ul className="text-xs md:text-sm text-gray-600 space-y-1">
                    <li className="flex items-center transform transition-all duration-300 hover:translate-x-2">
                      <i className="ri-check-line text-green-600 mr-2"></i>
                      Sofort brennbereit
                    </li>
                    <li className="flex items-center transform transition-all duration-300 hover:translate-x-2">
                      <i className="ri-check-line text-green-600 mr-2"></i>
                      70% höherer Heizwert
                    </li>
                    <li className="flex items-center transform transition-all duration-300 hover:translate-x-2">
                      <i className="ri-check-line text-green-600 mr-2"></i>
                      Gemütliche Wärme
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-gradient-to-r from-[#F5F0E0] to-white border-2 border-[#D4A520] text-[#1A1A1A] rounded-2xl p-6 md:p-8 shadow-2xl mt-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-black mb-4" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                <DynamicContent
                  page="home"
                  section="process"
                  contentType="info_title_part1"
                  fallback="WAS PASSIERT"
                /> <span className="text-[#C04020...">
                  <DynamicContent
                    page="home"
                    section="process"
                    contentType="info_title_part2"
                    fallback="NACH IHRER BESTELLUNG?"
                  />
                </span>
              </h3>
              <p className="text-base md:text-lg text-gray-700 max-w-3xl mx-auto">
                <DynamicContent
                  page="home"
                  section="process"
                  contentType="info_subtitle"
                  fallback="Detaillierter Ablauf - Schritt für Schritt zu Ihrem Premium-Brennholz"
                />
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="space-y-4">
                <h4 className="text-xl font-black text-[#C04020] mb-4">PERSÖNLICHER KONTAKT:</h4>
                <div className="flex items-start">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#D4A520] rounded-full mr-3 flex-shrink-0 mt-0.5">
                    <i className="ri-phone-line text-white text-sm"></i>
                  </div>
                  <div>
                    <p className="font-bold mb-1 text-[#1A1A1A]">Persönlicher Anruf</p>
                    <p className="text-sm text-gray-600">Wir bestätigen Ihre Bestellung und klären letzte Details</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#D4A520] rounded-full mr-3 flex-shrink-0 mt-0.5">
                    <i className="ri-calculator-line text-white text-sm"></i>
                  </div>
                  <div>
                    <p className="font-bold mb-1 text-[#1A1A1A]">Lieferkosten berechnen</p>
                    <p className="text-sm text-gray-600">43,50€ ab 3 SRM - bei kleineren Mengen individuelle Berechnung</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#D4A520] rounded-full mr-3 flex-shrink-0 mt-0.5">
                    <i className="ri-calendar-line text-white text-sm"></i>
                  </div>
                  <div>
                    <p className="font-bold mb-1 text-[#1A1A1A]">Terminvereinbarung</p>
                    <p className="text-sm text-gray-600">Flexibel nach Ihren Wünschen - auch Express möglich</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-black text-[#C04020] mb-4">AM LIEFERTAG:</h4>
                <div className="flex items-start">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#D4A520] rounded-full mr-3 flex-shrink-0 mt-0.5">
                    <i className="ri-message-line text-white text-sm"></i>
                  </div>
                  <div>
                    <p className="font-bold mb-1 text-[#1A1A1A]">SMS, Anruf oder WhatsApp</p>
                <p className="text-sm text-gray-600">Sie erhalten eine Benachrichtigung vor der Anlieferung</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#D4A520] rounded-full mr-3 flex-shrink-0 mt-0.5">
                    <i className="ri-truck-line text-white text-sm"></i>
                  </div>
                  <div>
                    <p className="font-bold mb-1 text-[#1A1A1A]">Professionelle Anlieferung</p>
                    <p className="text-sm text-gray-600">Saubere Abladung direkt vor Ihr Haus</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#D4A520] rounded-full mr-3 flex-shrink-0 mt-0.5">
                    <i className="ri-clipboard-line text-white text-sm"></i>
                  </div>
                  <div>
                    <p className="font-bold mb-1 text-[#1A1A1A]">Qualitätskontrolle</p>
                    <p className="text-sm text-gray-600">Gemeinsame Überprüfung der Lieferung</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className={`text-center mt-12 transition-all duration-1000 delay-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="bg-gradient-to-r from-[#D4A520] to-[#FFD700] text-[#1A1A1A] rounded-2xl p-6 md:p-8 shadow-2xl max-w-2xl mx-auto hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
              <h3 className="text-2xl md:text-3xl font-black mb-4" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                <DynamicContent
                  page="home"
                  section="process"
                  contentType="cta_title"
                  fallback="BEREIT FÜR IHR PREMIUM-BRENNHOLZ?"
                />
              </h3>
              <p className="text-base md:text-lg mb-6 font-medium">
                <DynamicContent
                  page="home"
                  section="process"
                  contentType="cta_subtitle"
                  fallback="Schließen Sie sich über 6.000 zufriedenen Familien an"
                />
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-[#C04020] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#A03318] transition-all duration-300 whitespace-nowrap cursor-pointer shadow-xl transform hover:scale-105">
                  <i className="ri-shopping-cart-line mr-3"></i>
                  Jetzt bestellen & sparen
                </button>
                <button className="border-2 border-[#C04020] text-[#C04020] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#C04020] hover:text-white transition-all duration-300 whitespace-nowrap cursor-pointer transform hover:scale-105">
                  <i className="ri-phone-line mr-3"></i>
                  Kostenlose Beratung
                </button>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs md:text-sm opacity-80">
                <span className="flex items-center transform transition-all duration-300 hover:scale-110">
                  <i className="ri-phone-line mr-1"></i>
                  Kostenlose Beratung
                </span>
                <span className="flex items-center transform transition-all duration-300 hover:scale-110">
                  <i className="ri-truck-line mr-1"></i>
                  Schnelle Lieferung
                </span>
                <span className="flex items-center transform transition-all duration-300 hover:scale-110">
                  <i className="ri-check-line mr-1"></i>
                  Lieferung ab 3 SRM nur 43,50€
                </span>
                <span className="flex items-center transform transition-all duration-300 hover:scale-110">
                  <i className="ri-check-line mr-1"></i>
                  24-48h Express gegen Aufpreis
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
