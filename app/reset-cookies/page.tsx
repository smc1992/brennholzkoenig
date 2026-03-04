'use client';

import { useEffect, useState } from 'react';

export default function ResetCookiesPage() {
  const [isReset, setIsReset] = useState(false);

  const resetCookies = () => {
    try {
      localStorage.removeItem('cookie-consent');
      setIsReset(true);
      console.log('Cookie-Einwilligung wurde zurückgesetzt');
    } catch (error) {
      console.error('Fehler beim Zurücksetzen der Cookie-Einwilligung:', error);
    }
  };

  const checkCurrentConsent = () => {
    try {
      const consent = localStorage.getItem('cookie-consent');
      console.log('Aktuelle Cookie-Einwilligung:', consent ? JSON.parse(consent) : 'Keine Einwilligung gespeichert');
    } catch (error) {
      console.error('Fehler beim Abrufen der Cookie-Einwilligung:', error);
    }
  };

  useEffect(() => {
    checkCurrentConsent();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Cookie-Einwilligung zurücksetzen</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Cookie-Status prüfen</h2>
          <button
            onClick={checkCurrentConsent}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Aktuelle Einwilligung in Console anzeigen
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Cookie-Einwilligung zurücksetzen</h2>
          <p className="text-gray-600 mb-4">
            Klicken Sie auf den Button unten, um die gespeicherte Cookie-Einwilligung zu löschen. 
            Dadurch wird der Cookie-Banner beim nächsten Seitenaufruf wieder angezeigt.
          </p>
          <button
            onClick={resetCookies}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Cookie-Einwilligung zurücksetzen
          </button>
          {isReset && (
            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">
              ✅ Cookie-Einwilligung wurde erfolgreich zurückgesetzt!
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Nächste Schritte</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Cookie-Einwilligung zurücksetzen (Button oben)</li>
            <li>Zur <a href="/" className="text-blue-600 hover:underline">Startseite</a> navigieren</li>
            <li>Cookie-Banner sollte wieder erscheinen</li>
            <li>Einwilligung testen (Alle akzeptieren / Nur notwendige / Einstellungen anpassen)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}