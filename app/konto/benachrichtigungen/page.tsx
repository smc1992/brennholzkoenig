
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface NotificationSettings {
  email_order_updates: boolean;
  email_promotions: boolean;
  email_newsletters: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
}

export default function NotificationsPage() {
  // Using the centralized Supabase client from lib/supabase.ts

  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_order_updates: true,
    email_promotions: true,
    email_newsletters: false,
    push_notifications: false,
    sms_notifications: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/konto';
      return;
    }
    setUser(user);
    await loadSettings(user.email);
  };

  const loadSettings = async (email: string | undefined) => {
    if (!email) return;
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('notification_preferences')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Fehler beim Laden der Einstellungen:', error);
        return;
      }

      if (data?.notification_preferences) {
        setSettings({
          ...settings,
          ...data.notification_preferences
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user || !user.email) return;

    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('customers')
        .upsert({
          email: user.email,
          notification_preferences: settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        });

      if (error) throw error;

      setMessage('Einstellungen erfolgreich gespeichert!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setMessage('Fehler beim Speichern der Einstellungen.');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center py-4 space-x-4">
            <Link href="/konto/dashboard" className="text-orange-600 hover:text-orange-700">
              <i className="ri-arrow-left-line text-xl"></i>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Benachrichtigungen</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Benachrichtigungseinstellungen
              </h2>
              <p className="text-gray-600">
                Wählen Sie aus, wie und wann Sie von uns benachrichtigt werden möchten.
              </p>
            </div>

            {message && (
              <div className={`p-4 rounded-lg mb-6 ${message.includes('erfolgreich') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message}
              </div>
            )}

            <div className="space-y-6">
              {/* E-Mail Benachrichtigungen */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <i className="ri-mail-line mr-2 text-orange-600"></i>
                  E-Mail Benachrichtigungen
                </h3>

                <div className="space-y-4 ml-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Bestellupdates</h4>
                      <p className="text-sm text-gray-600">
                        Bestätigungen, Versandbenachrichtigungen und Lieferupdates
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.email_order_updates}
                        onChange={(e) => updateSetting('email_order_updates', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Aktionen und Angebote</h4>
                      <p className="text-sm text-gray-600">
                        Rabattcodes, Sonderangebote und exklusive Deals
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.email_promotions}
                        onChange={(e) => updateSetting('email_promotions', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Newsletter</h4>
                      <p className="text-sm text-gray-600">
                        Monatliche Tipps, Neuigkeiten und Branchen-Updates
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.email_newsletters}
                        onChange={(e) => updateSetting('email_newsletters', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Push Benachrichtigungen */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <i className="ri-notification-line mr-2 text-orange-600"></i>
                  Push-Benachrichtigungen
                </h3>

                <div className="ml-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Browser-Benachrichtigungen</h4>
                      <p className="text-sm text-gray-600">
                        Sofortige Benachrichtigungen über wichtige Updates
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.push_notifications}
                        onChange={(e) => updateSetting('push_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* SMS Benachrichtigungen */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <i className="ri-message-line mr-2 text-orange-600"></i>
                  SMS Benachrichtigungen
                </h3>

                <div className="ml-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">SMS Updates</h4>
                      <p className="text-sm text-gray-600">
                        Wichtige Lieferupdates per SMS (kostenpflichtig)
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.sms_notifications}
                        onChange={(e) => updateSetting('sms_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {saving ? (
                  <>
                    <i className="ri-loader-4-line mr-2 animate-spin"></i>
                    Speichert...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line mr-2"></i>
                    Einstellungen speichern
                  </>
                )}
              </button>

              <div className="mt-4 text-center">
                <Link
                  href="/konto/dashboard"
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Zurück zum Dashboard
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <i className="ri-information-line text-blue-600 text-xl mr-3 flex-shrink-0 mt-0.5"></i>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Datenschutz-Hinweis</h4>
                <p className="text-sm text-blue-800">
                  Ihre Benachrichtigungseinstellungen werden sicher gespeichert. Sie können diese
                  jederzeit ändern. Wir verwenden Ihre Daten nur entsprechend unserer
                  <Link href="/datenschutz" className="underline hover:no-underline ml-1">
                    Datenschutzerklärung
                  </Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
