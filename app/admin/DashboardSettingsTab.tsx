
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface DashboardSettings {
  dashboardName: string;
  refreshInterval: number;
  defaultView: string;
  showNotifications: boolean;
  autoRefresh: boolean;
  theme: string;
  // Additional properties used in the component
  email_address?: string;
  email_enabled?: boolean;
  stats_cards?: boolean;
  recent_orders?: boolean;
  quick_actions?: boolean;
  low_stock_alerts?: boolean;
  revenue_chart?: boolean;
  customer_activity?: boolean;
  new_order_notifications?: boolean;
  low_stock_notifications?: boolean;
  price_updates_enabled?: boolean;
  scheduled_reports?: boolean;
  auto_reorder_enabled?: boolean;
  low_stock_threshold?: number;
  [key: string]: any; // Allow dynamic access to properties
}

export default function DashboardSettingsTab() {
  const [settings, setSettings] = useState<DashboardSettings>({
    dashboardName: '',
    refreshInterval: 30,
    defaultView: 'overview',
    showNotifications: true,
    autoRefresh: true,
    theme: 'light'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'dashboard_config')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        return;
      }

      if (data && data.setting_value) {
        try {
          const value = data.setting_value;
          
          // Null/undefined Check
          if (!value) {
            setSettings({
              dashboardName: '',
              refreshInterval: 30,
              defaultView: 'overview',
              showNotifications: true,
              autoRefresh: true,
              theme: 'light'
            });
            return;
          }
          
          // String Check
          if (typeof value !== 'string') {
            console.warn('Setting value is not a string:', typeof value);
            return;
          }
          
          // Trim und Empty Check
          const trimmedValue = value.trim();
          if (trimmedValue === '') {
            console.warn('Setting value is empty after trim');
            return;
          }
          
          // JSON Format Check
          if (!trimmedValue.startsWith('{') && !trimmedValue.startsWith('[')) {
            console.warn('Setting value does not start with { or [:', trimmedValue.substring(0, 10));
            return;
          }
          
          const parsedSettings = JSON.parse(trimmedValue);
          setSettings(parsedSettings);
        } catch (error) {
          console.warn('Invalid JSON in dashboard settings:', data.setting_value);
          setSettings({
            dashboardName: '',
            refreshInterval: 30,
            defaultView: 'overview',
            showNotifications: true,
            autoRefresh: true,
            theme: 'light'
          });
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const { data: existingData } = await supabase
        .from('app_settings')
        .select('id')
        .eq('setting_key', 'dashboard_config')
        .maybeSingle();

      const settingsData = {
        setting_key: 'dashboard_config',
        setting_value: JSON.stringify(settings),
        setting_type: 'dashboard_config',
        description: 'Dashboard Widget und Benachrichtigungseinstellungen',
        updated_at: new Date().toISOString()
      };

      let result;
      if (existingData) {
        result = await supabase
          .from('app_settings')
          .update(settingsData)
          .eq('id', existingData.id);
      } else {
        result = await supabase
          .from('app_settings')
          .insert([settingsData]);
      }

      if (result.error) {
        throw result.error;
      }

      setMessage('Einstellungen erfolgreich gespeichert!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: unknown) {
      console.error('Error saving settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setMessage(`Fehler beim Speichern: ${errorMessage}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleWidgetToggle = (widget: string) => {
    setSettings(prev => ({...prev, [widget]: !prev[widget]}));
  };

  const handleNotificationToggle = (notification: string) => {
    setSettings(prev => ({...prev, [notification]: !prev[notification]}));
  };

  const handleAutomationToggle = (automation: string) => {
    setSettings(prev => ({...prev, [automation]: !prev[automation]}));
  };

  const testEmailNotification = async () => {
    if (!settings.email_address) {
      setMessage('Bitte E-Mail-Adresse eingeben');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/supabase/functions/v1/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: settings.email_address,
          subject: 'Test-E-Mail vom Brennholzkönig Admin-Dashboard',
          html: `
            <h2>Test-E-Mail erfolgreich!</h2>
            <p>Diese E-Mail bestätigt, dass Ihr E-Mail-System korrekt konfiguriert ist.</p>
            <p>Gesendet am: ${new Date().toLocaleString('de-DE')}</p>
            <hr>
            <p><small>Brennholzkönig Admin-System</small></p>
          `
        })
      });

      if (response.ok) {
        setMessage('Test-E-Mail erfolgreich versendet!');
      } else {
        throw new Error('E-Mail-Versand fehlgeschlagen');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setMessage('Fehler beim Versenden der Test-E-Mail');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-[#1A1A1A]">Dashboard-Einstellungen</h2>
          <p className="text-gray-600 mt-1">Passen Sie Ihr Dashboard nach Ihren Bedürfnissen an</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Dashboard Widgets */}
          <div>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Dashboard Widgets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-[#1A1A1A]">Statistik-Karten</h4>
                  <p className="text-sm text-gray-500">Umsatz, Bestellungen, Kunden</p>
                </div>
                <button
                  onClick={() => handleWidgetToggle('stats_cards')}
                  className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                    settings.stats_cards ? 'bg-[#C04020]' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.stats_cards ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-[#1A1A1A]">Neueste Bestellungen</h4>
                  <p className="text-sm text-gray-500">Aktuelle Bestellübersicht</p>
                </div>
                <button
                  onClick={() => handleWidgetToggle('recent_orders')}
                  className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                    settings.recent_orders ? 'bg-[#C04020]' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.recent_orders ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-[#1A1A1A]">Quick Actions</h4>
                  <p className="text-sm text-gray-500">Schnellzugriff-Buttons</p>
                </div>
                <button
                  onClick={() => handleWidgetToggle('quick_actions')}
                  className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                    settings.quick_actions ? 'bg-[#C04020]' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.quick_actions ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-[#1A1A1A]">Lagerbestand-Warnungen</h4>
                  <p className="text-sm text-gray-500">Niedrige Bestände anzeigen</p>
                </div>
                <button
                  onClick={() => handleWidgetToggle('low_stock_alerts')}
                  className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                    settings.low_stock_alerts ? 'bg-[#C04020]' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.low_stock_alerts ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-[#1A1A1A]">Umsatz-Diagramm</h4>
                  <p className="text-sm text-gray-500">Monatsübersicht Umsatz</p>
                </div>
                <button
                  onClick={() => handleWidgetToggle('revenue_chart')}
                  className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                    settings.revenue_chart ? 'bg-[#C04020]' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.revenue_chart ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-[#1A1A1A]">Kundenaktivität</h4>
                  <p className="text-sm text-gray-500">Neueste Kundenaktionen</p>
                </div>
                <button
                  onClick={() => handleWidgetToggle('customer_activity')}
                  className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                    settings.customer_activity ? 'bg-[#C04020]' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.customer_activity ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* E-Mail Benachrichtigungen */}
          <div>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">E-Mail Benachrichtigungen</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-[#1A1A1A]">E-Mail Benachrichtigungen aktivieren</h4>
                  <p className="text-sm text-gray-500">Automatische E-Mails für wichtige Ereignisse</p>
                </div>
                <button
                  onClick={() => handleNotificationToggle('email_enabled')}
                  className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                    settings.email_enabled ? 'bg-[#C04020]' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.email_enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {settings.email_enabled && (
                <>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      E-Mail-Adresse für Benachrichtigungen
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="email"
                        value={settings.email_address}
                        onChange={(e) => setSettings(prev => ({...prev, email_address: e.target.value}))}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                        placeholder="admin@brennholzkoenig.de"
                      />
                      <button
                        onClick={testEmailNotification}
                        disabled={saving}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                      >
                        {saving ? 'Sendet...' : 'Test senden'}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      Lagerbestand-Warnschwelle
                    </label>
                    <input
                      type="number"
                      value={settings.low_stock_threshold}
                      onChange={(e) => setSettings(prev => ({...prev, low_stock_threshold: parseInt(e.target.value) || 10}))}
                      className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                      min="1"
                    />
                    <p className="text-sm text-gray-500 mt-1">E-Mail bei Bestand unter diesem Wert</p>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-[#1A1A1A]">Neue Bestellungen</h4>
                      <p className="text-sm text-gray-500">E-Mail bei jeder neuen Bestellung</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('new_order_notifications')}
                      className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                        settings.new_order_notifications ? 'bg-[#C04020]' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.new_order_notifications ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-[#1A1A1A]">Niedrige Lagerbestände</h4>
                      <p className="text-sm text-gray-500">E-Mail bei niedrigen Beständen</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('low_stock_notifications')}
                      className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                        settings.low_stock_notifications ? 'bg-[#C04020]' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.low_stock_notifications ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Automatisierte Aufgaben */}
          <div>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Automatisierte Aufgaben</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-[#1A1A1A]">Automatische Preisanpassungen</h4>
                  <p className="text-sm text-gray-500">Zeitgesteuerte Preisupdates aktivieren</p>
                </div>
                <button
                  onClick={() => handleAutomationToggle('price_updates_enabled')}
                  className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                    settings.price_updates_enabled ? 'bg-[#C04020]' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.price_updates_enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-[#1A1A1A]">Geplante Berichte</h4>
                  <p className="text-sm text-gray-500">Wöchentliche/monatliche Berichte per E-Mail</p>
                </div>
                <button
                  onClick={() => handleAutomationToggle('scheduled_reports')}
                  className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                    settings.scheduled_reports ? 'bg-[#C04020]' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.scheduled_reports ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-[#1A1A1A]">Automatische Nachbestellung</h4>
                  <p className="text-sm text-gray-500">Produkte automatisch nachbestellen</p>
                </div>
                <button
                  onClick={() => handleAutomationToggle('auto_reorder_enabled')}
                  className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                    settings.auto_reorder_enabled ? 'bg-[#C04020]' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.auto_reorder_enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Speichern Button */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            {message && (
              <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                message.includes('erfolgreich')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {message}
              </div>
            )}
            <div className="ml-auto">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Speichert...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line mr-2"></i>
                    Einstellungen speichern
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
