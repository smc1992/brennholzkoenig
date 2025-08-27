
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface SMSTemplate {
  id: string;
  name: string;
  message: string;
  variables: string[];
  is_active: boolean;
}

export default function SMSSystemTab() {
  const [smsSettings, setSmsSettings] = useState<{
    provider: string;
    account_sid: string;
    auth_token: string;
    phone_number: string;
    is_enabled: boolean;
    notifications: {
      order_confirmed: boolean;
      order_shipped: boolean;
      order_delivered: boolean;
      payment_received: boolean;
      low_stock: boolean;
    };
  }>({
    provider: 'twilio',
    account_sid: '',
    auth_token: '',
    phone_number: '',
    is_enabled: false,
    notifications: {
      order_confirmed: true,
      order_shipped: true,
      order_delivered: false,
      payment_received: true,
      low_stock: false
    }
  });
  const [smsTemplates, setSmsTemplates] = useState<SMSTemplate[]>([]);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [smsLogs, setSmsLogs] = useState<Array<{
    id: string;
    to: string;
    message: string;
    status: string;
    timestamp: string;
    type: string;
  }>>([]);

  // Using the centralized Supabase client from lib/supabase.ts

  useEffect(() => {
    loadSMSSettings();
    loadSMSTemplates();
    loadSMSLogs();
  }, []);

  const loadSMSSettings = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'sms_settings')
        .single();

      if (data) {
        setSmsSettings(JSON.parse(data.setting_value));
      }
    } catch (error) {
      console.error('Error loading SMS settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSMSTemplates = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'sms_templates');

      const templates = data?.map(item => JSON.parse(item.setting_value)) || [];

      // Standard-Templates falls keine vorhanden
      if (templates.length === 0) {
        const defaultTemplates = [
          {
            id: 'order_confirmed',
            name: 'Bestellbestätigung',
            message: 'Hallo {customer_name}! Ihre Bestellung #{order_id} wurde erfolgreich aufgegeben. Gesamtbetrag: {total_amount}€. Vielen Dank für Ihren Einkauf bei Brennholzkönig!',
            variables: ['customer_name', 'order_id', 'total_amount'],
            is_active: true
          },
          {
            id: 'order_shipped',
            name: 'Versandbenachrichtigung',
            message: 'Ihre Brennholz-Bestellung #{order_id} ist unterwegs! Lieferung voraussichtlich am {delivery_date}. Brennholzkönig - Ihr Partner für Premium Brennholz.',
            variables: ['order_id', 'delivery_date'],
            is_active: true
          },
          {
            id: 'order_delivered',
            name: 'Lieferbestätigung',
            message: 'Ihre Brennholz-Bestellung #{order_id} wurde erfolgreich geliefert. Wir hoffen, Sie sind zufrieden! Bei Fragen: 0661 480 276 00. Brennholzkönig',
            variables: ['order_id'],
            is_active: false
          },
          {
            id: 'payment_received',
            name: 'Zahlungsbestätigung',
            message: 'Zahlungseingang bestätigt! Ihre Bestellung #{order_id} über {total_amount}€ wird bearbeitet. Brennholzkönig - Premium Brennholz direkt vom Produzenten.',
            variables: ['order_id', 'total_amount'],
            is_active: true
          }
        ];

        setSmsTemplates(defaultTemplates);

        // Standard-Templates speichern
        for (const template of defaultTemplates) {
          await supabase
            .from('app_settings')
            .insert({
              setting_type: 'sms_templates',
              setting_key: template.id,
              setting_value: JSON.stringify(template),
              updated_at: new Date().toISOString()
            });
        }
      } else {
        setSmsTemplates(templates);
      }
    } catch (error) {
      console.error('Error loading SMS templates:', error);
    }
  };

  const loadSMSLogs = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'sms_logs')
        .order('updated_at', { ascending: false })
        .limit(50);

      const logs = data?.map(item => JSON.parse(item.setting_value)) || [];
      setSmsLogs(logs);
    } catch (error) {
      console.error('Error loading SMS logs:', error);
    }
  };

  const saveSMSSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          setting_type: 'sms_settings',
          setting_key: 'config',
          setting_value: JSON.stringify(smsSettings),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setMessage('SMS-Einstellungen erfolgreich gespeichert!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving SMS settings:', error);
      setMessage('Fehler beim Speichern der Einstellungen');
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestSMS = async () => {
    if (!testPhoneNumber || !smsSettings.is_enabled) {
      setMessage('Bitte Telefonnummer eingeben und SMS-System aktivieren');
      return;
    }

    setIsTesting(true);
    try {
      // SMS über korrekte Supabase Edge Function senden
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: testPhoneNumber,
          message: 'Test-SMS von Brennholzkönig Admin-System. SMS-Integration funktioniert korrekt!',
          settings: smsSettings
        })
      });

      if (response.ok) {
        // Log speichern
        const logEntry = {
          id: Date.now().toString(),
          to: testPhoneNumber,
          message: 'Test-SMS',
          status: 'sent',
          timestamp: new Date().toISOString(),
          type: 'test'
        };

        await supabase
          .from('app_settings')
          .insert({
            setting_type: 'sms_logs',
            setting_key: logEntry.id,
            setting_value: JSON.stringify(logEntry),
            updated_at: new Date().toISOString()
          });

        setMessage('Test-SMS erfolgreich gesendet!');
        loadSMSLogs();
      } else {
        const errorData = await response.text();
        throw new Error(`SMS konnte nicht gesendet werden: ${errorData}`);
      }
    } catch (error: unknown) {
      console.error('Error sending test SMS:', error);
      setMessage('Fehler beim Senden der Test-SMS: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsTesting(false);
    }
  };

  const updateTemplate = async (templateId: string, updatedTemplate: SMSTemplate) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({
          setting_value: JSON.stringify(updatedTemplate),
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', templateId);

      if (error) throw error;

      setSmsTemplates(prev =>
        prev.map(t => t.id === templateId ? updatedTemplate : t)
      );

      setMessage('Template erfolgreich aktualisiert!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: unknown) {
      console.error('Error updating template:', error);
      setMessage('Fehler beim Aktualisieren des Templates');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-full mx-auto mb-4 animate-pulse">
          <i className="ri-message-line text-2xl text-purple-600"></i>
        </div>
        <p className="text-lg font-medium text-gray-700">Lade SMS-System...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 flex items-center justify-center bg-purple-100 rounded-full mr-3">
            <i className="ri-message-line text-purple-600"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">SMS-Benachrichtigungen</h2>
            <p className="text-gray-600">Automatische SMS für Bestellupdates und Kundenkommunikation</p>
          </div>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${message.includes('erfolgreich') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}
      </div>

      {/* SMS Provider Konfiguration */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">SMS-Provider Konfiguration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SMS-Provider</label>
            <select
              value={smsSettings.provider}
              onChange={(e) => setSmsSettings(prev => ({ ...prev, provider: e.target.value }))}
              className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
            >
              <option value="twilio">Twilio</option>
              <option value="vonage">Vonage (Nexmo)</option>
              <option value="messagebird">MessageBird</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={smsSettings.is_enabled}
                onChange={(e) => setSmsSettings(prev => ({ ...prev, is_enabled: e.target.checked }))}
                className="mr-3"
              />
              <span className="text-sm font-medium text-gray-700">
                SMS-System aktivieren
              </span>
            </label>
          </div>
        </div>

        {/* Twilio Konfiguration */}
        {smsSettings.provider === 'twilio' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account SID
              </label>
              <input
                type="text"
                value={smsSettings.account_sid}
                onChange={(e) => setSmsSettings(prev => ({ ...prev, account_sid: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auth Token
              </label>
              <input
                type="password"
                value={smsSettings.auth_token}
                onChange={(e) => setSmsSettings(prev => ({ ...prev, auth_token: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="********************************"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twilio Telefonnummer
              </label>
              <input
                type="text"
                value={smsSettings.phone_number}
                onChange={(e) => setSmsSettings(prev => ({ ...prev, phone_number: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="+49xxxxxxxxxx"
              />
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-6">
          <button
            onClick={saveSMSSettings}
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {isSaving ? 'Speichert...' : 'Einstellungen speichern'}
          </button>
        </div>
      </div>

      {/* SMS-Benachrichtigungen */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Automatische Benachrichtigungen</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              checked={smsSettings.notifications.order_confirmed}
              onChange={(e) => setSmsSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, order_confirmed: e.target.checked }
              }))}
              className="mr-3"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Bestellbestätigung</span>
              <p className="text-xs text-gray-500">SMS bei neuer Bestellung</p>
            </div>
          </label>

          <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              checked={smsSettings.notifications.order_shipped}
              onChange={(e) => setSmsSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, order_shipped: e.target.checked }
              }))}
              className="mr-3"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Versandbenachrichtigung</span>
              <p className="text-xs text-gray-500">SMS bei Versand</p>
            </div>
          </label>

          <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              checked={smsSettings.notifications.order_delivered}
              onChange={(e) => setSmsSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, order_delivered: e.target.checked }
              }))}
              className="mr-3"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Lieferbestätigung</span>
              <p className="text-xs text-gray-500">SMS bei erfolgreicher Lieferung</p>
            </div>
          </label>

          <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              checked={smsSettings.notifications.payment_received}
              onChange={(e) => setSmsSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, payment_received: e.target.checked }
              }))}
              className="mr-3"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Zahlungsbestätigung</span>
              <p className="text-xs text-gray-500">SMS bei Zahlungseingang</p>
            </div>
          </label>
        </div>
      </div>

      {/* Test-SMS */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Test-SMS senden</h3>

        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="tel"
              value={testPhoneNumber}
              onChange={(e) => setTestPhoneNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="+49xxxxxxxxxx"
            />
          </div>
          <button
            onClick={sendTestSMS}
            disabled={isTesting || !smsSettings.is_enabled}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {isTesting ? 'Sendet...' : 'Test-SMS senden'}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Format: +49 für Deutschland, z.B. +491234567890
        </p>
      </div>

      {/* SMS Templates */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">SMS-Templates</h3>

        <div className="space-y-4">
          {smsTemplates.map((template) => (
            <div key={template.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800">{template.name}</h4>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={template.is_active}
                    onChange={(e) => {
                      const updatedTemplate = { ...template, is_active: e.target.checked };
                      updateTemplate(template.id, updatedTemplate);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Aktiv</span>
                </label>
              </div>

              <textarea
                value={template.message}
                onChange={(e) => {
                  const updatedTemplate = { ...template, message: e.target.value };
                  setSmsTemplates(prev =>
                    prev.map(t => t.id === template.id ? updatedTemplate : t)
                  );
                }}
                onBlur={() => updateTemplate(template.id, template)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
              />

              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs text-gray-500">Verfügbare Variablen:</span>
                {template.variables.map((variable) => (
                  <span key={variable} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {`{${variable}}`}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SMS-Logs */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">SMS-Verlauf</h3>

        {smsLogs.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
              <i className="ri-message-line text-2xl text-gray-400"></i>
            </div>
            <p className="text-gray-500">Noch keine SMS versendet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Zeitpunkt</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Empfänger</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Typ</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {smsLogs.slice(0, 20).map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(log.timestamp).toLocaleString('de-DE')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{log.to}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${log.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {log.status === 'sent' ? 'Gesendet' : 'Fehler'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Setup-Anleitung */}
      <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center mb-4">
          <div className="w-6 h-6 flex items-center justify-center bg-purple-100 rounded-full mr-3">
            <i className="ri-information-line text-purple-600"></i>
          </div>
          <h4 className="font-bold text-purple-800">Twilio Setup-Anleitung</h4>
        </div>

        <div className="space-y-3 text-sm text-purple-700">
          <div className="flex items-start">
            <span className="bg-purple-200 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mr-3 mt-0.5">1</span>
            <div>
              <strong>Twilio Account erstellen:</strong>
              <p>Registrieren Sie sich bei twilio.com und verifizieren Sie Ihre Telefonnummer</p>
            </div>
          </div>

          <div className="flex items-start">
            <span className="bg-purple-200 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mr-3 mt-0.5">2</span>
            <div>
              <strong>SMS-Nummer kaufen:</strong>
              <p>Kaufen Sie eine deutsche Telefonnummer für den SMS-Versand</p>
            </div>
          </div>

          <div className="flex items-start">
            <span className="bg-purple-200 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mr-3 mt-0.5">3</span>
            <div>
              <strong>API-Daten kopieren:</strong>
              <p>Account SID und Auth Token aus dem Twilio Dashboard kopieren</p>
            </div>
          </div>

          <div className="flex items-start">
            <span className="bg-purple-200 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mr-3 mt-0.5">4</span>
            <div>
              <strong>Konfiguration testen:</strong>
              <p>Test-SMS senden um die Konfiguration zu überprüfen</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
