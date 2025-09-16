'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface OrderConfirmationProps {
  orderNumber: string;
  appliedDiscount?: {
    code: string;
    discountAmount: number;
  };
}

export default function OrderConfirmation({ orderNumber, appliedDiscount }: OrderConfirmationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F0E0] py-8 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          
          {/* Success Animation */}
          <div className={`text-center mb-8 md:mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              <i className="ri-check-line text-3xl md:text-4xl text-white"></i>
            </div>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-[#1A1A1A] mb-3 md:mb-4 px-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              BESTELLUNG ERFOLGREICH!
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 font-light px-4">
              Vielen Dank für Ihr Vertrauen!
            </p>
          </div>

          {/* Order Details Card */}
          <div className={`bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-8 mb-6 md:mb-8 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center mb-6 md:mb-8">
              <div className="inline-flex items-center bg-[#C04020]/10 text-[#C04020] px-4 md:px-6 py-2 md:py-3 rounded-full mb-4">
                <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center mr-2 md:mr-3">
                  <i className="ri-file-list-3-line text-sm md:text-base"></i>
                </div>
                <span className="font-bold text-sm md:text-lg">Bestellnummer: {orderNumber}</span>
              </div>
              
              {appliedDiscount && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 flex items-center justify-center bg-green-500 rounded-full mr-3">
                      <i className="ri-coupon-line text-white text-sm"></i>
                    </div>
                    <span className="text-green-800 font-bold">
                      Gutscheincode "{appliedDiscount.code}" erfolgreich eingelöst!
                    </span>
                  </div>
                  <p className="text-green-700 text-sm mt-2">
                    Sie haben €{appliedDiscount.discountAmount.toFixed(2)} gespart!
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              
              {/* Status */}
              <div className="text-center p-4 md:p-0">
                <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="ri-time-line text-xl md:text-2xl text-blue-600"></i>
                </div>
                <h3 className="font-bold text-[#1A1A1A] mb-2 text-sm md:text-base">Status</h3>
                <p className="text-gray-600 text-xs md:text-sm">Bestellung eingegangen</p>
                <div className="mt-2 inline-flex items-center bg-yellow-100 text-yellow-800 px-2 md:px-3 py-1 rounded-full text-xs font-medium">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                  In Bearbeitung
                </div>
              </div>

              {/* Contact */}
              <div className="text-center p-4 md:p-0">
                <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="ri-phone-line text-xl md:text-2xl text-green-600"></i>
                </div>
                <h3 className="font-bold text-[#1A1A1A] mb-2 text-sm md:text-base">Bestätigung</h3>
                <div className="mt-2 text-xs text-gray-500">
                  Telefonische Koordination
                </div>
              </div>

              {/* Delivery */}
              <div className="text-center p-4 md:p-0">
                <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-[#C04020]/10 rounded-full flex items-center justify-center">
                  <i className="ri-truck-line text-xl md:text-2xl text-[#C04020]"></i>
                </div>
                <h3 className="font-bold text-[#1A1A1A] mb-2 text-sm md:text-base">Lieferung</h3>
                <p className="text-gray-600 text-xs md:text-sm">Nach Terminabsprache</p>
                <div className="mt-2 text-xs text-gray-500">
                  Barzahlung bei Anlieferung
                </div>
              </div>

            </div>
          </div>

          {/* Next Steps */}
          <div className={`bg-gradient-to-r from-[#C04020] to-[#A03318] text-white rounded-xl md:rounded-2xl p-4 md:p-8 mb-6 md:mb-8 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center">
              <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-white/20 rounded-full mr-2 md:mr-3">
                <i className="ri-roadmap-line text-sm md:text-base"></i>
              </div>
              Wie geht es weiter?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex items-start p-3 md:p-0">
                <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-white text-[#C04020] rounded-full mr-3 md:mr-4 font-bold text-xs md:text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold mb-2 text-sm md:text-base">Telefonische Bestätigung</h3>
                  <p className="text-white/90 text-xs md:text-sm">
                    Wir rufen Sie an, um die Bestellung zu bestätigen und den Liefertermin zu koordinieren.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start p-3 md:p-0">
                <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-white text-[#C04020] rounded-full mr-3 md:mr-4 font-bold text-xs md:text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold mb-2 text-sm md:text-base">Lieferung & Bezahlung</h3>
                  <p className="text-white/90 text-xs md:text-sm">
                    Pünktliche Anlieferung zum vereinbarten Termin. Die Bezahlung erfolgt bar bei der Lieferung.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Info */}
          <div className={`bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center text-sm md:text-base">
              <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full mr-2 md:mr-3">
                <i className="ri-information-line text-xs md:text-sm"></i>
              </div>
              Wichtige Informationen
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-xs md:text-sm">
              <div>
                <h4 className="font-medium text-[#1A1A1A] mb-2">📞 Kontakt</h4>
                <p className="text-gray-600 mb-1">Telefon: +49 176 71085234</p>
                <p className="text-gray-600">E-Mail: info@brennholz-koenig.de</p>
              </div>
              
              <div>
                <h4 className="font-medium text-[#1A1A1A] mb-2">💶 Bezahlung</h4>
                <p className="text-gray-600 mb-1">Nur Barzahlung bei Lieferung</p>
                <p className="text-gray-600">Bestellbestätigung/Rechnung wird vor Ort ausgestellt</p>
              </div>
              
              <div>
                <h4 className="font-medium text-[#1A1A1A] mb-2">🚚 Lieferung</h4>
                <p className="text-gray-600 mb-1">Anlieferung frei Bordsteinkante</p>
                <p className="text-gray-600">Bei LKW-Zufahrt: Lieferung bis vor Haustür/Garage/Scheune möglich</p>
              </div>
              
              <div>
                <h4 className="font-medium text-[#1A1A1A] mb-2">📋 Bestellung</h4>
                <p className="text-gray-600 mb-1">Änderungen bis 24h vor Lieferung</p>
                <p className="text-gray-600">Stornierung kostenfrei möglich</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex flex-col gap-3 md:gap-4 justify-center transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Link
              href="/"
              className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 md:px-8 py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-center transition-all hover:shadow-lg transform hover:scale-[1.02] cursor-pointer text-sm md:text-base"
            >
              <i className="ri-home-line mr-2 md:mr-3"></i>
              Zurück zur Startseite
            </Link>
            
            <Link
              href="/shop"
              className="bg-white hover:bg-gray-50 text-[#C04020] border-2 border-[#C04020] px-6 md:px-8 py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-center transition-all hover:shadow-lg transform hover:scale-[1.02] cursor-pointer text-sm md:text-base"
            >
              <i className="ri-shopping-bag-line mr-2 md:mr-3"></i>
              Weitereinkaufen
            </Link>
            
            <a
              href="tel:+4917671085234"
              className="bg-green-500 hover:bg-green-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-center transition-all hover:shadow-lg transform hover:scale-[1.02] cursor-pointer text-sm md:text-base"
            >
              <i className="ri-phone-line mr-2 md:mr-3"></i>
              Jetzt anrufen
            </a>
          </div>

          {/* Footer Note */}
          <div className={`text-center mt-8 md:mt-12 px-4 transition-all duration-1000 delay-1100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-gray-500 text-xs md:text-sm">
              Bei Fragen stehen wir Ihnen gerne telefonisch zur Verfügung: 
              <strong className="text-[#C04020] ml-1">+49 176 71085234</strong>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}