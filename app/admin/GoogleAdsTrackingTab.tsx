
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface ConversionEvent {
  event_type: string;
  created_at: string;
  event_data: string;
}

export default function GoogleAdsTrackingTab() {
  const [adsCampaigns, setAdsCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    google_ads_id: '',
    conversion_tracking: true,
    remarketing: true,
    enhanced_conversions: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [conversionEvents, setConversionEvents] = useState<ConversionEvent[]>([]);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadSettings();
    loadConversionEvents();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'google_ads_tracking');

      const settingsMap: Record<string, string> = {};
      data?.forEach(item => {
        settingsMap[item.setting_key] = item.setting_value;
      });

      setSettings({
        google_ads_id: settingsMap.google_ads_id || '',
        conversion_tracking: settingsMap.conversion_tracking === 'true',
        remarketing: settingsMap.remarketing === 'true',
        enhanced_conversions: settingsMap.enhanced_conversions === 'true'
      });
    } catch (error) {
      console.error('Error loading Google Ads settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversionEvents = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data } = await supabase
        .from('analytics_events')
        .select('event_type, created_at, event_data')
        .in('event_type', ['purchase', 'lead', 'signup', 'contact'])
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      setConversionEvents(data || []);
    } catch (error) {
      console.error('Error loading conversion events:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Lösche alte Einstellungen
      await supabase
        .from('app_settings')
        .delete()
        .eq('setting_type', 'google_ads_tracking');

      // Speichere neue Einstellungen
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        setting_type: 'google_ads_tracking',
        setting_key: key,
        setting_value: value.toString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('app_settings')
        .insert(settingsToSave);

      if (error) throw error;

      alert('Google Ads Tracking Einstellungen gespeichert!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Fehler beim Speichern der Einstellungen.');
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestConversion = async (eventType: string) => {
    try {
      const eventData = {
        test: true,
        value: eventType === 'purchase' ? 99.99 : 1,
        timestamp: new Date().toISOString()
      };
      
      const testEvent = {
        event_type: eventType,
        event_data: JSON.stringify(eventData),
        user_agent: navigator.userAgent,
        url: window.location.href,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('analytics_events')
        .insert(testEvent);

      if (error) throw error;

      // Trigger Google Ads Conversion (wenn aktiviert)
      if (settings.conversion_tracking && window.gtag) {
        const conversionLabel = settings.google_ads_id;
        if (conversionLabel) {
          window.gtag('event', 'conversion', {
            'send_to': `${settings.google_ads_id}/${eventType}`,
            'value': eventData.value,
            'currency': 'EUR',
            'transaction_id': `test_${Date.now()}`
          });
        }
      }

      alert(`Test-${eventType} Event wurde gesendet!`);
      loadConversionEvents();
    } catch (error) {
      console.error('Error sending test conversion:', error);
      alert('Fehler beim Senden des Test-Events.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full mx-auto mb-4 animate-pulse">
          <i className="ri-advertisement-line text-2xl text-blue-600"></i>
        </div>
        <p className="text-lg font-medium text-gray-700">Lade Google Ads Einstellungen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full mr-3">
              <i className="ri-advertisement-line text-blue-600"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">Google Ads Conversion Tracking</h2>
              <p className="text-gray-600">Messen Sie den Erfolg Ihrer Google Ads Kampagnen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Tracking Konfiguration</h3>

        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-800">Google Ads Tracking aktivieren</h4>
              <p className="text-sm text-gray-600">Aktiviert Conversion Tracking für Google Ads</p>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.conversion_tracking}
                onChange={(e) => setSettings(prev => ({ ...prev, conversion_tracking: e.target.checked }))}
                className="sr-only"
              />
              <div className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.conversion_tracking ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.conversion_tracking ? 'translate-x-6' : 'translate-x-0'
                }`}></div>
              </div>
            </label>
          </div>

          {/* Conversion ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Ads Conversion ID *
            </label>
            <input
              type="text"
              value={settings.google_ads_id}
              onChange={(e) => setSettings(prev => ({ ...prev, google_ads_id: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="AW-XXXXXXXXX"
            />
            <p className="text-sm text-gray-500 mt-1">
              Ihre Google Ads Conversion ID (beginnt mit AW-)
            </p>
          </div>

          {/* Save Button */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              {isSaving ? 'Speichern...' : 'Einstellungen speichern'}
            </button>
          </div>
        </div>
      </div>

      {/* Test Conversions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Conversion Tests</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => sendTestConversion('purchase')}
            className="p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-full mx-auto mb-2">
              <i className="ri-shopping-cart-line text-green-600"></i>
            </div>
            <h4 className="font-medium text-gray-800 mb-1">Test Kauf</h4>
            <p className="text-sm text-gray-600">Kauf-Conversion testen</p>
          </button>

          <button
            onClick={() => sendTestConversion('lead')}
            className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full mx-auto mb-2">
              <i className="ri-user-add-line text-blue-600"></i>
            </div>
            <h4 className="font-medium text-gray-800 mb-1">Test Lead</h4>
            <p className="text-sm text-gray-600">Lead-Conversion testen</p>
          </button>

          <button
            onClick={() => sendTestConversion('signup')}
            className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 flex items-center justify-center bg-purple-100 rounded-full mx-auto mb-2">
              <i className="ri-user-line text-purple-600"></i>
            </div>
            <h4 className="font-medium text-gray-800 mb-1">Test Registrierung</h4>
            <p className="text-sm text-gray-600">Signup-Conversion testen</p>
          </button>

          <button
            onClick={() => sendTestConversion('contact')}
            className="p-4 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 flex items-center justify-center bg-orange-100 rounded-full mx-auto mb-2">
              <i className="ri-phone-line text-orange-600"></i>
            </div>
            <h4 className="font-medium text-gray-800 mb-1">Test Kontakt</h4>
            <p className="text-sm text-gray-600">Kontakt-Conversion testen</p>
          </button>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <i className="ri-information-line text-yellow-600 mr-3 mt-0.5"></i>
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">Test-Hinweis</h4>
              <p className="text-sm text-yellow-700">
                Test-Conversions werden in Google Ads als solche markiert und beeinflussen nicht Ihre echten Kampagnen-Daten.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Conversions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Letzte Conversions (7 Tage)</h3>

        {conversionEvents.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
              <i className="ri-bar-chart-line text-2xl text-gray-400"></i>
            </div>
            <h4 className="text-lg font-medium text-gray-600 mb-2">Keine Conversions</h4>
            <p className="text-gray-500">In den letzten 7 Tagen wurden keine Conversion-Events erfasst.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Event</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Datum</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Wert</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Details</th>
                </tr>
              </thead>
              <tbody>
                {conversionEvents.map((event, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          event.event_type === 'purchase' ? 'bg-green-500' :
                          event.event_type === 'lead' ? 'bg-blue-500' :
                          event.event_type === 'signup' ? 'bg-purple-500' : 'bg-orange-500'
                        }`}></div>
                        <span className="font-medium capitalize">{event.event_type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(event.created_at)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {event.event_data ? (JSON.parse(event.event_data as string) as any).value || '-' : '-'} €
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {event.event_data && (JSON.parse(event.event_data as string) as any).test ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                          Test
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                          Live
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Setup Instructions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Setup Anleitung</h3>

        <div className="space-y-4">
          <div className="flex items-start">
            <div className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded-full mr-4 mt-1 flex-shrink-0">
              <span className="text-sm font-bold text-blue-600">1</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Google Ads Konto einrichten</h4>
              <p className="text-gray-600">
                Erstellen Sie Conversion-Aktionen in Ihrem Google Ads Konto für Käufe, Leads, etc.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded-full mr-4 mt-1 flex-shrink-0">
              <span className="text-sm font-bold text-blue-600">2</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Conversion ID und Labels kopieren</h4>
              <p className="text-gray-600">
                Kopieren Sie die Conversion ID und Labels aus Google Ads in die Felder oben.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded-full mr-4 mt-1 flex-shrink-0">
              <span className="text-sm font-bold text-blue-600">3</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Tracking aktivieren</h4>
              <p className="text-gray-600">
                Aktivieren Sie das Tracking und testen Sie die Conversions mit den Test-Buttons.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded-full mr-4 mt-1 flex-shrink-0">
              <span className="text-sm font-bold text-blue-600">4</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Erfolg messen</h4>
              <p className="text-gray-600">
                Überwachen Sie Ihre Conversions in Google Ads und optimieren Sie Ihre Kampagnen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
