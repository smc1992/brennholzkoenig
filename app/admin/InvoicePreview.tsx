'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface InvoicePreviewProps {
  orderId?: string;
  invoiceId?: string;
  customSettings?: Record<string, string>;
  onClose: () => void;
  embedded?: boolean;
}

interface CompanySettings {
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
}

export default function InvoicePreview({ orderId, invoiceId, customSettings, onClose, embedded = false }: InvoicePreviewProps) {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Partial<CompanySettings>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lade initiale Einstellungen
  const loadSettings = useCallback(async () => {
    try {
      const { data: invoiceSettings } = await supabase
        .from('invoice_settings')
        .select('*')
        .limit(1)
        .single();
      
      console.log('📋 Loaded invoice settings in preview:', invoiceSettings);
      
      if (invoiceSettings) {
        setSettings(invoiceSettings);
      }
    } catch (err) {
      console.error('Error loading invoice settings:', err);
    }
  }, []);

  // Generiere Vorschau
  const generatePreview = useCallback(async (overrideSettings?: Partial<CompanySettings>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Verwende customSettings aus Props falls verfügbar, sonst lokale settings
      const finalSettings = customSettings || overrideSettings || settings;
      
      console.log('🔄 Generating preview with:', { orderId, invoiceId, hasCustomSettings: !!customSettings, settingsCount: Object.keys(finalSettings).length });
      
      const response = await fetch('/api/invoice-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          invoiceId,
          customSettings: finalSettings
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Preview API error:', response.status, errorText);
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Preview generated successfully');
        setPreviewHtml(result.html);
      } else {
        console.error('❌ Preview generation failed:', result.error);
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('❌ Preview generation error:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Vorschau');
    } finally {
      setLoading(false);
    }
  }, [orderId, invoiceId, settings, customSettings]);

  // Initiale Ladung - nur wenn keine customSettings vorhanden
  useEffect(() => {
    if (!customSettings || Object.keys(customSettings).length === 0) {
      loadSettings();
    }
  }, [loadSettings, customSettings]);

  // Generiere Vorschau wenn Settings geladen sind oder customSettings verfügbar sind
  useEffect(() => {
    console.log('🔄 useEffect triggered:', { 
      hasCustomSettings: !!customSettings && Object.keys(customSettings).length > 0,
      hasSettings: Object.keys(settings).length > 0,
      orderId,
      invoiceId
    });
    
    if (customSettings && Object.keys(customSettings).length > 0) {
      // Direkt Vorschau mit customSettings generieren
      console.log('📋 Using customSettings for preview');
      generatePreview();
    } else if (Object.keys(settings).length > 0) {
      // Vorschau mit geladenen Settings generieren
      console.log('📋 Using loaded settings for preview');
      generatePreview();
    } else if (orderId || invoiceId) {
      // Auch ohne Settings versuchen (API hat Fallback-Daten)
      console.log('📋 Generating preview without settings (using API fallback)');
      generatePreview({});
    }
  }, [settings, customSettings, generatePreview, orderId, invoiceId]);

  // Realtime Update bei Änderungen
  useEffect(() => {
    if (isEditing && Object.keys(settings).length > 0) {
      const timeoutId = setTimeout(() => {
        generatePreview(settings);
      }, 500); // Debounce für 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [settings, isEditing, generatePreview]);

  const handleSettingChange = (key: keyof CompanySettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      
      // Speichere alle geänderten Einstellungen in invoice_settings
      const { error } = await supabase
        .from('invoice_settings')
        .upsert(settings, { onConflict: 'id' });
      
      if (error) throw error;
      
      alert('Einstellungen erfolgreich gespeichert!');
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Fehler beim Speichern der Einstellungen');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/invoice-builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          invoiceId,
          saveToFile: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const result = await response.json();
      
      if (result.success) {
        alert(`PDF erfolgreich erstellt: ${result.fileName}`);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Fehler beim Erstellen der PDF');
    } finally {
      setLoading(false);
    }
  };

  // Embedded-Modus: Nur iframe ohne Modal
  if (embedded) {
    return (
      <div className="w-full h-full">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Vorschau wird generiert...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-red-600 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium text-sm">Fehler beim Laden</p>
              <p className="text-gray-600 text-xs mt-1">{error}</p>
            </div>
          </div>
        )}
        
        {!loading && !error && previewHtml && (
          <iframe
            srcDoc={previewHtml}
            className="w-full h-full border-0"
            title="Rechnungsvorschau"
          />
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            Rechnungsvorschau {orderId && `- Bestellung ${orderId}`}
          </h2>
          <div className="flex items-center gap-2">
            {!customSettings && (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    isEditing 
                      ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  {isEditing ? 'Bearbeitung beenden' : 'Bearbeiten'}
                </button>
                {isEditing && (
                  <button
                    onClick={saveSettings}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    Speichern
                  </button>
                )}
                <button
                  onClick={generatePDF}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  PDF erstellen
                </button>
              </>
            )}
            {customSettings && (
              <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-md">
                <i className="ri-information-line mr-1"></i>
                Live-Vorschau aus Rechnungseinstellungen
              </div>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
            >
              Schließen
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Einstellungen Panel */}
          {isEditing && !customSettings && (
            <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">Unternehmensdaten</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Firmenname
                  </label>
                  <input
                    type="text"
                    value={settings.company_name || ''}
                    onChange={(e) => handleSettingChange('company_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={settings.company_address_line1 || ''}
                    onChange={(e) => handleSettingChange('company_address_line1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PLZ
                    </label>
                    <input
                      type="text"
                      value={settings.company_postal_code || ''}
                      onChange={(e) => handleSettingChange('company_postal_code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stadt
                    </label>
                    <input
                      type="text"
                      value={settings.company_city || ''}
                      onChange={(e) => handleSettingChange('company_city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="text"
                    value={settings.company_phone || ''}
                    onChange={(e) => handleSettingChange('company_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-Mail
                  </label>
                  <input
                    type="email"
                    value={settings.company_email || ''}
                    onChange={(e) => handleSettingChange('company_email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="text"
                    value={settings.company_website || ''}
                    onChange={(e) => handleSettingChange('company_website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Steuernummer
                  </label>
                  <input
                    type="text"
                    value={settings.tax_id || ''}
                    onChange={(e) => handleSettingChange('tax_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                
                <h4 className="text-md font-medium mt-6 mb-2">Bankdaten</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank
                  </label>
                  <input
                    type="text"
                    value={settings.bank_name || ''}
                    onChange={(e) => handleSettingChange('bank_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IBAN
                  </label>
                  <input
                    type="text"
                    value={settings.bank_iban || ''}
                    onChange={(e) => handleSettingChange('bank_iban', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    BIC
                  </label>
                  <input
                    type="text"
                    value={settings.bank_bic || ''}
                    onChange={(e) => handleSettingChange('bank_bic', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                
                <h4 className="text-md font-medium mt-6 mb-2">Rechnungseinstellungen</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rechnungspräfix
                  </label>
                  <input
                    type="text"
                    value={settings.invoice_prefix || ''}
                    onChange={(e) => handleSettingChange('invoice_prefix', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zahlungsbedingungen
                  </label>
                  <textarea
                    value={settings.invoice_footer_text || ''}
                    onChange={(e) => handleSettingChange('invoice_footer_text', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Vorschau */}
          <div className="flex-1 bg-gray-100 p-4 overflow-auto">
            {loading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Vorschau wird generiert...</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-red-600 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-600 font-medium">Fehler beim Laden der Vorschau</p>
                  <p className="text-gray-600 text-sm mt-1">{error}</p>
                  <button
                    onClick={() => generatePreview()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    Erneut versuchen
                  </button>
                </div>
              </div>
            )}
            
            {!loading && !error && previewHtml && (
              <div className="bg-white shadow-lg rounded-lg overflow-hidden" style={{ minHeight: '297mm' }}>
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full border-0"
                  style={{ minHeight: '297mm' }}
                  title="Rechnungsvorschau"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}