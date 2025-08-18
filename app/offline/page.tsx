
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') return;

    // Online-Status überwachen
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const retryConnection = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  useEffect(() => {
    // Automatisch zur Startseite weiterleiten wenn wieder online
    if (isOnline && typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, [isOnline]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Offline Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <i className="ri-wifi-off-line text-3xl text-gray-600"></i>
        </div>

        {/* Titel */}
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-4">
          Keine Internetverbindung
        </h1>

        {/* Beschreibung */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          Sie sind derzeit offline. Überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.
        </p>

        {/* Verfügbare Offline-Funktionen */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-blue-800 mb-3">Offline verfügbar:</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Link 
              href="/"
              className="bg-white rounded-lg p-3 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <i className="ri-home-line block text-lg mb-1"></i>
              Startseite
            </Link>
            <Link 
              href="/shop"
              className="bg-white rounded-lg p-3 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <i className="ri-store-line block text-lg mb-1"></i>
              Shop
            </Link>
            <Link 
              href="/ueber-uns"
              className="bg-white rounded-lg p-3 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <i className="ri-information-line block text-lg mb-1"></i>
              Über uns
            </Link>
            <Link 
              href="/kontakt"
              className="bg-white rounded-lg p-3 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <i className="ri-phone-line block text-lg mb-1"></i>
              Kontakt
            </Link>
          </div>
        </div>

        {/* Retry Button */}
        <button
          onClick={retryConnection}
          className="w-full bg-[#C04020] hover:bg-[#A03318] text-white py-3 px-6 rounded-lg font-bold transition-colors cursor-pointer mb-4"
        >
          <i className="ri-refresh-line mr-2"></i>
          Erneut versuchen
        </button>

        {/* Alternative Aktionen */}
        <div className="space-y-2 text-sm text-gray-600">
          <p>Oder versuchen Sie:</p>
          <ul className="space-y-1 text-left">
            <li>• WLAN-Verbindung überprüfen</li>
            <li>• Mobile Daten aktivieren</li>
            <li>• Router neu starten</li>
            <li>• Später erneut versuchen</li>
          </ul>
        </div>

        {/* Logo */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="font-['Pacifico'] text-[#C04020] text-lg">
            Brennholzkönig
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Premium Brennholz direkt vom Produzenten
          </p>
        </div>
      </div>
    </div>
  );
}
