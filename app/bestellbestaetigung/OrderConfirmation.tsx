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
    <div className="min-h-screen bg-[#F5F0E0] py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Success Animation */}
          <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="w-24 h-24 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              <i className="ri-check-line text-4xl text-white"></i>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#1A1A1A] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              BESTELLUNG ERFOLGREICH!
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 font-light">
              Vielen Dank für Ihr Vertrauen!
            </p>
          </div>

          {/* Order Details Card */}
          <div className={`bg-white rounded-2xl shadow-lg p-8 mb-8 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center bg-[#C04020]/10 text-[#C04020] px-6 py-3 rounded-full mb-4">
                <div className="w-6 h-6 flex items-center justify-center mr-3">
                  <i className="ri-file-list-3-line"></i>
                </div>
                <span className="font-bold text-lg">Bestellnummer: {orderNumber}</span>
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

            <div className="grid md:grid-cols-3 gap-8">
              
              {/* Status */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="ri-time-line text-2xl text-blue-600"></i>
                </div>
                <h3 className="font-bold text-[#1A1A1A] mb-2">Status</h3>
                <p className="text-gray-600 text-sm">Bestellung eingegangen</p>
                <div className="mt-2 inline-flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                  In Bearbeitung
                </div>
              </div>

              {/* Contact */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="ri-phone-line text-2xl text-green-600"></i>
                </div>
                <h3 className="font-bold text-[#1A1A1A] mb-2">Bestätigung</h3>
                <p className="text-gray-600 text-sm">Innerhalb von 2 Stunden</p>
                <div className="mt-2 text-xs text-gray-500">
                  Telefonische Koordination
                </div>
              </div>

              {/* Delivery */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#C04020]/10 rounded-full flex items-center justify-center">
                  <i className="ri-truck-line text-2xl text-[#C04020]"></i>
                </div>
                <h3 className="font-bold text-[#1A1A1A] mb-2">Lieferung</h3>
                <p className="text-gray-600 text-sm">Nach Terminabsprache</p>
                <div className="mt-2 text-xs text-gray-500">
                  Barzahlung bei Anlieferung
                </div>
              </div>

            </div>
          </div>

          {/* Next Steps */}
          <div className={`bg-gradient-to-r from-[#C04020] to-[#A03318] text-white rounded-2xl p-8 mb-8 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <div className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full mr-3">
                <i className="ri-roadmap-line"></i>
              </div>
              Wie geht es weiter?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <div className="w-8 h-8 flex items-center justify-center bg-white text-[#C04020] rounded-full mr-4 font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold mb-2">Telefonische Bestätigung</h3>
                  <p className="text-white/90 text-sm">
                    Wir rufen Sie innerhalb der nächsten 2 Stunden an, um die Bestellung zu bestätigen und den Liefertermin zu koordinieren.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 flex items-center justify-center bg-white text-[#C04020] rounded-full mr-4 font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold mb-2">Lieferung & Bezahlung</h3>
                  <p className="text-white/90 text-sm">
                    Pünktliche Anlieferung zum vereinbarten Termin. Die Bezahlung erfolgt bar bei der Lieferung.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Info */}
          <div className={`bg-white rounded-2xl shadow-lg p-6 mb-8 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center">
              <div className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full mr-3">
                <i className="ri-information-line"></i>
              </div>
              Wichtige Informationen
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-[#1A1A1A] mb-2">📞 Kontakt</h4>
                <p className="text-gray-600 mb-1">Telefon: 0661 480 276 00</p>
                <p className="text-gray-600">E-Mail: info@brennholzkoenig.de</p>
              </div>
              
              <div>
                <h4 className="font-medium text-[#1A1A1A] mb-2">💶 Bezahlung</h4>
                <p className="text-gray-600 mb-1">Nur Barzahlung bei Lieferung</p>
                <p className="text-gray-600">Quittung wird vor Ort ausgestellt</p>
              </div>
              
              <div>
                <h4 className="font-medium text-[#1A1A1A] mb-2">🚚 Lieferung</h4>
                <p className="text-gray-600 mb-1">Anlieferung bis vor die Haustür</p>
                <p className="text-gray-600">Zufahrt für LKW erforderlich</p>
              </div>
              
              <div>
                <h4 className="font-medium text-[#1A1A1A] mb-2">📋 Bestellung</h4>
                <p className="text-gray-600 mb-1">Änderungen bis 24h vor Lieferung</p>
                <p className="text-gray-600">Stornierung kostenfrei möglich</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Link
              href="/"
              className="bg-[#C04020] hover:bg-[#A03318] text-white px-8 py-4 rounded-xl font-bold text-center transition-all hover:shadow-lg transform hover:scale-[1.02] cursor-pointer whitespace-nowrap"
            >
              <i className="ri-home-line mr-3"></i>
              Zurück zur Startseite
            </Link>
            
            <Link
              href="/shop"
              className="bg-white hover:bg-gray-50 text-[#C04020] border-2 border-[#C04020] px-8 py-4 rounded-xl font-bold text-center transition-all hover:shadow-lg transform hover:scale-[1.02] cursor-pointer whitespace-nowrap"
            >
              <i className="ri-shopping-bag-line mr-3"></i>
              Weitereinkaufen
            </Link>
            
            <a
              href="tel:0661480276000"
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-center transition-all hover:shadow-lg transform hover:scale-[1.02] cursor-pointer whitespace-nowrap"
            >
              <i className="ri-phone-line mr-3"></i>
              Jetzt anrufen
            </a>
          </div>

          {/* Footer Note */}
          <div className={`text-center mt-12 transition-all duration-1000 delay-1100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-gray-500 text-sm">
              Bei Fragen stehen wir Ihnen gerne telefonisch zur Verfügung: 
              <strong className="text-[#C04020] ml-1">0661 480 276 00</strong>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}