'use client';

import { useState, useEffect } from 'react';

interface TrackingConfig {
  google_analytics_id: string;
  google_tag_manager_id: string;
  facebook_pixel_id: string;
  google_analytics_enabled: boolean;
  google_tag_manager_enabled: boolean;
  facebook_pixel_enabled: boolean;
}

export default function GoogleAnalyticsTab() {
  const [config, setConfig] = useState<TrackingConfig>({
    google_analytics_id: '',
    google_tag_manager_id: '',
    facebook_pixel_id: '',
    google_analytics_enabled: false,
    google_tag_manager_enabled: false,
    facebook_pixel_enabled: false
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadTrackingConfig();
  }, []);

  const loadTrackingConfig = async () => {
    try {
      const response = await fetch('/api/tracking-config');
      const data = await response.json();
      
      setConfig({
        google_analytics_id: data.google_analytics_id || '',
        google_tag_manager_id: data.google_tag_manager_id || '',
        facebook_pixel_id: data.facebook_pixel_id || '',
        google_analytics_enabled: data.google_analytics_enabled || false,
        google_tag_manager_enabled: data.google_tag_manager_enabled || false,
        facebook_pixel_enabled: data.facebook_pixel_enabled || false
      });
    } catch (error) {
      console.error('Fehler beim Laden der Tracking-Konfiguration:', error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/tracking-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('✅ Tracking-Konfiguration erfolgreich gespeichert!');
      } else {
        setMessage('❌ Fehler beim Speichern: ' + result.error);
      }
    } catch (error) {
      setMessage('❌ Server-Fehler beim Speichern');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const testTracking = () => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'test_event', {
        event_category: 'admin_test',
        event_label: 'Tracking Test'
      });
      setMessage('🧪 Test-Event gesendet! Prüfe deine Analytics.');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('⚠️ Google Analytics nicht geladen. Prüfe die Konfiguration.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <i className="ri-bar-chart-line text-2xl text-blue-600"></i>
          <div>
            <h3 className="font-semibold text-blue-900">Tracking & Analytics</h3>
            <p className="text-sm text-blue-700">
              Google Analytics, Tag Manager und Facebook Pixel konfigurieren
            </p>
          </div>
        </div>
      </div>

      {/* Status Nachricht */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' :
          message.includes('🧪') ? 'bg-blue-50 text-blue-700 border border-blue-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Google Analytics GA4 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <i className="ri-google-line text-2xl text-red-600"></i>
            <div>
              <h4 className="font-semibold text-gray-900">Google Analytics GA4</h4>
              <p className="text-sm text-gray-600">Website-Analyse und Nutzerverhalten</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.google_analytics_enabled}
              onChange={(e) => setConfig({...config, google_analytics_enabled: e.target.checked})}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Analytics GA4 Tracking-ID
            </label>
            <input
              type="text"
              value={config.google_analytics_id}
              onChange={(e) => setConfig({...config, google_analytics_id: e.target.value})}
              placeholder="G-XXXXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: G-XXXXXXXXXX (beginnt mit G-)
            </p>
          </div>
        </div>
      </div>

      {/* Google Tag Manager */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <i className="ri-code-box-line text-2xl text-blue-600"></i>
            <div>
              <h4 className="font-semibold text-gray-900">Google Tag Manager</h4>
              <p className="text-sm text-gray-600">Zentrale Tag-Verwaltung</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.google_tag_manager_enabled}
              onChange={(e) => setConfig({...config, google_tag_manager_enabled: e.target.checked})}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Tag Manager Container-ID
            </label>
            <input
              type="text"
              value={config.google_tag_manager_id}
              onChange={(e) => setConfig({...config, google_tag_manager_id: e.target.value})}
              placeholder="GTM-XXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: GTM-XXXXXXX (beginnt mit GTM-)
            </p>
          </div>
        </div>
      </div>

      {/* Facebook Pixel */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <i className="ri-facebook-line text-2xl text-blue-600"></i>
            <div>
              <h4 className="font-semibold text-gray-900">Facebook Pixel</h4>
              <p className="text-sm text-gray-600">Conversion-Tracking für Facebook Ads</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.facebook_pixel_enabled}
              onChange={(e) => setConfig({...config, facebook_pixel_enabled: e.target.checked})}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facebook Pixel ID
            </label>
            <input
              type="text"
              value={config.facebook_pixel_id}
              onChange={(e) => setConfig({...config, facebook_pixel_id: e.target.value})}
              placeholder="123456789012345"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Numerische ID aus dem Facebook Business Manager
            </p>
          </div>
        </div>
      </div>

      {/* Tracking Status */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 mb-3">📊 Tracking Status:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.google_analytics_enabled && config.google_analytics_id ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span>Google Analytics GA4</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.google_tag_manager_enabled && config.google_tag_manager_id ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span>Google Tag Manager</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.facebook_pixel_enabled && config.facebook_pixel_id ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span>Facebook Pixel</span>
          </div>
        </div>
      </div>

      {/* DSGVO Hinweis */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <i className="ri-shield-check-line text-xl text-blue-600 mt-0.5"></i>
          <div className="text-sm text-blue-800">
            <strong>DSGVO-Konformität:</strong> Alle Tracking-Dienste werden nur nach ausdrücklicher 
            Einwilligung der Nutzer über den Cookie-Banner geladen. IP-Adressen werden anonymisiert.
          </div>
        </div>
      </div>

      {/* Aktionen */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap"
        >
          {saving ? 'Speichern...' : 'Konfiguration speichern'}
        </button>
        
        <button
          onClick={testTracking}
          className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap"
        >
          Tracking testen
        </button>

        <button
          onClick={() => window.open('https://analytics.google.com', '_blank')}
          className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap"
        >
          Analytics öffnen
        </button>
      </div>

      {/* Anleitung */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">🚀 Einrichtung:</h4>
        <div className="text-sm text-gray-700 space-y-2">
          <div><strong>1. Google Analytics:</strong> GA4-Property erstellen → Tracking-ID kopieren</div>
          <div><strong>2. Tag Manager:</strong> Container erstellen → Container-ID kopieren</div>
          <div><strong>3. Facebook:</strong> Business Manager → Events Manager → Pixel-ID kopieren</div>
          <div><strong>4.</strong> IDs hier eintragen und aktivieren</div>
          <div><strong>5.</strong> Test-Event senden zur Überprüfung</div>
        </div>
      </div>
    </div>
  );
}