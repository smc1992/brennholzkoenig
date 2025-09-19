'use client';

import { useEffect, useState } from 'react';

export default function TestCookieBannerPage() {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [consentData, setConsentData] = useState<any>(null);

  const checkBannerVisibility = () => {
    // Prüfe ob Cookie-Banner sichtbar ist
    const banner = document.querySelector('[class*="fixed"][class*="inset-0"]');
    setBannerVisible(!!banner);
    return !!banner;
  };

  const checkConsentData = () => {
    try {
      const consent = localStorage.getItem('cookie-consent');
      const data = consent ? JSON.parse(consent) : null;
      setConsentData(data);
      console.log('Cookie-Einwilligung:', data);
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Cookie-Einwilligung:', error);
      return null;
    }
  };

  const resetConsent = () => {
    try {
      localStorage.removeItem('cookie-consent');
      setConsentData(null);
      console.log('Cookie-Einwilligung zurückgesetzt');
      // Seite neu laden um Banner anzuzeigen
      window.location.reload();
    } catch (error) {
      console.error('Fehler beim Zurücksetzen:', error);
    }
  };

  const simulateAcceptAll = () => {
    const allAccepted = {
      timestamp: new Date().toISOString(),
      preferences: {
        functional: true,
        analytics: true,
        marketing: true,
      }
    };
    localStorage.setItem('cookie-consent', JSON.stringify(allAccepted));
    setConsentData(allAccepted);
    console.log('Alle Cookies akzeptiert:', allAccepted);
    window.location.reload();
  };

  const simulateRejectAll = () => {
    const onlyFunctional = {
      timestamp: new Date().toISOString(),
      preferences: {
        functional: true,
        analytics: false,
        marketing: false,
      }
    };
    localStorage.setItem('cookie-consent', JSON.stringify(onlyFunctional));
    setConsentData(onlyFunctional);
    console.log('Nur notwendige Cookies akzeptiert:', onlyFunctional);
    window.location.reload();
  };

  useEffect(() => {
    checkConsentData();
    checkBannerVisibility();
    
    // Prüfe Banner-Sichtbarkeit alle 500ms
    const interval = setInterval(() => {
      checkBannerVisibility();
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Cookie-Banner Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Banner Status</h2>
            <div className={`p-3 rounded ${bannerVisible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {bannerVisible ? '✅ Cookie-Banner ist sichtbar' : '❌ Cookie-Banner ist nicht sichtbar'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Einwilligung Status</h2>
            <div className={`p-3 rounded ${consentData ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {consentData ? '✅ Einwilligung gespeichert' : '⚠️ Keine Einwilligung'}
            </div>
            {consentData && (
              <div className="mt-3 text-sm">
                <p><strong>Analytics:</strong> {consentData.preferences?.analytics ? 'Ja' : 'Nein'}</p>
                <p><strong>Marketing:</strong> {consentData.preferences?.marketing ? 'Ja' : 'Nein'}</p>
                <p><strong>Zeitstempel:</strong> {new Date(consentData.timestamp).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test-Aktionen</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={resetConsent}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Einwilligung zurücksetzen
            </button>
            <button
              onClick={simulateAcceptAll}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Alle akzeptieren
            </button>
            <button
              onClick={simulateRejectAll}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Nur notwendige
            </button>
            <button
              onClick={() => {
                checkConsentData();
                checkBannerVisibility();
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Status aktualisieren
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test-Anweisungen</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Klicken Sie auf "Einwilligung zurücksetzen" um den Cookie-Banner zu aktivieren</li>
            <li>Die Seite wird automatisch neu geladen</li>
            <li>Der Cookie-Banner sollte erscheinen</li>
            <li>Testen Sie die verschiedenen Optionen im Banner</li>
            <li>Prüfen Sie die Auswirkungen auf Google Analytics</li>
          </ol>
          
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-blue-700">
              <strong>Hinweis:</strong> Öffnen Sie die Browser-Konsole (F12) um detaillierte Logs zu sehen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}