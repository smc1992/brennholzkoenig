'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface TaxSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface TaxSettings {
  default_tax_included: boolean;
  vat_rate: number;
}

export default function TaxSettingsModal({ isOpen, onClose, onSave }: TaxSettingsModalProps) {
  const [settings, setSettings] = useState<TaxSettings>({
    default_tax_included: false,
    vat_rate: 19
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('default_tax_included, vat_rate')
        .single();

      if (error) {
        console.error('Error loading tax settings:', error);
        return;
      }

      if (data) {
        setSettings({
          default_tax_included: data.default_tax_included || false,
          vat_rate: data.vat_rate || 19
        });
      }
    } catch (error) {
      console.error('Error loading tax settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('invoice_settings')
        .update({
          default_tax_included: settings.default_tax_included,
          vat_rate: settings.vat_rate
        })
        .eq('id', (await supabase.from('invoice_settings').select('id').single()).data?.id);

      if (error) {
        console.error('Error saving tax settings:', error);
        alert('Fehler beim Speichern der Steuereinstellungen');
        return;
      }

      alert('Steuereinstellungen erfolgreich gespeichert!');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving tax settings:', error);
      alert('Fehler beim Speichern der Steuereinstellungen');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Steuereinstellungen</h2>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Lade Einstellungen...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mehrwertsteuersatz (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.vat_rate}
                onChange={(e) => setSettings(prev => ({ ...prev, vat_rate: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.default_tax_included}
                  onChange={(e) => setSettings(prev => ({ ...prev, default_tax_included: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Preise enthalten standardmäßig Mehrwertsteuer
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Wenn aktiviert, werden neue Artikel mit Bruttopreisen (Steuer enthalten) erstellt.
                Wenn deaktiviert, werden Nettopreise (Steuer zusätzlich) verwendet.
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Aktuelle Einstellung:</h3>
              <p className="text-sm text-blue-700">
                {settings.default_tax_included 
                  ? `Bruttopreise (${settings.vat_rate}% MwSt. enthalten)`
                  : `Nettopreise (${settings.vat_rate}% MwSt. zusätzlich)`
                }
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            onClick={saveSettings}
            disabled={loading || saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}