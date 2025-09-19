'use client';

import { useEffect, useState } from 'react';
import GoogleAnalytics from '@/components/GoogleAnalytics';

export default function TestAnalyticsPage() {
  const [consentGiven, setConsentGiven] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const giveConsent = () => {
    const consent = {
      timestamp: new Date().toISOString(),
      preferences: {
        functional: true,
        analytics: true,
        marketing: false
      }
    };
    
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    setConsentGiven(true);
    addLog('Cookie-Einwilligung gesetzt');
    
    // Seite neu laden um GoogleAnalytics zu triggern
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const removeConsent = () => {
    localStorage.removeItem('cookie-consent');
    setConsentGiven(false);
    addLog('Cookie-Einwilligung entfernt');
  };

  const checkGtag = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      addLog('✅ window.gtag ist verfügbar - Google Analytics geladen!');
      
      // Teste ein Event
      (window as any).gtag('event', 'test_event', {
        event_category: 'test',
        event_label: 'manual_test',
        value: 1
      });
      addLog('Test-Event gesendet');
    } else {
      addLog('❌ window.gtag ist nicht verfügbar - Google Analytics nicht geladen');
    }
  };

  useEffect(() => {
    // Prüfe aktuellen Consent-Status
    const consent = localStorage.getItem('cookie-consent');
    if (consent) {
      try {
        const parsed = JSON.parse(consent);
        setConsentGiven(parsed.preferences?.analytics || false);
        addLog(`Consent-Status: ${parsed.preferences?.analytics ? 'Analytics erlaubt' : 'Analytics nicht erlaubt'}`);
      } catch (e) {
        addLog('Fehler beim Parsen der Cookie-Einwilligung');
      }
    } else {
      addLog('Keine Cookie-Einwilligung gefunden');
    }

    // Prüfe gtag nach kurzer Verzögerung
    setTimeout(checkGtag, 2000);
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Google Analytics Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Cookie-Einwilligung</h2>
          <p className="mb-4">Status: {consentGiven ? '✅ Erteilt' : '❌ Nicht erteilt'}</p>
          
          <div className="space-x-4">
            <button 
              onClick={giveConsent}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Einwilligung erteilen
            </button>
            <button 
              onClick={removeConsent}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Einwilligung entfernen
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Google Analytics Test</h2>
          <button 
            onClick={checkGtag}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
          >
            Prüfe gtag
          </button>
        </div>
      </div>

      <div className="mt-6 bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Logs</h2>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="text-sm font-mono">
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* GoogleAnalytics Komponente */}
      <GoogleAnalytics />
    </div>
  );
}