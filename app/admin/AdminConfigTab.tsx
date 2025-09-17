'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminConfig {
  notification_email: string;
  company_name: string;
  support_email: string;
  phone: string;
  address: string;
  auto_notifications: boolean;
  order_notification_enabled: boolean;
  low_stock_notification_enabled: boolean;
}

export default function AdminConfigTab() {
  const [config, setConfig] = useState<AdminConfig>({
    notification_email: '',
    company_name: 'Brennholzkönig',
    support_email: 'info@brennholz-koenig.de',
    phone: '',
    address: '',
    auto_notifications: true,
    order_notification_enabled: true,
    low_stock_notification_enabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAdminConfig();
  }, []);

  const loadAdminConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'admin_config')
        .single();

      if (data && !error) {
        const savedConfig = JSON.parse(data.setting_value);
        setConfig({ ...config, ...savedConfig });
      }
    } catch (error) {
      console.error('Error loading admin config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAdminConfig = async () => {
    try {
      setSaving(true);
      
      // Validierung
      if (!config.notification_email.trim()) {
        setMessage('Bitte geben Sie eine Admin-E-Mail-Adresse ein.');
        return;
      }
      
      if (!config.notification_email.includes('@')) {
        setMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
        return;
      }

      const { data: existingData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'admin_config')
        .single();

      const configData = {
        ...config,
        updated_at: new Date().toISOString()
      };

      let result;
      if (existingData) {
        // Update existing config
        result = await supabase
          .from('app_settings')
          .update({
            setting_value: JSON.stringify(configData),
            updated_at: new Date().toISOString()
          })
          .eq('setting_type', 'admin_config');
      } else {
        // Create new config
        result = await supabase
          .from('app_settings')
          .insert({
            setting_name: 'admin_configuration',
            setting_type: 'admin_config',
            setting_value: JSON.stringify(configData),
            description: 'Administrator-Konfiguration',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      if (result.error) {
        throw result.error;
      }

      setMessage('Konfiguration erfolgreich gespeichert!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving admin config:', error);
      setMessage(`Fehler beim Speichern: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const testNotificationEmail = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/test-admin-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminEmail: config.notification_email,
          testMessage: 'Dies ist eine Test-Benachrichtigung zur Überprüfung der Admin-E-Mail-Konfiguration.'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage('Test-E-Mail erfolgreich versendet!');
      } else {
        setMessage(`Fehler beim Versenden der Test-E-Mail: ${result.error}`);
      }
      
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error testing notification email:', error);
      setMessage('Fehler beim Versenden der Test-E-Mail');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C04020]"></div>
        <span className="ml-2 text-gray-600">Lade Konfiguration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          <i className="ri-settings-3-line mr-2 text-[#C04020]"></i>
          Administrator-Konfiguration
        </h2>
        <p className="text-gray-600">
          Konfigurieren Sie die Administrator-Einstellungen und Benachrichtigungen.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('erfolgreich') 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Admin E-Mail Konfiguration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="ri-mail-line mr-2 text-[#C04020]"></i>
          E-Mail-Benachrichtigungen
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin-E-Mail-Adresse *
            </label>
            <input
              type="email"
              value={config.notification_email}
              onChange={(e) => setConfig(prev => ({ ...prev, notification_email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
              placeholder="admin@brennholz-koenig.de"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              An diese E-Mail-Adresse werden alle Admin-Benachrichtigungen gesendet.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={testNotificationEmail}
              disabled={saving || !config.notification_email.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <i className="ri-loader-4-line mr-1 animate-spin"></i>
                  Sende Test-E-Mail...
                </>
              ) : (
                <>
                  <i className="ri-mail-send-line mr-1"></i>
                  Test-E-Mail senden
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Benachrichtigungs-Einstellungen */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="ri-notification-3-line mr-2 text-[#C04020]"></i>
          Benachrichtigungs-Einstellungen
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Automatische Benachrichtigungen
              </label>
              <p className="text-xs text-gray-500">
                Aktiviert alle automatischen E-Mail-Benachrichtigungen
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.auto_notifications}
              onChange={(e) => setConfig(prev => ({ ...prev, auto_notifications: e.target.checked }))}
              className="h-4 w-4 text-[#C04020] focus:ring-[#C04020] border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Bestellbenachrichtigungen
              </label>
              <p className="text-xs text-gray-500">
                Benachrichtigung bei neuen Bestellungen
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.order_notification_enabled}
              onChange={(e) => setConfig(prev => ({ ...prev, order_notification_enabled: e.target.checked }))}
              className="h-4 w-4 text-[#C04020] focus:ring-[#C04020] border-gray-300 rounded"
              disabled={!config.auto_notifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Lagerbestand-Benachrichtigungen
              </label>
              <p className="text-xs text-gray-500">
                Benachrichtigung bei niedrigem Lagerbestand
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.low_stock_notification_enabled}
              onChange={(e) => setConfig(prev => ({ ...prev, low_stock_notification_enabled: e.target.checked }))}
              className="h-4 w-4 text-[#C04020] focus:ring-[#C04020] border-gray-300 rounded"
              disabled={!config.auto_notifications}
            />
          </div>
        </div>
      </div>

      {/* Firmen-Informationen */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="ri-building-line mr-2 text-[#C04020]"></i>
          Firmen-Informationen
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Firmenname
            </label>
            <input
              type="text"
              value={config.company_name}
              onChange={(e) => setConfig(prev => ({ ...prev, company_name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
              placeholder="Brennholzkönig"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Support-E-Mail
            </label>
            <input
              type="email"
              value={config.support_email}
              onChange={(e) => setConfig(prev => ({ ...prev, support_email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
              placeholder="info@brennholz-koenig.de"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon
            </label>
            <input
              type="tel"
              value={config.phone}
              onChange={(e) => setConfig(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
              placeholder="+49 (0) 123 456789"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse
            </label>
            <input
              type="text"
              value={config.address}
              onChange={(e) => setConfig(prev => ({ ...prev, address: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
              placeholder="Musterstraße 123, 12345 Musterstadt"
            />
          </div>
        </div>
      </div>

      {/* Speichern Button */}
      <div className="flex justify-end">
        <button
          onClick={saveAdminConfig}
          disabled={saving}
          className="px-6 py-2 bg-[#C04020] text-white rounded-lg hover:bg-[#A03318] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <i className="ri-loader-4-line mr-1 animate-spin"></i>
              Speichere...
            </>
          ) : (
            <>
              <i className="ri-save-line mr-1"></i>
              Konfiguration speichern
            </>
          )}
        </button>
      </div>
    </div>
  );
}