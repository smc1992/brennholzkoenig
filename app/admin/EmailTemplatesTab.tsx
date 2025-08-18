
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  content: string;
  type: 'order_confirmation' | 'shipping_notification' | 'welcome' | 'abandoned_cart' | 'promotion';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function EmailTemplatesTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'order_confirmation',
    subject: '',
    content: '',
    is_active: true,
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der E-Mail-Vorlagen:', error);
      setMessage('Fehler beim Laden der E-Mail-Vorlagen');
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('email_templates')
        .upsert({
          id: selectedTemplate.id,
          name: selectedTemplate.name,
          subject: selectedTemplate.subject,
          content: selectedTemplate.content,
          type: selectedTemplate.type,
          is_active: selectedTemplate.is_active,
        });

      if (error) throw error;

      await loadTemplates();
      setIsEditing(false);
      setMessage('E-Mail-Vorlage erfolgreich gespeichert!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setMessage('Fehler beim Speichern der Vorlage.');
    } finally {
      setSaving(false);
    }
  };

  const createNewTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) {
      setMessage('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    setSaving(true);
    try {
      const templateId = `template_email_${Date.now()}`;

      const { error } = await supabase
        .from('email_templates')
        .insert({
          id: templateId,
          name: newTemplate.name,
          subject: newTemplate.subject,
          content: newTemplate.content,
          type: newTemplate.type,
          is_active: newTemplate.is_active,
        });

      if (error) throw error;

      await loadTemplates();
      setShowNewTemplate(false);
      setNewTemplate({
        name: '',
        type: 'order_confirmation',
        subject: '',
        content: '',
        is_active: true,
      });
      setMessage('Neue E-Mail-Vorlage erfolgreich erstellt!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Fehler beim Erstellen:', error);
      setMessage(`Fehler beim Erstellen der Vorlage: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async (template: EmailTemplate) => {
    setSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          to: 'admin@brennholzkoenig.de',
          subject: `[TEST] ${template.subject}`,
          html: template.content
            .replace(/{customerName}/g, 'Max Mustermann')
            .replace(/{orderId}/g, 'BHK-12345678')
            .replace(/{orderDate}/g, new Date().toLocaleDateString('de-DE'))
            .replace(/{totalAmount}/g, '299,50')
            .replace(/{trackingNumber}/g, 'DHL-123456789'),
          type: 'template_test',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setMessage('Test-E-Mail erfolgreich gesendet! Prüfen Sie Ihr Postfach.');
      } else {
        throw new Error(result.error || 'Unbekannter Fehler');
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      setMessage(`Fehler beim Senden der Test-E-Mail: ${error.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const createDefaultTemplates = async () => {
    setSaving(true);
    try {
      const defaultTemplates = [
        {
          id: 'order_confirmation_default',
          name: 'Bestellbestätigung',
          type: 'order_confirmation',
          subject: 'Ihre Bestellung #{orderId} wurde bestätigt - Brennholzkönig',
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background-color: #C04020; padding: 30px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🔥 Brennholzkönig</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Premium Brennholz aus Fulda</p>
              </div>
              <div style="padding: 40px 30px; background-color: #ffffff;">
                <h2 style="color: #1f2937; margin-bottom: 25px; font-size: 24px;">Hallo {customerName},</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin-bottom: 25px;">
                  vielen Dank für Ihre Bestellung! Wir haben Ihre Bestellung erhalten und bearbeiten sie umgehend.
                </p>
                <div style="background-color: #fef3c7; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                  <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">📋 Bestelldetails:</h3>
                  <div style="color: #1f2937; line-height: 1.6;">
                    <p style="margin: 8px 0;"><strong>Bestellnummer:</strong> {orderId}</p>
                    <p style="margin: 8px 0;"><strong>Bestelldatum:</strong> {orderDate}</p>
                    <p style="margin: 8px 0;"><strong>Gesamtbetrag:</strong> €{totalAmount}</p>
                  </div>
                </div>
                <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 25px 0;">
                  <h4 style="color: #15803d; margin-top: 0; margin-bottom: 15px;">✅ Nächste Schritte:</h4>
                  <ul style="color: #15803d; margin: 0; padding-left: 20px; line-height: 1.6;">
                    <li>Wir bereiten Ihre Bestellung vor</li>
                    <li>Sie erhalten eine E-Mail zur Lieferung</li>
                    <li>Lieferung erfolgt direkt zu Ihnen</li>
                  </ul>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://brennholzkoenig.de/konto/bestellungen" style="background: #C04020; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">📋 Bestellung verfolgen</a>
                </div>
              </div>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
                <p style="margin: 0;">Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
                <p style="margin: 5px 0 0;">Ihr Team vom Brennholzkönig</p>
              </div>
            </div>
          `,
          is_active: true,
        },
        {
          id: 'order_shipped_default',
          name: 'Versandbenachrichtigung',
          type: 'shipping_notification',
          subject: '🚚 Ihre Bestellung #{orderId} wurde versandt - Brennholzkönig',
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background-color: #C04020; padding: 30px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🚚 Brennholzkönig</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Ihr Brennholz ist unterwegs!</p>
              </div>
              <div style="padding: 40px 30px; background-color: #ffffff;">
                <h2 style="color: #1f2937; margin-bottom: 25px; font-size: 24px;">Hallo {customerName},</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin-bottom: 25px;">
                  📦 Gute Nachrichten! Ihre Bestellung wurde versandt und ist unterwegs zu Ihnen.
                </p>
                <div style="background: #dcfce7; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
                  <h3 style="color: #15803d; margin-top: 0; margin-bottom: 15px; font-size: 18px;">📋 Versanddetails</h3>
                  <div style="color: #15803d;">
                    <p style="margin: 8px 0;"><strong>Bestellnummer:</strong> {orderId}</p>
                    <p style="margin: 8px 0;"><strong>Sendungsverfolgung:</strong></p>
                    <div style="background: #16a34a; color: white; padding: 10px; border-radius: 6px; font-weight: bold; margin: 10px 0;">
                      {trackingNumber}
                    </div>
                  </div>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://brennholzkoenig.de/konto/bestellungen/{orderId}" style="background: #C04020; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 10px;">📦 Sendung verfolgen</a>
                  <a href="https://brennholzkoenig.de/shop" style="background: #6b7280; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">🔥 Nachbestellen</a>
                </div>
              </div>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
                <p style="margin: 0;">Vielen Dank für Ihr Vertrauen in Brennholzkönig!</p>
                <p style="margin: 5px 0 0;">Ihr Team vom Brennholzkönig</p>
              </div>
            </div>
          `,
          is_active: true,
        },
        {
          id: 'order_delivered_default',
          name: 'Lieferbestätigung',
          type: 'order_delivered',
          subject: '✅ Ihre Bestellung #{orderId} wurde zugestellt - Brennholzkönig',
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background-color: #16a34a; padding: 30px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">✅ Brennholzkönig</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Lieferung erfolgreich abgeschlossen!</p>
              </div>
              <div style="padding: 40px 30px; background-color: #ffffff;">
                <h2 style="color: #1f2937; margin-bottom: 25px; font-size: 24px;">Hallo {customerName},</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin-bottom: 25px;">
                  🎉 Ihr Premium Brennholz wurde erfolgreich zugestellt! Wir hoffen, Sie sind mit der Qualität zufrieden.
                </p>
                <div style="background: #dcfce7; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
                  <h3 style="color: #15803d; margin-top: 0; margin-bottom: 15px; font-size: 18px;">⭐ Bewerten Sie uns!</h3>
                  <p style="color: #15803d; margin-bottom: 20px;">Ihre Meinung ist uns wichtig. Teilen Sie Ihre Erfahrung mit anderen Kunden.</p>
                  <a href="https://brennholzkoenig.de/bewertung" style="background: #16a34a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">⭐ Jetzt bewerten</a>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://brennholzkoenig.de/shop" style="background: #C04020; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 10px;">🔥 Nachbestellen</a>
                  <a href="https://brennholzkoenig.de/kontakt" style="background: #6b7280; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">💬 Kontakt</a>
                </div>
              </div>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
                <p style="margin: 0;">Vielen Dank für Ihr Vertrauen in Brennholzkönig!</p>
                <p style="margin: 5px 0 0;">Ihr Team vom Brennholzkönig aus Fulda</p>
              </div>
            </div>
          `,
          is_active: true,
        },
      ];

      let successCount = 0;
      for (const template of defaultTemplates) {
        try {
          const { error } = await supabase
            .from('email_templates')
            .upsert(template);

          if (error) {
            console.error('Template creation error:', error);
            throw new Error(`Fehler beim Erstellen der Vorlage "${template.name}": ${error.message}`);
          }

          successCount++;
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.error(`Error creating template ${template.name}:`, err);
          throw err;
        }
      }

      await loadTemplates();
      setMessage(`✅ ${successCount} Standard-Vorlagen erfolgreich erstellt! Alle verwenden die globale SMTP-Konfiguration und sind sofort einsatzbereit.`);
      setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
      console.error('Fehler beim Erstellen der Vorlagen:', error);
      setMessage(`❌ Fehler beim Erstellen der Standard-Vorlagen: ${error.message}`);
      setTimeout(() => setMessage(''), 8000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C04020]"></div>
        <span className="ml-3 text-gray-600">Lade E-Mail-Vorlagen...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">E-Mail-Vorlagen</h2>
          <p className="text-gray-600 mt-1">Verwalten Sie die E-Mail-Vorlagen für automatische Benachrichtigungen</p>
        </div>
        <div className="flex space-x-3">
          {templates.length === 0 && (
            <button
              onClick={createDefaultTemplates}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Erstelle...
                </>
              ) : (
                <>
                  <i className="ri-add-line mr-2"></i>
                  Standard-Vorlagen erstellen
                </>
              )}
            </button>
          )}
          <button
            onClick={() => setShowNewTemplate(true)}
            className="bg-[#C04020] text-white px-4 py-2 rounded-lg hover:bg-[#A0351A] transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line mr-2"></i>
            Neue Vorlage
          </button>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium border ${message.includes('erfolgreich') || message.includes('✅')
          ? 'bg-green-50 text-green-800 border-green-200'
          : 'bg-red-50 text-red-800 border-red-200'
          }`}>
          <div className="flex items-start">
            <i className={`mr-2 mt-0.5 ${message.includes('erfolgreich') || message.includes('✅') ? 'ri-check-line' : 'ri-error-warning-line'}`}></i>
            <span>{message}</span>
          </div>
        </div>
      )}

      {/* Neue Vorlage erstellen Modal */}
      {showNewTemplate && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Neue E-Mail-Vorlage erstellen</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vorlagen-Name *
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. Bestellbestätigung"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vorlagen-Typ
                </label>
                <select
                  value={newTemplate.type}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="order_confirmation">Bestellbestätigung</option>
                  <option value="shipping_notification">Versandbenachrichtigung</option>
                  <option value="order_delivered">Lieferbestätigung</option>
                  <option value="welcome">Willkommen</option>
                  <option value="abandoned_cart">Abandoned Cart</option>
                  <option value="promotion">Promotion</option>
                  <option value="custom">Benutzerdefiniert</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-Mail-Betreff *
              </label>
              <input
                type="text"
                value={newTemplate.subject}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="z.B. Ihre Bestellung #{orderId} wurde bestätigt"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTML-Inhalt *
              </label>
              <textarea
                value={newTemplate.content}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="HTML-Inhalt der E-Mail..."
              />
              <div className="text-xs text-gray-500 mt-1">
                Verfügbare Platzhalter: {`{customerName}`}, {`{orderId}`}, {`{orderDate}`}, {`{totalAmount}`}, {`{trackingNumber}`}
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="new_active"
                checked={newTemplate.is_active}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="new_active" className="ml-2 text-sm text-gray-700">
                Vorlage aktiv
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowNewTemplate(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium cursor-pointer whitespace-nowrap"
            >
              Abbrechen
            </button>
            <button
              onClick={createNewTemplate}
              disabled={saving}
              className="bg-[#C04020] text-white px-6 py-2 rounded-lg hover:bg-[#A0351A] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              {saving ? 'Speichert...' : 'Vorlage erstellen'}
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vorlagen-Liste */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">E-Mail-Vorlagen ({templates.length})</h3>
          </div>

          <div className="divide-y divide-gray-200">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedTemplate?.id === template.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                onClick={() => {
                  setSelectedTemplate(template);
                  setIsEditing(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{template.subject}</p>
                    <div className="flex items-center mt-2 space-x-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {template.type}
                      </span>
                      {template.is_active && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                          Aktiv
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sendTestEmail(template);
                      }}
                      disabled={saving}
                      className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer disabled:opacity-50"
                    >
                      <i className="ri-send-plane-line mr-1"></i>
                      Test
                    </button>
                    <i className="ri-arrow-right-s-line text-gray-400"></i>
                  </div>
                </div>
              </div>
            ))}

            {templates.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <i className="ri-mail-line text-4xl mb-4"></i>
                <p>Noch keine E-Mail-Vorlagen vorhanden</p>
                <p className="text-sm mt-1">Erstellen Sie Standard-Vorlagen zum Starten</p>
              </div>
            )}
          </div>
        </div>

        {/* Vorlagen-Editor */}
        {selectedTemplate && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Vorlage bearbeiten</h3>
              <div className="flex items-center space-x-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-edit-line mr-1"></i>
                    Bearbeiten
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={saveTemplate}
                      disabled={saving}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <i className="ri-loader-4-line animate-spin mr-1"></i>
                          Speichern...
                        </>
                      ) : (
                        <>
                          <i className="ri-save-line mr-1"></i>
                          Speichern
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vorlagen-Name
                </label>
                <input
                  type="text"
                  value={selectedTemplate.name}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-Mail-Betreff
                </label>
                <input
                  type="text"
                  value={selectedTemplate.subject}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTML-Inhalt
                </label>
                <textarea
                  value={selectedTemplate.content}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, content: e.target.value })}
                  disabled={!isEditing}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm disabled:bg-gray-50"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={selectedTemplate.is_active}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, is_active: e.target.checked })}
                  disabled={!isEditing}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                  Vorlage aktiv
                </label>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Verfügbare Platzhalter:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><code>{`{customerName}`}</code> - Name des Kunden</p>
                  <p><code>{`{orderId}`}</code> - Bestellnummer</p>
                  <p><code>{`{orderDate}`}</code> - Bestelldatum</p>
                  <p><code>{`{totalAmount}`}</code> - Gesamtbetrag</p>
                  <p><code>{`{trackingNumber}`}</code> - Sendungsverfolgungsnummer</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => sendTestEmail(selectedTemplate)}
                  disabled={saving}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Sende Test-E-Mail...
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-line mr-2"></i>
                      Test-E-Mail senden
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
