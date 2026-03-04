'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ShopSettings {
  minimum_order_quantity: number;
  shipping_cost_standard: number;
  shipping_cost_express: number;
}

export default function ShopSettingsTab() {
  const [settings, setSettings] = useState<ShopSettings>({
    minimum_order_quantity: 3,
    shipping_cost_standard: 43.50,
    shipping_cost_express: 139.00
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['minimum_order_quantity', 'shipping_cost_standard', 'shipping_cost_express']);

      if (error) throw error;

      const settingsMap: any = {};
      data?.forEach((item: any) => {
        if (item.setting_key === 'minimum_order_quantity') {
          settingsMap[item.setting_key as string] = parseInt(item.setting_value as string);
        } else {
          settingsMap[item.setting_key as string] = parseFloat(item.setting_value as string);
        }
      });

      setSettings(prev => ({ ...prev, ...settingsMap }));
    } catch (error) {
      console.error('Error loading settings:', error);
      showNotification('error', 'Fehler beim Laden der Einstellungen');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updates = [
        {
          setting_key: 'minimum_order_quantity',
          setting_value: settings.minimum_order_quantity.toString(),
          description: 'Mindestbestellmenge in SRM',
          setting_type: 'shop',
          updated_at: new Date().toISOString()
        },
        {
          setting_key: 'shipping_cost_standard',
          setting_value: settings.shipping_cost_standard.toString(),
          description: 'Standard Versandkosten in Euro',
          setting_type: 'shipping',
          updated_at: new Date().toISOString()
        },
        {
          setting_key: 'shipping_cost_express',
          setting_value: settings.shipping_cost_express.toString(),
          description: 'Express Versandkosten in Euro',
          setting_type: 'shipping',
          updated_at: new Date().toISOString()
        }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('app_settings')
          .upsert(update, { onConflict: 'setting_key' });

        if (error) throw error;
      }

      showNotification('success', 'Einstellungen erfolgreich gespeichert');
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('error', 'Fehler beim Speichern der Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Shop-Einstellungen</h2>
        <p className="text-gray-600">Verwalten Sie die grundlegenden Shop-Parameter</p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          {/* Mindestbestellmenge */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full mr-3">
                <i className="ri-shopping-cart-line text-blue-600"></i>
              </div>
              Bestellparameter
            </h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mindestbestellmenge (SRM)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.minimum_order_quantity}
                  onChange={(e) => setSettings({
                    ...settings,
                    minimum_order_quantity: parseInt(e.target.value) || 1
                  })}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-600">
                  SRM (Schüttraummeter)
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Kunden müssen mindestens diese Menge bestellen. Wird automatisch im Frontend angepasst.
              </p>
            </div>
          </div>

          {/* Versandkosten */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-full mr-3">
                <i className="ri-truck-line text-green-600"></i>
              </div>
              Versandkosten
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Standard Versand */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Standard Lieferung (1-3 Wochen)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={settings.shipping_cost_standard}
                    onChange={(e) => setSettings({
                      ...settings,
                      shipping_cost_standard: parseFloat(e.target.value) || 0
                    })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-600">€</span>
                </div>
              </div>

              {/* Express Versand */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Express Lieferung (24-48h)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={settings.shipping_cost_express}
                    onChange={(e) => setSettings({
                      ...settings,
                      shipping_cost_express: parseFloat(e.target.value) || 0
                    })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-600">€</span>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Versandkosten werden automatisch in Warenkorb und Checkout angepasst.
            </p>
          </div>

          {/* Vorschau */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Vorschau der Einstellungen:</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Mindestbestellmenge:</span>
                <span className="font-medium">{settings.minimum_order_quantity} SRM</span>
              </div>
              <div className="flex justify-between">
                <span>Standard Versand:</span>
                <span className="font-medium">{settings.shipping_cost_standard.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span>Express Versand:</span>
                <span className="font-medium">{settings.shipping_cost_express.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Speichern...
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

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded-full mr-3 mt-0.5">
            <i className="ri-information-line text-blue-600 text-sm"></i>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Wichtige Hinweise:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Änderungen werden sofort im Frontend übernommen</li>
              <li>• Die Mindestbestellmenge gilt für die Gesamtmenge aller Produkte</li>
              <li>• Versandkosten werden automatisch im Warenkorb berechnet</li>
              <li>• Express-Versand ist nur bei Verfügbarkeit möglich</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}