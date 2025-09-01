'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface InvoiceSettingsTabProps {
  onStatsUpdate?: () => Promise<void>;
}

interface InvoiceSettings {
  id: string;
  company_name: string;
  company_address_line1: string;
  company_address_line2: string;
  company_postal_code: string;
  company_city: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  tax_id: string;
  vat_rate: number;
  bank_name: string;
  bank_iban: string;
  bank_bic: string;
  invoice_prefix: string;
  invoice_footer_text: string;
  created_at: string;
  updated_at: string;
}

export default function InvoiceSettingsTab({ onStatsUpdate }: InvoiceSettingsTabProps) {
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<InvoiceSettings>>({});
  const [activeTab, setActiveTab] = useState('company');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Fehler beim Laden der Einstellungen:', error);
        return;
      }

      if (data) {
        setSettings(data);
        setFormData(data);
      } else {
        // Erstelle Standard-Einstellungen
        const defaultSettings = {
          company_name: 'Brennholzkönig',
          company_address_line1: 'Musterstraße 123',
          company_address_line2: '',
          company_postal_code: '12345',
          company_city: 'Musterstadt',
          company_phone: '+49 123 456789',
          company_email: 'info@brennholzkoenig.de',
          company_website: 'www.brennholzkoenig.de',
          tax_id: 'DE123456789',
          vat_rate: 19.00,
          bank_name: 'Musterbank',
          bank_iban: 'DE89 3704 0044 0532 0130 00',
          bank_bic: 'COBADEFFXXX',
          invoice_prefix: 'RG-',
          invoice_footer_text: 'Vielen Dank für Ihr Vertrauen!'
        };
        setFormData(defaultSettings);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      if (settings?.id) {
        // Update existing settings
        const { error } = await supabase
          .from('invoice_settings')
          .update(formData)
          .eq('id', settings.id);

        if (error) {
          console.error('Fehler beim Aktualisieren der Einstellungen:', error);
          alert('Fehler beim Speichern der Einstellungen');
          return;
        }
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('invoice_settings')
          .insert(formData)
          .select()
          .single();

        if (error) {
          console.error('Fehler beim Erstellen der Einstellungen:', error);
          alert('Fehler beim Speichern der Einstellungen');
          return;
        }

        setSettings(data);
      }

      await loadSettings();
      alert('Einstellungen erfolgreich gespeichert!');
    } catch (error) {
      console.error('Fehler beim Speichern der Einstellungen:', error);
      alert('Fehler beim Speichern der Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof InvoiceSettings, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      company_name: 'Brennholzkönig',
      company_address_line1: 'Musterstraße 123',
      company_address_line2: '',
      company_postal_code: '12345',
      company_city: 'Musterstadt',
      company_phone: '+49 123 456789',
      company_email: 'info@brennholzkoenig.de',
      company_website: 'www.brennholzkoenig.de',
      tax_id: 'DE123456789',
      vat_rate: 19.00,
      bank_name: 'Musterbank',
      bank_iban: 'DE89 3704 0044 0532 0130 00',
      bank_bic: 'COBADEFFXXX',
      invoice_prefix: 'RG-',
      invoice_footer_text: 'Vielen Dank für Ihr Vertrauen!'
    };
    setFormData(defaultSettings);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rechnungseinstellungen</h2>
          <p className="text-gray-600">Konfigurieren Sie die Parameter für Ihre Rechnungen</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={resetToDefaults}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <i className="ri-refresh-line mr-2"></i>
            Zurücksetzen
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            <i className="ri-save-line mr-2"></i>
            {saving ? 'Speichere...' : 'Speichern'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('company')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'company'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <i className="ri-building-line mr-2"></i>
            Firmeninformationen
          </button>
          <button
            onClick={() => setActiveTab('tax')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tax'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <i className="ri-percent-line mr-2"></i>
            Steuer & Finanzen
          </button>
          <button
            onClick={() => setActiveTab('invoice')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invoice'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <i className="ri-file-text-line mr-2"></i>
            Rechnungsformat
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'company' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Firmeninformationen</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firmenname *
                </label>
                <input
                  type="text"
                  value={formData.company_name || ''}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Brennholzkönig"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="text"
                  value={formData.company_website || ''}
                  onChange={(e) => handleInputChange('company_website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="www.brennholzkoenig.de"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Straße und Hausnummer *
                </label>
                <input
                  type="text"
                  value={formData.company_address_line1 || ''}
                  onChange={(e) => handleInputChange('company_address_line1', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Musterstraße 123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresszusatz
                </label>
                <input
                  type="text"
                  value={formData.company_address_line2 || ''}
                  onChange={(e) => handleInputChange('company_address_line2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Gebäude A, 2. Stock"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postleitzahl *
                </label>
                <input
                  type="text"
                  value={formData.company_postal_code || ''}
                  onChange={(e) => handleInputChange('company_postal_code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stadt *
                </label>
                <input
                  type="text"
                  value={formData.company_city || ''}
                  onChange={(e) => handleInputChange('company_city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Musterstadt"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon *
                </label>
                <input
                  type="text"
                  value={formData.company_phone || ''}
                  onChange={(e) => handleInputChange('company_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="+49 123 456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-Mail *
                </label>
                <input
                  type="email"
                  value={formData.company_email || ''}
                  onChange={(e) => handleInputChange('company_email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="info@brennholzkoenig.de"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Steuer & Finanzen</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Umsatzsteuer-ID
                </label>
                <input
                  type="text"
                  value={formData.tax_id || ''}
                  onChange={(e) => handleInputChange('tax_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="DE123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mehrwertsteuersatz (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.vat_rate || 19}
                  onChange={(e) => handleInputChange('vat_rate', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="19.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bankname
                </label>
                <input
                  type="text"
                  value={formData.bank_name || ''}
                  onChange={(e) => handleInputChange('bank_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Musterbank"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IBAN
                </label>
                <input
                  type="text"
                  value={formData.bank_iban || ''}
                  onChange={(e) => handleInputChange('bank_iban', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="DE89 3704 0044 0532 0130 00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BIC
                </label>
                <input
                  type="text"
                  value={formData.bank_bic || ''}
                  onChange={(e) => handleInputChange('bank_bic', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="COBADEFFXXX"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoice' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Rechnungsformat</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechnungsnummer-Präfix
                </label>
                <input
                  type="text"
                  value={formData.invoice_prefix || ''}
                  onChange={(e) => handleInputChange('invoice_prefix', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="RG-"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Beispiel: RG-{Date.now()}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechnungs-Fußzeile
                </label>
                <textarea
                  value={formData.invoice_footer_text || ''}
                  onChange={(e) => handleInputChange('invoice_footer_text', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Vielen Dank für Ihr Vertrauen!"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vorschau */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Vorschau Rechnungskopf</h3>
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{formData.company_name || 'Brennholzkönig'}</h2>
              <div className="text-sm text-gray-600 mt-2">
                <p>{formData.company_address_line1 || 'Musterstraße 123'}</p>
                {formData.company_address_line2 && <p>{formData.company_address_line2}</p>}
                <p>{formData.company_postal_code || '12345'} {formData.company_city || 'Musterstadt'}</p>
                <p className="mt-2">
                  Tel: {formData.company_phone || '+49 123 456789'}<br/>
                  E-Mail: {formData.company_email || 'info@brennholzkoenig.de'}<br/>
                  Web: {formData.company_website || 'www.brennholzkoenig.de'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-bold text-gray-900">RECHNUNG</h3>
              <p className="text-sm text-gray-600 mt-2">
                Rechnungsnummer: {formData.invoice_prefix || 'RG-'}{Date.now()}
              </p>
              <p className="text-sm text-gray-600">
                Datum: {new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-300 pt-4">
            <div className="text-sm text-gray-600">
              {formData.tax_id && <p>Umsatzsteuer-ID: {formData.tax_id}</p>}
              {formData.bank_name && (
                <p className="mt-2">
                  Bankverbindung: {formData.bank_name}<br/>
                  IBAN: {formData.bank_iban || 'DE89 3704 0044 0532 0130 00'}<br/>
                  BIC: {formData.bank_bic || 'COBADEFFXXX'}
                </p>
              )}
            </div>
          </div>
          
          {formData.invoice_footer_text && (
            <div className="border-t border-gray-300 mt-6 pt-4 text-center text-sm text-gray-600">
              {formData.invoice_footer_text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}