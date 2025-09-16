'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import InvoicePreview from './InvoicePreview';
import SimpleInvoicePreview from './SimpleInvoicePreview';

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
  logo_url: string;
  created_at: string;
  updated_at: string;
}

export default function InvoiceSettingsTab({ onStatsUpdate }: InvoiceSettingsTabProps) {
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<InvoiceSettings>>({});
  const [activeTab, setActiveTab] = useState('company');
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [previewSettings, setPreviewSettings] = useState<Record<string, string>>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
        
        // Initialisiere Vorschau-Einstellungen
        const mappedSettings: Record<string, string> = {
          company_name: data.company_name || '',
          company_address: `${data.company_address_line1 || ''} ${data.company_address_line2 || ''}`.trim(),
          company_postal_code: data.company_postal_code || '',
          company_city: data.company_city || '',
          company_phone: data.company_phone || '',
          company_email: data.company_email || '',
          company_website: data.company_website || '',
          company_tax_id: data.tax_id || '',
          company_bank_name: data.bank_name || '',
          company_iban: data.bank_iban || '',
          company_bic: data.bank_bic || '',
          invoice_prefix: data.invoice_prefix || '',
          invoice_payment_terms: data.invoice_footer_text || ''
        };
        setPreviewSettings(mappedSettings);
      } else {
        // Erstelle Standard-Einstellungen
        const defaultSettings = {
          company_name: 'Thorsten Vey - Brennholzhandel',
          company_address_line1: 'Frankfurter Straße 3',
          company_address_line2: '',
          company_postal_code: '36419',
          company_city: 'Buttlar',
          company_phone: '+49 176 71085234',
          company_email: 'info@brennholz-koenig.de',
          company_website: 'www.brennholzkoenig.de',
          tax_id: 'DE200789994',
          vat_rate: 19.00,
          bank_name: 'Sparkasse Bad Hersfeld-Rotenburg',
          bank_iban: 'DE89 5325 0000 0000 1234 56',
          bank_bic: 'HELADEF1HER',
          invoice_prefix: 'RG-',
          invoice_footer_text: 'Vielen Dank für Ihr Vertrauen! Bei Fragen stehen wir Ihnen gerne zur Verfügung.',
          logo_url: 'https://public.readdy.ai/ai/img_res/86db7336-c7fd-4211-8615-9dceb4ceb922.jpg'
        };
        setFormData(defaultSettings);
        
        // Initialisiere Vorschau-Einstellungen mit Standard-Werten
        const mappedSettings: Record<string, string> = {
          company_name: defaultSettings.company_name,
          company_address: `${defaultSettings.company_address_line1} ${defaultSettings.company_address_line2}`.trim(),
          company_postal_code: defaultSettings.company_postal_code,
          company_city: defaultSettings.company_city,
          company_phone: defaultSettings.company_phone,
          company_email: defaultSettings.company_email,
          company_website: defaultSettings.company_website,
          company_tax_id: defaultSettings.tax_id,
          company_bank_name: defaultSettings.bank_name,
          company_iban: defaultSettings.bank_iban,
          company_bic: defaultSettings.bank_bic,
          invoice_prefix: defaultSettings.invoice_prefix,
          invoice_payment_terms: defaultSettings.invoice_footer_text
        };
        setPreviewSettings(mappedSettings);
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
    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);
    
    // Aktualisiere Vorschau-Einstellungen für Live-Preview
    const mappedSettings: Record<string, string> = {
      company_name: newFormData.company_name || '',
      company_address: `${newFormData.company_address_line1 || ''} ${newFormData.company_address_line2 || ''}`.trim(),
      company_postal_code: newFormData.company_postal_code || '',
      company_city: newFormData.company_city || '',
      company_phone: newFormData.company_phone || '',
      company_email: newFormData.company_email || '',
      company_website: newFormData.company_website || '',
      company_tax_id: newFormData.tax_id || '',
      company_bank_name: newFormData.bank_name || '',
      company_iban: newFormData.bank_iban || '',
      company_bic: newFormData.bank_bic || '',
      invoice_prefix: newFormData.invoice_prefix || '',
      invoice_payment_terms: newFormData.invoice_footer_text || ''
    };
    setPreviewSettings(mappedSettings);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validiere Dateigröße (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Die Datei ist zu groß. Maximale Größe: 5MB');
      return;
    }

    // Validiere Dateityp
    if (!file.type.startsWith('image/')) {
      alert('Bitte wählen Sie eine Bilddatei aus.');
      return;
    }

    setUploadingLogo(true);

    try {
      // Erstelle eindeutigen Dateinamen
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      // Upload zu Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Hole die öffentliche URL
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        // Aktualisiere das Formular mit der neuen Logo-URL
        handleInputChange('logo_url', urlData.publicUrl);
        
        // Reset file input
        event.target.value = '';
      }
    } catch (error) {
      console.error('Fehler beim Upload des Logos:', error);
      alert('Fehler beim Upload des Logos. Bitte versuchen Sie es erneut.');
    } finally {
      setUploadingLogo(false);
    }
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
            onClick={() => setShowLivePreview(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <i className="ri-eye-line mr-2"></i>
            Live-Vorschau
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

      {/* Eingabefelder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Firmeninformationen</h3>
        
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

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Firmenlogo
            </label>
            <div className="flex items-center space-x-4">
              {formData.logo_url && (
                <div className="flex-shrink-0">
                  <img
                    src={formData.logo_url}
                    alt="Firmenlogo"
                    className="h-16 w-16 object-contain border border-gray-200 rounded-lg"
                  />
                </div>
              )}
              <div className="flex-1">
                 <input
                   type="file"
                   accept="image/*"
                   onChange={handleLogoUpload}
                   disabled={uploadingLogo}
                   className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 disabled:opacity-50"
                 />
                 {uploadingLogo ? (
                   <p className="text-xs text-amber-600 mt-1 flex items-center">
                     <i className="ri-loader-4-line animate-spin mr-1"></i>
                     Logo wird hochgeladen...
                   </p>
                 ) : (
                   <p className="text-xs text-gray-500 mt-1">
                     PNG, JPG oder SVG. Empfohlene Größe: 200x80px
                   </p>
                 )}
               </div>
              {formData.logo_url && (
                <button
                  type="button"
                  onClick={() => handleInputChange('logo_url', '')}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  <i className="ri-delete-bin-line"></i>
                  Entfernen
                </button>
              )}
            </div>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Steuernummer
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
              MwSt.-Satz (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.vat_rate || ''}
              onChange={(e) => handleInputChange('vat_rate', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="19.00"
            />
          </div>
        </div>
      </div>

      {/* Bankverbindung */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Bankverbindung</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bankname
            </label>
            <input
              type="text"
              value={formData.bank_name || ''}
              onChange={(e) => handleInputChange('bank_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Sparkasse Musterstadt"
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

      {/* Rechnungseinstellungen */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Rechnungseinstellungen</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechnungspräfix
            </label>
            <input
              type="text"
              value={formData.invoice_prefix || ''}
              onChange={(e) => handleInputChange('invoice_prefix', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="RG-"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fußzeile / Zahlungsbedingungen
            </label>
            <textarea
              value={formData.invoice_footer_text || ''}
              onChange={(e) => handleInputChange('invoice_footer_text', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Vielen Dank für Ihr Vertrauen! Bei Fragen stehen wir Ihnen gerne zur Verfügung."
            />
          </div>
        </div>
      </div>

      {/* Live-Rechnungsvorschau */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">🔥 Live-Rechnungsvorschau (Puppeteer)</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowLivePreview(true)}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
            >
              <i className="ri-fullscreen-line mr-1"></i>
              Vollbild
            </button>
          </div>
        </div>
        
        <div className="border border-gray-200 rounded-lg overflow-hidden" style={{height: '600px'}}>
          <SimpleInvoicePreview customSettings={previewSettings} />
        </div>
      </div>
      
      {/* Live-Vorschau Modal */}
      {showLivePreview && (
        <InvoicePreview
          orderId={undefined}
          invoiceId={undefined}
          customSettings={previewSettings}
          onClose={() => setShowLivePreview(false)}
        />
      )}
    </div>
  );
}