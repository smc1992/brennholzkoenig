
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
    <section ref={sectionRef} className="py-8 sm:py-12 lg:py-16 bg-white overflow-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto lg:mx-0 w-full">
          <div className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            {/* Premium Badge */}
            <div className="inline-flex items-center bg-[#1A1A1A] text-white px-4 py-2 rounded-full font-bold text-sm mb-6">
              <i className="ri-customer-service-line mr-2 flex-shrink-0"></i>
              <span className="whitespace-nowrap">PERSÖNLICHE BERATUNG</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1A1A1A] mb-4 leading-tight" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              DIREKTE <span className="text-[#C04020]">KONTAKTMÖGLICHKEITEN</span>
            </h2>

            <p className="text-lg text-gray-700 mb-4" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              Erreichen Sie unsere Brennholz-Experten vom Brennholzkönig auf verschiedenen Wegen
            </p>
            
            <div className="bg-[#C04020] text-white rounded-xl p-4 mb-8">
              <div className="flex items-center">
                <i className="ri-store-3-line text-2xl mr-3 flex-shrink-0"></i>
                <div>
                  <h3 className="font-bold text-lg mb-1">ABHOLMARKT</h3>
                  <p className="text-sm opacity-90">Besuche nur mit persönlichem Termin möglich</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Options */}
          <div className={`space-y-6 transition-all duration-1000 delay-300 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            {/* Mobile */}
            <a href="tel:+4917671085234" className="block bg-gradient-to-r from-[#F5F0E0] to-white rounded-2xl p-4 sm:p-6 shadow-lg border border-[#D4A520]/20 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center flex-wrap sm:flex-nowrap">
                <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-[#D4A520] rounded-full mr-4 sm:mr-6 flex-shrink-0">
                  <i className="ri-smartphone-fill text-white text-xl sm:text-2xl"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-black text-[#1A1A1A] mb-2" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                    MOBIL - EXPRESS HOTLINE
                  </h3>
                  <div className="text-xl sm:text-2xl font-bold text-[#C04020] hover:text-[#A03318] transition-colors duration-300 cursor-pointer break-all">
                    +49 176 71085234
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Besuche des Lagers / Selbstabholmarkt nur mit persönlichem Termin möglich
                  </p>
                </div>
              </div>
            </a>

            {/* WhatsApp */}
            <a href="https://wa.me/4917671085234" target="_blank" rel="noopener noreferrer" className="block bg-gradient-to-r from-[#F5F0E0] to-white rounded-2xl p-4 sm:p-6 shadow-lg border border-[#D4A520]/20 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center flex-wrap sm:flex-nowrap">
                <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-[#25D366] rounded-full mr-4 sm:mr-6 flex-shrink-0">
                  <i className="ri-whatsapp-fill text-white text-xl sm:text-2xl"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-black text-[#1A1A1A] mb-2" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                    WHATSAPP
                  </h3>
                  <div className="text-xl sm:text-2xl font-bold text-[#C04020] hover:text-[#A03318] transition-colors duration-300 cursor-pointer break-all">
                    +49 176 71085234
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Schnelle Nachrichten und Bilder senden
                  </p>
                </div>
              </div>
            </a>

            {/* Email */}
            <a href="mailto:info@brennholz-koenig.de" className="block bg-gradient-to-r from-[#F5F0E0] to-white rounded-2xl p-4 sm:p-6 shadow-lg border border-[#D4A520]/20 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center flex-wrap sm:flex-nowrap">
                <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-[#1A1A1A] rounded-full mr-4 sm:mr-6 flex-shrink-0">
                  <i className="ri-mail-fill text-white text-xl sm:text-2xl"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-black text-[#1A1A1A] mb-2" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                    E-MAIL
                  </h3>
                  <div className="text-base sm:text-xl font-bold text-[#C04020] hover:text-[#A03318] transition-colors duration-300 cursor-pointer break-all">
                    info@brennholz-koenig.de
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Für ausführliche Anfragen und Informationen
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
