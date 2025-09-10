
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import DynamicImage from './DynamicImage';
import DynamicContent from './DynamicContent';

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState('');

  useEffect(() => {
    setIsVisible(true);

    // Standard Fallback-URL
    const fallbackUrl = 'https://readdy.ai/api/search-image?query=Premium%20firewood%20warehouse%20with%20stacked%20dry%20oak%20wood%20logs%2C%20professional%20firewood%20business%20setting%2C%20wooden%20atmosphere%20with%20natural%20lighting%2C%20cozy%20rustic%20wood%20storage%20facility%2C%20organized%20firewood%20display%20in%20German%20countryside%2C%20warm%20wood%20textures%20and%20timber%20stacks%2C%20professional%20lumber%20yard%20environment%20with%20golden%20hour%20lighting%20creating%20warm%20wood%20tones&width=1920&height=1080&seq=hero-firewood-v2&orientation=landscape';

    // Dynamisches Bild laden mit verbessertem Error-Handling
    const loadHeroImage = async () => {
      try {
        const response = await fetch('/api/content?page=home&section=hero&type=background_image');
        
        // Prüfe ob Response OK ist
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Prüfe Content-Type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Expected JSON, got ${contentType}`);
        }
        
        const data = await response.json();
        
        // Validiere Response-Struktur
        if (data && typeof data === 'object' && data.content) {
          setHeroImageUrl(data.content);
        } else {
          console.warn('Invalid API response structure:', data);
          setHeroImageUrl(fallbackUrl);
        }
      } catch (error) {
        console.error('Fehler beim Laden des Hero-Bildes:', error);
        setHeroImageUrl(fallbackUrl);
      }
    };

    loadHeroImage();
  }, []);

  const scrollToProducts = () => {
    document.getElementById('produkte')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToContact = () => {
    document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' });
  };

  const openWhatsApp = () => {
    const phoneNumber = "4917671085234";
    const message = "Hallo, ich interessiere mich für Ihr Premium Brennholz und hätte gerne eine kostenlose Beratung.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setShowWhatsAppModal(false);
  };

  return (
    <section 
      className="overflow-visible"
      style={{
        minHeight: '100vh',
        paddingTop: '60px',
        pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3)), url('${heroImageUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 w-full relative max-w-7xl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '2rem', paddingBottom: '4rem', pointerEvents: 'auto' }}>
        <div className="max-w-6xl mx-auto w-full">
          {/* Trust Badge */}
          <div className="flex justify-center sm:justify-start mb-6 sm:mb-8">
            <div className="inline-flex items-center bg-[#C04020] text-white px-3 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-xs sm:text-base shadow-2xl max-w-fit">
              <div className="w-4 h-4 sm:w-6 sm:h-6 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <i className="ri-award-fill text-sm sm:text-lg"></i>
              </div>
              <span className="font-black text-xs sm:text-base leading-none">6.847 ZUFRIEDENE KUNDEN</span>
            </div>
          </div>

          {/* Main Headline - Jetzt mit DynamicContent */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-6 sm:mb-8 leading-tight tracking-tight text-center sm:text-left" style={{ fontFamily: 'Inter, Arial, sans-serif', fontWeight: '900' }}>
            <DynamicContent 
              page="home" 
              section="hero" 
              contentType="title"
              fallback="KÖNIGLICH WARM DURCH DEN WINTER"
              tag="span"
              className="text-[#D4A520] drop-shadow-2xl block"
            />
          </h1>

          {/* Subheadline - Jetzt mit DynamicContent */}
          <DynamicContent 
            page="home" 
            section="hero" 
            contentType="subtitle"
            fallback="Premium Brennholz mit 70% höherem Heizwert - Sparen Sie durchschnittlich 721€ jährlich"
            tag="p"
            className="text-lg sm:text-xl lg:text-2xl text-white/95 font-bold mb-6 sm:mb-8 drop-shadow-lg leading-tight text-center sm:text-left max-w-3xl"
          />

          {/* Benefits Box */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 sm:p-6 lg:p-8 mb-8 sm:mb-10 border-2 border-[#D4A520] max-w-full sm:max-w-2xl xl:max-w-3xl shadow-2xl">
            <div className="flex items-center justify-center sm:justify-start mb-4 sm:mb-5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-[#C04020] rounded-full mr-3 sm:mr-4">
                <i className="ri-fire-fill text-white text-xl sm:text-2xl"></i>
              </div>
              <DynamicContent 
                page="home" 
                section="hero" 
                contentType="benefits_title"
                fallback="PREMIUM VORTEILE"
                tag="h3"
                className="text-xl sm:text-2xl text-[#C04020] font-black"
              />
            </div>
            <div className="space-y-3 sm:space-y-4 text-[#1A1A1A] text-base sm:text-lg">
              <div className="flex items-start sm:items-center">
                <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 mt-0.5 sm:mt-0">
                  <i className="ri-money-euro-circle-line text-[#2C5545] text-xl sm:text-2xl"></i>
                </div>
                <span className="font-bold leading-tight">70% weniger Heizkosten durch höheren Heizwert</span>
              </div>
              <div className="flex items-start sm:items-center">
                <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 mt-0.5 sm:mt-0">
                  <i className="ri-truck-line text-[#2C5545] text-xl sm:text-2xl"></i>
                </div>
                <span className="font-bold leading-tight">Kostengünstige 24-48h Lieferung ab 3 SRM</span>
              </div>
              <div className="flex items-start sm:items-center">
                <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 mt-0.5 sm:mt-0">
                  <i className="ri-shield-check-line text-[#2C5545] text-xl sm:text-2xl"></i>
                </div>
                <span className="font-bold leading-tight">Garantiert unter 8% Restfeuchte - Sofort brennbar</span>
              </div>
              <div className="flex items-start sm:items-center">
                <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 mt-0.5 sm:mt-0">
                  <i className="ri-recycle-line text-[#2C5545] text-xl sm:text-2xl"></i>
                </div>
                <span className="font-bold leading-tight">Gesiebt - Kein Dreck, keine Späne, nur sauberes Holz</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons - Jetzt mit DynamicContent */}
          <div className={`flex flex-col sm:flex-row gap-4 sm:gap-6 mb-12 sm:mb-16 max-w-full sm:max-w-none mx-auto sm:mx-0 transition-all duration-1000 delay-1200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <button 
              onClick={() => setShowWhatsAppModal(true)}
              className="bg-[#25D366] text-white px-6 sm:px-10 py-5 sm:py-6 text-base sm:text-xl font-black rounded-2xl hover:bg-[#128C7E] transition-all duration-300 cursor-pointer shadow-2xl transform hover:scale-105 w-full sm:w-auto flex items-center justify-center min-w-0"
            >
              <div className="w-7 h-7 sm:w-6 sm:h-6 inline-flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <i className="ri-whatsapp-fill text-lg sm:text-xl"></i>
              </div>
              <DynamicContent 
                page="home" 
                section="hero" 
                contentType="button_primary"
                fallback="WHATSAPP BERATUNG"
                tag="span"
                className="min-w-0 truncate"
              />
            </button>
            <Link href="/kontakt" className="bg-white text-[#C04020] px-6 sm:px-10 py-5 sm:py-6 text-base sm:text-xl font-black rounded-2xl hover:bg-gray-50 transition-all duration-300 cursor-pointer shadow-2xl border-2 border-[#C04020] transform hover:scale-105 w-full sm:w-auto inline-flex items-center justify-center min-w-0">
              <div className="w-7 h-7 sm:w-6 sm:h-6 inline-flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <i className="ri-phone-fill text-lg sm:text-xl"></i>
              </div>
              <DynamicContent 
                page="home" 
                section="hero" 
                contentType="button_secondary"
                fallback="KOSTENLOSE BERATUNG"
                tag="span"
                className="min-w-0 truncate"
              />
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-white max-w-4xl mx-auto sm:mx-0 mb-8 sm:mb-12">
            <div className={`text-center bg-black/40 backdrop-blur-sm rounded-xl py-4 sm:py-6 px-3 sm:px-4 transition-all duration-800 delay-1500 hover:bg-black/50 border border-white/30 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#D4A520] mb-2">27</div>
              <div className="text-sm sm:text-base font-bold leading-tight">Jahre Erfahrung</div>
            </div>
            <div className={`text-center bg-black/40 backdrop-blur-sm rounded-xl py-4 sm:py-6 px-3 sm:px-4 transition-all duration-800 delay-1700 hover:bg-black/50 border border-white/30 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#D4A520] mb-2">6.847</div>
              <div className="text-sm sm:text-base font-bold leading-tight">Zufriedene Kunden</div>
            </div>
            <div className={`text-center bg-black/40 backdrop-blur-sm rounded-xl py-4 sm:py-6 px-3 sm:px-4 transition-all duration-800 delay-1900 hover:bg-black/50 border border-white/30 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#D4A520] mb-2">24-48H</div>
              <div className="text-sm sm:text-base font-bold leading-tight">Express Lieferung</div>
            </div>
            <div className={`text-center bg-black/40 backdrop-blur-sm rounded-xl py-4 sm:py-6 px-3 sm:px-4 transition-all duration-800 delay-2100 hover:bg-black/50 border border-white/30 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#D4A520] mb-2">★★★★★</div>
              <div className="text-sm sm:text-base font-bold leading-tight">4.9/5 Bewertung</div>
            </div>
          </div>

          {/* PWA Prompt Widget wurde entfernt */}

          {/* WhatsApp Modal */}
          {showWhatsAppModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-auto shadow-2xl transform animate-in slide-in-from-bottom-4 duration-300">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-whatsapp-fill text-white text-3xl"></i>
                  </div>
                  <h3 className="text-2xl font-black text-[#1A1A1A] mb-2">
                    WhatsApp Beratung
                  </h3>
                  <p className="text-gray-600">
                    Erhalten Sie sofortige Beratung über WhatsApp von unserem Brennholz-Experten
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="w-5 h-5 flex items-center justify-center mr-3 text-green-500">
                      <i className="ri-check-line font-bold"></i>
                    </div>
                    <span>Kostenlose Beratung zu allen Brennholz-Fragen</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="w-5 h-5 flex items-center justify-center mr-3 text-green-500">
                      <i className="ri-check-line font-bold"></i>
                    </div>
                    <span>Schnelle Antworten und direkte Bestellung möglich</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="w-5 h-5 flex items-center justify-center mr-3 text-green-500">
                      <i className="ri-check-line font-bold"></i>
                    </div>
                    <span>Persönliche Empfehlungen für Ihre Bedürfnisse</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowWhatsAppModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={openWhatsApp}
                    className="flex-1 bg-[#25D366] text-white py-3 px-6 rounded-xl font-bold hover:bg-[#128C7E] transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <div className="w-5 h-5 flex items-center justify-center mr-2">
                      <i className="ri-whatsapp-fill"></i>
                    </div>
                    Chat starten
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


    </section>
  );
}
