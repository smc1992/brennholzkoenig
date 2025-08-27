
'use client';

import { useState, useEffect, useRef } from 'react';

export default function ContactInfo() {
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
    <section ref={sectionRef} className="py-8 sm:py-12 lg:py-16 bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto lg:mx-0">
          <div className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            {/* Premium Badge */}
            <div className="inline-flex items-center bg-[#1A1A1A] text-white px-4 py-2 rounded-full font-bold text-sm mb-6">
              <i className="ri-customer-service-line mr-2 flex-shrink-0"></i>
              <span className="whitespace-nowrap">PERSÖNLICHE BERATUNG</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1A1A1A] mb-4 leading-tight" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              DIREKTE <span className="text-[#C04020]">KONTAKTMÖGLICHKEITEN</span>
            </h2>

            <p className="text-lg text-gray-700 mb-8" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              Erreichen Sie unsere Brennholz-Experten von Brennholhandel Vey auf verschiedenen Wegen
            </p>
          </div>

          {/* Contact Options */}
          <div className={`space-y-6 transition-all duration-1000 delay-300 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            {/* Mobile */}
            <div className="bg-gradient-to-r from-[#F5F0E0] to-white rounded-2xl p-6 shadow-lg border border-[#D4A520]/20">
              <div className="flex items-center">
                <div className="w-16 h-16 flex items-center justify-center bg-[#D4A520] rounded-full mr-6 flex-shrink-0">
                  <i className="ri-smartphone-fill text-white text-2xl"></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-[#1A1A1A] mb-2" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                    MOBIL - EXPRESS HOTLINE
                  </h3>
                  <a href="tel:+4917671085234" className="text-2xl font-bold text-[#C04020] hover:text-[#A03318] transition-colors duration-300 cursor-pointer">
                    +49 176 71085234
                  </a>
                  <p className="text-sm text-gray-600 mt-1">
                    Für Express-Lieferungen und dringende Anfragen
                  </p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="bg-gradient-to-r from-[#F5F0E0] to-white rounded-2xl p-6 shadow-lg border border-[#D4A520]/20">
              <div className="flex items-center">
                <div className="w-16 h-16 flex items-center justify-center bg-[#1A1A1A] rounded-full mr-6 flex-shrink-0">
                  <i className="ri-mail-fill text-white text-2xl"></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-[#1A1A1A] mb-2" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                    E-MAIL
                  </h3>
                  <a href="mailto:info@brennholz-koenig.de" className="text-xl font-bold text-[#C04020] hover:text-[#A03318] transition-colors duration-300 cursor-pointer break-all">
                    info@brennholz-koenig.de
                  </a>
                  <p className="text-sm text-gray-700 mb-3 sm:mb-4" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                    Senden Sie uns eine E-Mail mit Ihren Fragen.
                  </p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-gradient-to-r from-[#F5F0E0] to-white rounded-2xl p-6 shadow-lg border border-[#D4A520]/20">
              <div className="flex items-center">
                <div className="w-16 h-16 flex items-center justify-center bg-[#8B4513] rounded-full mr-6 flex-shrink-0">
                  <i className="ri-map-pin-fill text-white text-2xl"></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-[#1A1A1A] mb-2" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                    BESUCHSADRESSE
                  </h3>
                  <div className="space-y-1">
                    <p className="font-bold text-lg">Brennholhandel Vey</p>
                    <p className="text-base">Frankfurter Straße 3</p>
                    <p className="text-base">36419 Buttlar</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Termine nach Vereinbarung - bitte vorab anrufen
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className={`mt-8 bg-gradient-to-r from-[#1A1A1A] to-[#2A2A2A] text-white rounded-2xl p-6 transition-all duration-1000 delay-600 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <div className="flex items-center">
              <div className="w-12 h-12 flex items-center justify-center bg-[#D4A520] rounded-full mr-4 flex-shrink-0">
                <i className="ri-time-line text-white text-xl"></i>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">Schnelle Rückmeldung</h4>
                <p className="text-sm opacity-90">
                  Wir bearbeiten alle Anfragen schnellstmöglich und melden uns zeitnah bei Ihnen zurück.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
