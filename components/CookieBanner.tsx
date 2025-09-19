
'use client';

import { useState, useEffect } from 'react';

interface CookiePreferences {
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    functional: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookie-consent');
      console.log('CookieBanner: Checking consent...', consent ? 'Found' : 'Not found');
      
      if (!consent) {
        console.log('CookieBanner: No consent found, showing banner');
        setIsVisible(true);
      } else {
        const consentData = JSON.parse(consent);
        const consentDate = new Date(consentData.timestamp);
        const now = new Date();
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - 12); // 12 Monate Gültigkeit
        
        if (consentDate < monthsAgo) {
          console.log('CookieBanner: Consent expired (older than 12 months), showing banner');
          localStorage.removeItem('cookie-consent'); // Abgelaufene Einwilligung löschen
          setIsVisible(true);
        } else {
          const remainingDays = Math.ceil((consentDate.getTime() + (12 * 30 * 24 * 60 * 60 * 1000) - now.getTime()) / (24 * 60 * 60 * 1000));
          console.log('CookieBanner: Valid consent found, hiding banner. Expires in', remainingDays, 'days');
          setIsVisible(false);
        }
      }
    } catch (error) {
      console.error('CookieBanner: Error checking cookie consent:', error);
      setIsVisible(true);
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    try {
      const consentData = {
        timestamp: new Date().toISOString(),
        preferences: prefs
      };
      localStorage.setItem('cookie-consent', JSON.stringify(consentData));
      console.log('CookieBanner: Preferences saved:', consentData);
      setIsVisible(false);
    } catch (error) {
      console.error('CookieBanner: Error saving cookie preferences:', error);
    }
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      functional: true,
      analytics: true,
      marketing: true,
    };
    savePreferences(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyFunctional = {
      functional: true,
      analytics: false,
      marketing: false,
    };
    savePreferences(onlyFunctional);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  const handleClose = () => {
    // Beim Schließen ohne Auswahl nur temporär ausblenden
    // Banner erscheint bei nächstem Seitenaufruf wieder
    setIsVisible(false);
  };

  const handlePreferenceChange = (category: keyof CookiePreferences) => {
    if (category === 'functional') return; // Funktionale Cookies immer erforderlich
    
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Cookie-Einstellungen</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-2"
              aria-label="Schließen"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {!showSettings ? (
            <div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Wir verwenden Cookies und ähnliche Technologien, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten. 
                Einige sind notwendig für die Funktionalität, andere helfen uns, die Website zu verbessern und Ihnen relevante Inhalte anzuzeigen.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAcceptAll}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Alle akzeptieren
                </button>
                <button
                  onClick={handleRejectAll}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Nur notwendige
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Einstellungen anpassen
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Notwendige Cookies</h3>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-3">Immer aktiv</span>
                      <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-all"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    Diese Cookies sind für die grundlegende Funktionalität der Website erforderlich und können nicht deaktiviert werden.
                  </p>
                  <div className="text-sm text-gray-500">
                    <strong>Tools:</strong> Session-Management, Sicherheits-Cookies, Warenkorb-Funktionalität, Login-Status
                  </div>
                </div>

                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Analytics & Performance</h3>
                    <button
                      onClick={() => handlePreferenceChange('analytics')}
                      className="focus:outline-none"
                    >
                      <div className={`w-12 h-6 rounded-full relative transition-colors ${
                        preferences.analytics ? 'bg-blue-600' : 'bg-gray-300'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
                          preferences.analytics ? 'right-0.5' : 'left-0.5'
                        }`}></div>
                      </div>
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren, und ermöglichen es uns, die Performance zu verbessern.
                  </p>
                  <div className="text-sm text-gray-500">
                    <strong>Tools:</strong> Google Analytics, Google Tag Manager, Heatmap-Tools, A/B-Testing-Tools, Performance-Monitoring
                  </div>
                </div>

                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Marketing & Werbung</h3>
                    <button
                      onClick={() => handlePreferenceChange('marketing')}
                      className="focus:outline-none"
                    >
                      <div className={`w-12 h-6 rounded-full relative transition-colors ${
                        preferences.marketing ? 'bg-blue-600' : 'bg-gray-300'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
                          preferences.marketing ? 'right-0.5' : 'left-0.5'
                        }`}></div>
                      </div>
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    Diese Cookies werden verwendet, um Ihnen relevante Werbeanzeigen zu zeigen und die Effektivität von Werbekampagnen zu messen.
                  </p>
                  <div className="text-sm text-gray-500">
                    <strong>Tools:</strong> Facebook Pixel, Google Ads, Remarketing-Tags, Social Media Plugins, Conversion-Tracking, E-Mail-Marketing-Tools
                  </div>
                </div>

                <div className="pb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Externe Inhalte & Dienste</h3>
                    <span className="text-sm text-gray-500">Immer aktiv</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    Externe Dienste, die für die Darstellung und Funktionalität der Website benötigt werden.
                  </p>
                  <div className="text-sm text-gray-500">
                    <strong>Tools:</strong> Google Fonts, Google Maps, YouTube-Videos, CDN-Services, Icon-Bibliotheken (Remix Icons), Zahlungsanbieter-Widgets
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSavePreferences}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Einstellungen speichern
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Alle akzeptieren
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Zurück
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
