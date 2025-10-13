
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <section 
        className="relative overflow-hidden"
        style={{
          minHeight: '80vh',
          paddingTop: '64px',
          pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('/images/Hero Brennholzkönig.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 w-full relative max-w-7xl z-10" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
          {/* Overlay-Inhalt: Highlights und CTA auf dem Bild */}
          <div className={`max-w-3xl w-full bg-gradient-to-br from-black/70 via-black/60 to-black/50 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl ring-1 ring-white/10 border border-white/5 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <h1 className="text-white font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-6 drop-shadow-md">
              Brennholzkönig – Trockenes Brennholz für maximale Wärme
            </h1>
            <ul className="space-y-3 sm:space-y-4 text-white">
              <li className="flex items-start">
                <span className="w-7 h-7 mr-3 rounded-full bg-[#D4A520]/20 text-[#D4A520] flex items-center justify-center">
                  <i className="ri-check-line text-lg"></i>
                </span>
                <span className="font-semibold text-lg sm:text-xl leading-tight">Trockenes Brennholz mit 70 % höherer Heizleistung</span>
              </li>
              <li className="flex items-start">
                <span className="w-7 h-7 mr-3 rounded-full bg-[#D4A520]/20 text-[#D4A520] flex items-center justify-center">
                  <i className="ri-check-line text-lg"></i>
                </span>
                <span className="font-semibold text-lg sm:text-xl leading-tight">Schnelle Lieferung im Umkreis von 150 km</span>
              </li>
              <li className="flex items-start">
                <span className="w-7 h-7 mr-3 rounded-full bg-[#D4A520]/20 text-[#D4A520] flex items-center justify-center">
                  <i className="ri-check-line text-lg"></i>
                </span>
                <span className="font-semibold text-lg sm:text-xl leading-tight">Zahlung bei Lieferung</span>
              </li>
            </ul>
            <div className="mt-6">
              <Link href="/shop" aria-label="Zum Shop" className="group inline-flex items-center gap-2 bg-[#D4A520] text-black px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-extrabold rounded-2xl hover:bg-[#c99a1b] transition-all duration-200 shadow-xl hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A520] focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                <i className="ri-shopping-cart-line text-lg"></i>
                ZUM SHOP
                <i className="ri-arrow-right-line text-lg opacity-80 transition-transform duration-200 group-hover:translate-x-0.5"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
