'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CityButton } from '@/components/ui/CityButton';

interface CityHeroSectionProps {
  cityName: string;
  heroTitle: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  postalCodes?: string[];
  cityData?: any;
}

export default function CityHeroSection({ 
  cityName, 
  heroTitle, 
  heroSubtitle, 
  heroImageUrl,
  postalCodes,
  cityData 
}: CityHeroSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [finalHeroImageUrl, setFinalHeroImageUrl] = useState('');

  useEffect(() => {
    setIsVisible(true);

    // Standard Fallback-URL
    const fallbackUrl = 'https://readdy.ai/api/search-image?query=Premium%20firewood%20warehouse%20with%20stacked%20dry%20oak%20wood%20logs%2C%20professional%20firewood%20business%20setting%2C%20wooden%20atmosphere%20with%20natural%20lighting%2C%20cozy%20rustic%20wood%20storage%20facility%2C%20organized%20firewood%20display%20in%20German%20countryside%2C%20warm%20wood%20textures%20and%20timber%20stacks%2C%20professional%20lumber%20yard%20environment%20with%20golden%20hour%20lighting%20creating%20warm%20wood%20tones&width=1920&height=1080&seq=hero-firewood-v2&orientation=landscape';

    // Verwende das stadtspezifische Bild oder lade das Standard-Bild
    if (heroImageUrl) {
      setFinalHeroImageUrl(heroImageUrl);
    } else {
      // Dynamisches Bild laden mit verbessertem Error-Handling
      const loadHeroImage = async () => {
        try {
          const response = await fetch('/api/content?page=home&section=hero&type=background_image');
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Expected JSON, got ${contentType}`);
          }
          
          const data = await response.json();
          
          if (data && typeof data === 'object' && data.content) {
            setFinalHeroImageUrl(data.content);
          } else {
            console.warn('Invalid API response structure:', data);
            setFinalHeroImageUrl(fallbackUrl);
          }
        } catch (error) {
          console.error('Fehler beim Laden des Hero-Bildes:', error);
          setFinalHeroImageUrl(fallbackUrl);
        }
      };

      loadHeroImage();
    }
  }, [heroImageUrl]);

  const handleWhatsAppClick = () => {
    setShowWhatsAppModal(true);
  };

  const closeWhatsAppModal = () => {
    setShowWhatsAppModal(false);
  };

  const handleWhatsAppRedirect = () => {
    const message = encodeURIComponent(`Hallo! Ich interessiere mich für Brennholz-Lieferung nach ${cityName}. Können Sie mir ein Angebot machen?`);
    window.open(`https://wa.me/4915123456789?text=${message}`, '_blank');
    closeWhatsAppModal();
  };

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A]">
        {/* Hintergrundbild */}
        <div className="absolute inset-0 z-0">
          {finalHeroImageUrl && (
            <img
              src={finalHeroImageUrl}
              alt={`Premium Brennholz Lieferung ${cityName}`}
              className="w-full h-full object-cover"
              loading="eager"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
        </div>

        {/* Hauptinhalt */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Haupttitel */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 sm:mb-6 md:mb-8 leading-tight tracking-tight" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              {heroTitle}
            </h1>

            {/* Untertitel */}
            {heroSubtitle && (
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 mb-6 sm:mb-8 md:mb-10 max-w-4xl mx-auto leading-relaxed font-medium" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                {heroSubtitle}
              </p>
            )}

            {/* Liefergebiete */}
            {postalCodes && Array.isArray(postalCodes) && postalCodes.length > 0 && (
              <div className="mb-6 sm:mb-8 md:mb-10">
                <p className="text-sm sm:text-base md:text-lg text-white/80 mb-2" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                  Lieferung in folgende Postleitzahlen:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {postalCodes.slice(0, 8).map((code, index) => (
                    <span key={index} className="bg-[#D4A520]/20 text-[#D4A520] px-3 py-1 rounded-full text-sm font-medium">
                      {code}
                    </span>
                  ))}
                  {postalCodes.length > 8 && (
                    <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                      +{postalCodes.length - 8} weitere
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-8 sm:mb-12">
              <CityButton
                type="primary"
                customText={cityData?.hero_cta_text || "Jetzt bestellen"}
                cityData={cityData}
                className="group bg-gradient-to-r from-[#D4A520] to-[#B8941C] hover:from-[#B8941C] hover:to-[#9A7A18] text-white font-bold py-3 sm:py-4 px-6 sm:px-8 md:px-10 rounded-full text-base sm:text-lg md:text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl w-full sm:w-auto min-w-[200px] shadow-xl font-inter"
              >
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-shopping-cart-line text-lg sm:text-xl"></i>
                  <i className="ri-arrow-right-line text-lg sm:text-xl group-hover:translate-x-1 transition-transform"></i>
                </span>
              </CityButton>

              <CityButton
                type="whatsapp"
                customText={cityData?.hero_secondary_cta_text || "WhatsApp Beratung"}
                cityData={cityData}
                className="group bg-gradient-to-r from-[#25D366] to-[#20BA5A] hover:from-[#20BA5A] hover:to-[#1BA34E] text-white font-bold py-3 sm:py-4 px-6 sm:px-8 md:px-10 rounded-full text-base sm:text-lg md:text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl w-full sm:w-auto min-w-[200px] shadow-xl font-inter"
              >
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-whatsapp-line text-lg sm:text-xl"></i>
                  <i className="ri-arrow-right-line text-lg sm:text-xl group-hover:translate-x-1 transition-transform"></i>
                </span>
              </CityButton>
            </div>

            {/* Vertrauensindikatoren */}
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <i className="ri-truck-line text-lg sm:text-xl text-[#D4A520]"></i>
                <span className="text-sm sm:text-base font-medium" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>Zuverlässige Lieferung</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-shield-check-line text-lg sm:text-xl text-[#D4A520]"></i>
                <span className="text-sm sm:text-base font-medium" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>Premium Qualität</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-time-line text-lg sm:text-xl text-[#D4A520]"></i>
                <span className="text-sm sm:text-base font-medium" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>Schnelle Lieferung</span>
              </div>
            </div>
          </div>
        </div>


      </section>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-whatsapp-line text-white text-2xl"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                WhatsApp Beratung
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                Lassen Sie sich persönlich beraten! Unser Team hilft Ihnen gerne bei der Auswahl des richtigen Brennholzes für {cityName}.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeWhatsAppModal}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors"
                  style={{ fontFamily: 'Inter, Arial, sans-serif' }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleWhatsAppRedirect}
                  className="flex-1 bg-[#25D366] hover:bg-[#20BA5A] text-white font-medium py-3 px-4 rounded-xl transition-colors"
                  style={{ fontFamily: 'Inter, Arial, sans-serif' }}
                >
                  Chat starten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}