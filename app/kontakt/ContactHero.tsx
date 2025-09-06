
'use client';

import { useEffect, useState } from 'react';

export default function ContactHero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section 
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url('https://readdy.ai/api/search-image?query=Premium%20firewood%20warehouse%20with%20stacked%20dry%20wood%20logs%2C%20professional%20firewood%20business%20setting%2C%20wooden%20atmosphere%20with%20natural%20lighting%2C%20cozy%20rustic%20wood%20storage%20facility%2C%20organized%20firewood%20display%20in%20German%20countryside%2C%20warm%20wood%20textures%20and%20timber%20stacks%2C%20professional%20lumber%20yard%20environment&width=1920&height=1080&seq=contact-hero-wood-v3&orientation=landscape')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="max-w-4xl">
          {/* Vereinfachte Hauptüberschrift */}
          <h1 className={`text-5xl sm:text-6xl md:text-7xl font-black text-white mb-6 leading-tight transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            <span className="text-[#D4A520] block">KONTAKT</span>
            <span className="text-white block text-3xl sm:text-4xl md:text-5xl font-normal">Sprechen Sie mit uns</span>
          </h1>

          {/* Einfache Beschreibung */}
          <p className={`text-xl sm:text-2xl text-white/90 mb-12 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            Kostenlose Brennholz-Beratung von Brennholzhandel Vey
          </p>

          {/* Reduzierte Kontakt-Optionen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className={`bg-white/95 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 cursor-pointer ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '600ms' }}>
              <div className="w-16 h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 shadow-lg">
                <i className="ri-phone-fill text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-black mb-3 text-[#1A1A1A]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                ANRUFEN
              </h3>
              <p className="text-[#C04020] font-bold text-2xl mb-2">+49 176 71085234</p>
              <p className="text-sm text-gray-600">Mo-Fr 7-18 Uhr</p>
            </div>

            <div className={`bg-white/95 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 cursor-pointer ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '900ms' }}>
              <div className="w-16 h-16 flex items-center justify-center bg-[#D4A520] rounded-full mx-auto mb-4 shadow-lg">
                <i className="ri-mail-fill text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-black mb-3 text-[#1A1A1A]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                E-MAIL SENDEN
              </h3>
              <p className="text-[#C04020] font-bold text-xl mb-2 break-words">info@brennholz-koenig.de</p>
            </div>
          </div>

          {/* Einfache Call-to-Action */}
          <div className={`flex flex-col sm:flex-row gap-4 max-w-2xl transition-all duration-1000 delay-1200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <a 
              href="tel:+4917671085234"
              className="bg-[#C04020] text-white px-10 py-5 text-xl font-bold rounded-xl hover:bg-[#A03318] transition-all duration-300 text-center whitespace-nowrap cursor-pointer shadow-lg transform hover:scale-105 flex items-center justify-center"
            >
              <div className="w-6 h-6 flex items-center justify-center mr-3">
                <i className="ri-phone-fill text-xl"></i>
              </div>
              JETZT ANRUFEN
            </a>
            <a 
              href="https://wa.me/4917671085234"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white px-10 py-5 text-xl font-bold rounded-xl hover:bg-[#1DA851] transition-all duration-300 text-center whitespace-nowrap cursor-pointer shadow-lg transform hover:scale-105 flex items-center justify-center"
            >
              <div className="w-6 h-6 flex items-center justify-center mr-3">
                <i className="ri-whatsapp-fill text-xl"></i>
              </div>
              WHATSAPP
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
