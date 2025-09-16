
'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

export default function QualifierSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
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
    <section ref={sectionRef} className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-[#F5F0E0] to-white overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="inline-flex items-center bg-[#C04020] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-sm sm:text-base mb-4 sm:mb-6">
            <i className="ri-question-line mr-2 flex-shrink-0"></i>
            <span className="whitespace-nowrap">EHRLICHE BERATUNG</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-[#1A1A1A] mb-4 sm:mb-6 leading-tight" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            IST UNSER <span className="text-[#C04020]">INDUSTRIEHOLZ</span> DAS RICHTIGE FÜR SIE?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed px-4" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            Wir sind ehrlich zu unseren Kunden. Unser Premium-Industrieholz ist nicht für jeden geeignet. 
            Prüfen Sie hier, ob es zu Ihren Bedürfnissen passt.
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
            {/* Geeignet für - Mobile optimiert */}
            <div className="bg-gradient-to-br from-[#F5F0E0] to-[#F0E8D0] border-2 border-[#D4A520] rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl">
              <div className="text-center mb-4 sm:mb-6 lg:mb-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 flex items-center justify-center bg-[#D4A520] rounded-full mx-auto mb-3 sm:mb-4 shadow-lg">
                  <i className="ri-check-line text-white text-lg sm:text-2xl lg:text-3xl"></i>
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1A1A1A] mb-2 leading-tight" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                  ✓ PERFEKT GEEIGNET FÜR:
                </h3>
                <p className="text-sm sm:text-base lg:text-lg text-[#C04020] font-medium px-2">
                  Diese Kunden profitieren maximal von unserem Industrieholz
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                {[{
                  icon: 'ri-home-line',
                  title: 'Sauberkeitsfanatiker',
                  desc: 'Sie wollen KEIN DRECK IN DER WOHNUNG und schätzen sauberes Holz ohne Rinde und Schmutz',
                  delay: 400
                },
                {
                  icon: 'ri-hammer-line',
                  title: 'Praktische & nachhaltige Menschen',
                  desc: 'Sie verstehen, dass Möbelholz mit kleinen Fehlern genauso gut brennt wie perfektes Holz',
                  delay: 600
                },
                {
                  icon: 'ri-money-euro-circle-line',
                  title: 'Sparfüchse',
                  desc: 'Sie wollen bis zu 1.900€ pro Winter sparen ohne Qualitätsverlust beim Heizen',
                  delay: 800
                },
                {
                  icon: 'ri-hand-coin-line',
                  title: 'Handlichkeitsliebhaber',
                    desc: 'Sie wollen rechteckige Stücke, die viel handlicher und einfacher zu stapeln sind',
                  delay: 1200
                },
                {
                  icon: 'ri-stack-line',
                  title: 'Platzsparliebhaber',
                    desc: 'Ca. 50% weniger Platzbedarf beim Stapeln von Industrieholz',
                  delay: 1200
                }].map((item, index) => (
                  <div key={index} className="flex items-start bg-white rounded-lg p-3 sm:p-4 shadow-sm">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-[#D4A520] rounded-full mr-3 sm:mr-4 flex-shrink-0 mt-0.5">
                      <i className={`${item.icon} text-white text-xs sm:text-sm`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-[#1A1A1A] mb-1 text-sm sm:text-base leading-tight">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-[#666] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nicht geeignet für - Mobile optimiert */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl">
              <div className="text-center mb-4 sm:mb-6 lg:mb-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 flex items-center justify-center bg-red-500 rounded-full mx-auto mb-3 sm:mb-4 shadow-lg">
                  <i className="ri-close-line text-white text-lg sm:text-2xl lg:text-3xl"></i>
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-red-800 mb-2 leading-tight" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                  ✗ NICHT GEEIGNET FÜR:
                </h3>
                <p className="text-sm sm:text-base lg:text-lg text-red-700 font-medium px-2">
                  Für diese Bedürfnisse empfehlen wir andere Produkte
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                 {[{
                   icon: 'ri-eye-line',
                   title: 'Optik-Perfektionisten',
                   desc: 'Sie brauchen schön aussehende Scheite für repräsentative Kamine (→ nehmen Sie unser Scheitholz)',
                   delay: 600
                 },
                 {
                   icon: 'ri-fire-fill',
                   title: 'Zentrale Holzvergaserheizungen',
                     desc: 'Bei modernen Holzvergasern kann es durch das Industrieholz zu einer zu hohen Hitzeentwicklung kommen.',
                   delay: 800
                 },
                 {
                   icon: 'ri-ruler-line',
                   title: 'Spezielle Größenanforderungen',
                   desc: 'Ihr Ofen braucht sehr spezifische Holzmaße (→ unser Scheitholz in 25cm/33cm ist besser)',
                   delay: 900
                 },
                 {
                   icon: 'ri-time-line',
                   title: 'Traditionalisten',
                   desc: 'Sie setzen auf Althergebrachtes und möchten nichts Neues wagen (→ bleiben Sie bei bewährtem Scheitholz)',
                   delay: 1000
                 },
                {
                  icon: 'ri-seedling-line',
                  title: 'Anfänger ohne Erfahrung',
                  desc: 'Sie haben noch nie mit Industrieholz geheizt (→ starten Sie zum Testen mit 3,5 SRM Industrieholz + 3,5 SRM Buche)',
                  delay: 1400
                }].map((item, index) => (
                  <div key={index} className="flex items-start bg-white rounded-lg p-3 sm:p-4 shadow-sm">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-red-500 rounded-full mr-3 sm:mr-4 flex-shrink-0 mt-0.5">
                      <i className={`${item.icon} text-white text-xs sm:text-sm`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-red-800 mb-1 text-sm sm:text-base leading-tight">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-red-700 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Call-to-Action - Mobile optimiert */}
          <div className="bg-gradient-to-r from-[#C04020] to-[#A03318] text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-center shadow-2xl mt-6 sm:mt-8 lg:mt-12">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black mb-3 sm:mb-4 leading-tight" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              NOCH UNSICHER? KOSTENLOSE BERATUNG!
            </h3>
            <p className="text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 opacity-90 px-2">
              Unsere Experten helfen Ihnen bei der richtigen Holzwahl - ehrlich und unverbindlich
            </p>
            
            {/* Zusätzliche Informationen - Mobile optimiert */}
            <div className="bg-white/10 rounded-lg p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm lg:text-base">
                <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left">
                  <i className="ri-fire-line mb-1 sm:mb-0 sm:mr-2 text-[#D4A520] text-sm sm:text-base flex-shrink-0"></i>
                  <span className="font-bold">Raucht nicht</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left">
                  <i className="ri-leaf-line mb-1 sm:mb-0 sm:mr-2 text-[#D4A520] text-sm sm:text-base flex-shrink-0"></i>
                  <span className="font-bold">Qualmt nicht</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left">
                  <i className="ri-sparkling-line mb-1 sm:mb-0 sm:mr-2 text-[#D4A520] text-sm sm:text-base flex-shrink-0"></i>
                  <span className="font-bold">Sauber brennend</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left">
                  <i className="ri-restaurant-line mb-1 sm:mb-0 sm:mr-2 text-[#D4A520] text-sm sm:text-base flex-shrink-0"></i>
                  <span className="font-bold">Perfekt zum Grillen</span>
                </div>
              </div>
            </div>

            {/* Mobile-optimierte Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link href="/kontakt" className="bg-white text-[#C04020] px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-lg font-bold hover:bg-gray-100 transition-colors duration-300 whitespace-nowrap cursor-pointer text-sm sm:text-base w-full sm:w-auto inline-flex items-center justify-center">
                <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center mr-2 inline-flex">
                  <i className="ri-phone-line"></i>
                </div>
                <span>Kostenlose Beratung</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
