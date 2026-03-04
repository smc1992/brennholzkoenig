
'use client';

import { useState, useEffect, useRef } from 'react';

export default function TeamSection() {
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
    <section ref={sectionRef} className="py-20 bg-gradient-to-b from-[#F5F0E0] to-white">
      <div className="container mx-auto px-4">
        <div className={`text-center mb-12 transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            UNSER <span className="text-[#C04020]">TEAM</span>
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto" style={{ fontFamily: 'Barlow, sans-serif' }}>
            Natürlich stemmt Thorsten das alles nicht ganz allein. Unterstützt wird er von einem 
            kleinen, engagierten Team im Hintergrund.
          </p>
        </div>

        <div className={`grid md:grid-cols-3 gap-8 transition-all duration-1000 delay-300 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-[#C04020]">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#C04020] to-[#A03318] rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-user-star-line text-white text-3xl"></i>
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Thorsten Vey
              </h3>
              <p className="text-[#C04020] font-bold mb-1">Der Brennholzkönig</p>
              <p className="text-sm text-gray-600 mb-3">Geschäftsführer & Herzstück</p>
              <p className="text-gray-700 text-sm" style={{ fontFamily: 'Barlow, sans-serif' }}>
                Holzkenner, Anpacker, Lkw-Fahrer, Mechaniker und Kundenberater in einer Person. 
                Mit Leidenschaft und Diesel im Blut.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#D4A520] to-[#B8941C] rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-team-line text-white text-3xl"></i>
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Das Team
              </h3>
              <p className="text-[#C04020] font-bold mb-1">Produktion & Logistik</p>
              <p className="text-sm text-gray-600 mb-3">Engagierte Mitarbeiter</p>
              <p className="text-gray-700 text-sm" style={{ fontFamily: 'Barlow, sans-serif' }}>
                Ein kleines, aber feines Team sorgt im Hintergrund für reibungslose Abläufe 
                und unterstützt Thorsten tatkräftig.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#8B4513] to-[#6B3410] rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-map-pin-line text-white text-3xl"></i>
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Regional Vernetzt
              </h3>
              <p className="text-[#C04020] font-bold mb-1">4 Bundesländer</p>
              <p className="text-sm text-gray-600 mb-3">Rhön, Hessen, Thüringen, Bayern</p>
              <p className="text-gray-700 text-sm" style={{ fontFamily: 'Barlow, sans-serif' }}>
                Gemeinsam versorgen wir mittlerweile über 6.000 Kunden mit erstklassigem 
                Brennholz direkt aus der Region.
              </p>
            </div>
          </div>
        </div>

        <div className={`text-center mt-12 transition-all duration-1000 delay-600 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="bg-[#1A1A1A] text-white rounded-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-[#D4A520] mb-4">Ehrlich. Bodenständig. Kompetent.</h3>
            <p className="text-lg mb-6" style={{ fontFamily: 'Barlow, sans-serif' }}>
              Das ist Brennholzkönig. Das ist Thorsten Vey.
            </p>
            <a href="https://wa.me/4917671085234" target="_blank" rel="noopener noreferrer" className="bg-[#C04020] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#A03318] transition-colors whitespace-nowrap cursor-pointer inline-block text-center">
              Jetzt Thorsten kontaktieren
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
