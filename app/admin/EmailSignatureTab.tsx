'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface EmailSignature {
  enabled: boolean;
  html_signature: string;
  text_signature: string;
}

export default function EmailSignatureTab() {
  const [signature, setSignature] = useState<EmailSignature>({
    enabled: true,
    html_signature: '',
    text_signature: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html');

  useEffect(() => {
    loadSignature();
  }, []);

  const loadSignature = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'global_email_signature')
        .eq('setting_type', 'email_config')
        .single();

      if (data) {
        const signatureData = JSON.parse(data.setting_value);
        setSignature(signatureData);
      }
    } catch (error) {
      console.error('Error loading signature:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSignature = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({
          setting_value: JSON.stringify(signature),
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'global_email_signature')
        .eq('setting_type', 'email_config');

      if (error) throw error;
      
      alert('E-Mail-Signatur erfolgreich gespeichert!');
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('Fehler beim Speichern der Signatur');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    setSignature({
      enabled: true,
      html_signature: `<div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #C04020; font-family: Arial, sans-serif;">
  <table style="width: 100%; max-width: 500px;">
    <tr>
      <td style="vertical-align: top; padding-right: 20px;">
        <img src="https://brennholz-koenig.de/images/Brennholzkönig%20transparent.webp?v=4&t=1695730300" alt="Brennholzkönig Logo" style="height: 60px; width: auto;" />
      </td>
      <td style="vertical-align: top;">
        <div style="color: #C04020; font-weight: bold; font-size: 16px; margin-bottom: 5px;">Thorsten Vey</div>
        <div style="color: #666; font-size: 14px; margin-bottom: 3px;">Geschäftsführer</div>
        <div style="color: #666; font-size: 14px; margin-bottom: 10px;">Brennholzkönig - Premium Brennholzhandel</div>
        
        <div style="color: #333; font-size: 13px; line-height: 1.4;">
          <div>📞 +49 176 71085234</div>
          <div>📧 info@brennholz-koenig.de</div>
          <div>🌐 www.brennholzkoenig.de</div>
          <div>📍 Frankfurter Straße 3, 36419 Buttlar</div>
        </div>
        
        <div style="margin-top: 10px; color: #999; font-size: 11px;">
          Nachhaltig • Regional • Premium Qualität
        </div>
      </td>
    </tr>
  </table>
</div>`,
      text_signature: `\n\n---\nThorsten Vey\nGeschäftsführer\nBrennholzkönig - Premium Brennholzhandel\n\nTelefon: +49 176 71085234\nE-Mail: info@brennholz-koenig.de\nWebsite: www.brennholzkoenig.de\nAdresse: Frankfurter Straße 3, 36419 Buttlar\n\nNachhaltig • Regional • Premium Qualität`
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Globale E-Mail-Signatur</h2>
            <p className="text-gray-600 mt-1">Verwalten Sie die Signatur, die automatisch an alle ausgehenden E-Mails angehängt wird.</p>
          </div>
          <div className="flex items-center space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={signature.enabled}
                onChange={(e) => setSignature({ ...signature, enabled: e.target.checked })}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Signatur aktiviert</span>
            </label>
          </div>
        </div>
      </div>

      {/* Signatur Editor */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Signatur bearbeiten</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setPreviewMode('html')}
              className={`px-3 py-1 text-sm rounded ${
                previewMode === 'html'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              HTML
            </button>
            <button
              onClick={() => setPreviewMode('text')}
              className={`px-3 py-1 text-sm rounded ${
                previewMode === 'text'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Text
            </button>
          </div>
        </div>

        {previewMode === 'html' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTML-Signatur
              </label>
              <textarea
                value={signature.html_signature}
                onChange={(e) => setSignature({ ...signature, html_signature: e.target.value })}
                rows={12}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                placeholder="HTML-Code für die E-Mail-Signatur..."
              />
            </div>
            
            {/* HTML Vorschau */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vorschau
              </label>
              <div 
                className="border border-gray-300 rounded-md p-4 bg-gray-50 min-h-32"
                dangerouslySetInnerHTML={{ __html: signature.html_signature }}
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text-Signatur
            </label>
            <textarea
              value={signature.text_signature}
              onChange={(e) => setSignature({ ...signature, text_signature: e.target.value })}
              rows={8}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
              placeholder="Text-Version der E-Mail-Signatur..."
            />
            
            {/* Text Vorschau */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vorschau
              </label>
              <div className="border border-gray-300 rounded-md p-4 bg-gray-50 min-h-32 whitespace-pre-wrap font-mono text-sm">
                {signature.text_signature}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Aktionen */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={resetToDefault}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Standard wiederherstellen
          </button>
          
          <button
            onClick={saveSignature}
            disabled={saving}
            className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Speichern...' : 'Signatur speichern'}
          </button>
        </div>
      </div>

      {/* Hinweise */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Hinweise zur E-Mail-Signatur</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Die Signatur wird automatisch an alle ausgehenden E-Mails angehängt</li>
          <li>• HTML-Signaturen werden für HTML-E-Mails verwendet, Text-Signaturen für Plain-Text E-Mails</li>
          <li>• Verwenden Sie absolute URLs für Bilder (https://...)</li>
          <li>• Testen Sie die Signatur in verschiedenen E-Mail-Clients</li>
          <li>• Die Signatur kann jederzeit aktiviert oder deaktiviert werden</li>
        </ul>
      </div>
    </div>
  );
}