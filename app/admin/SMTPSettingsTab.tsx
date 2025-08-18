
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DKIMGenerator } from '@/lib/dkimGenerator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SMTPSettingsTab() {
  const [settings, setSettings] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_secure: 'true',
    smtp_username: '',
    smtp_password: '',
    smtp_from_email: '',
    smtp_from_name: 'Brennholz König',
    smtp_provider: 'custom',
    dkim_enabled: false,
    dkim_domain: '',
    dkim_selector: 'default',
    dkim_private_key: '',
    spf_record: '',
    dmarc_policy: 'none'
  });
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [validationResults, setValidationResults] = useState<any>({});
  const [deliverabilityScore, setDeliverabilityScore] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .eq('category', 'smtp');

      if (data) {
        const settingsObj: Record<string, any> = {};
        data.forEach(setting => {
          settingsObj[setting.key] = setting.value;
        });
        setSettings(prev => ({ ...prev, ...settingsObj }));
      }
    } catch (error) {
      console.error('Fehler beim Laden der SMTP-Einstellungen:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await supabase
          .from('app_settings')
          .upsert({
            category: 'smtp',
            key: key,
            value: value,
            updated_at: new Date().toISOString()
          });
      }
      alert('SMTP-Einstellungen erfolgreich gespeichert!');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der Einstellungen');
    }
    setLoading(false);
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      alert('Bitte geben Sie eine Test-E-Mail-Adresse ein');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: testEmail,
          subject: 'SMTP Test mit DKIM/SPF - Brennholz König',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #ea580c;">🔥 SMTP-Test erfolgreich!</h2>
              <p>Diese Test-E-Mail wurde erfolgreich über Ihre SMTP-Konfiguration mit E-Mail-Authentifizierung versendet.</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">📧 Authentifizierungsdetails:</h3>
                <p><strong>Zeitpunkt:</strong> ${new Date().toLocaleString('de-DE')}</p>
                <p><strong>DKIM-Signierung:</strong> ${settings.dkim_enabled ? '✅ Aktiviert' : '❌ Deaktiviert'}</p>
                <p><strong>SPF-Record:</strong> ${settings.spf_record ? '✅ Konfiguriert' : '❌ Nicht konfiguriert'}</p>
                <p><strong>DMARC-Policy:</strong> ${settings.dmarc_policy}</p>
              </div>
              
              <p style="color: #16a34a; font-weight: bold;">✅ Ihre SMTP-Einstellungen funktionieren korrekt!</p>
              <p style="color: #6b7280; font-size: 14px;">Diese E-Mail wurde automatisch generiert von Ihrem Brennholz König Admin-Dashboard.</p>
            </div>
          `,
          type: 'smtp_test'
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `Test-E-Mail erfolgreich versendet!\n\nZustellbarkeits-Score: ${
            result.authentication?.deliverability_score || 'N/A'
          }%\nDKIM: ${result.authentication?.dkim || 'N/A'}\nSPF: ${result.authentication?.spf || 'N/A'}`
        );
      } else {
        throw new Error(result.error || 'Unbekannter Fehler');
      }
    } catch (error: any) {
      console.error('Test-E-Mail Fehler:', error);
      alert(`Fehler beim Versenden der Test-E-Mail: ${error.message}`);
    }
    setLoading(false);
  };

  const handleProviderChange = (provider: string) => {
    setSettings(prev => {
      const newSettings = { ...prev, smtp_provider: provider };

      switch (provider) {
        case 'gmail':
          return {
            ...newSettings,
            smtp_host: 'smtp.gmail.com',
            smtp_port: '587',
            smtp_secure: 'true',
            spf_record: 'v=spf1 include:_spf.google.com ~all'
          };
        case 'outlook':
          return {
            ...newSettings,
            smtp_host: 'smtp-mail.outlook.com',
            smtp_port: '587',
            smtp_secure: 'true',
            spf_record: 'v=spf1 include:spf.protection.outlook.com ~all'
          };
        case 'yahoo':
          return {
            ...newSettings,
            smtp_host: 'smtp.mail.yahoo.com',
            smtp_port: '587',
            smtp_secure: 'true',
            spf_record: 'v=spf1 include:_spf.mail.yahoo.com ~all'
          };
        case '1and1':
          return {
            ...newSettings,
            smtp_host: 'smtp.1und1.de',
            smtp_port: '587',
            smtp_secure: 'true',
            spf_record: 'v=spf1 include:_spf.kundenserver.de ~all'
          };
        case 'strato':
          return {
            ...newSettings,
            smtp_host: 'smtp.strato.de',
            smtp_port: '465',
            smtp_secure: 'true',
            spf_record: 'v=spf1 include:_spf.strato.de ~all'
          };
        default:
          return newSettings;
      }
    });
  };

  const generateDKIMKeys = async () => {
    setLoading(true);
    try {
      const { privateKey, publicKey } = await DKIMGenerator.generateKeyPair();

      setSettings(prev => ({
        ...prev,
        dkim_private_key: privateKey,
        dkim_enabled: true
      }));

      alert(
        `DKIM-Schlüssel erfolgreich generiert!\n\nÖffentlicher Schlüssel für DNS:\n${publicKey}\n\nDer private Schlüssel wurde automatisch in die Konfiguration eingefügt.`
      );
    } catch (error) {
      console.error('DKIM Generation Error:', error);
      alert('Fehler beim Generieren der DKIM-Schlüssel');
    }
    setLoading(false);
  };

  const validateDNSRecords = async () => {
    if (!settings.smtp_from_email) {
      alert('Bitte geben Sie zuerst eine Absender-E-Mail ein');
      return;
    }

    setLoading(true);
    const domain = settings.smtp_from_email.split('@')[1];

    try {
      const [spfResult, dkimResult, dmarcResult] = await Promise.all([
        DKIMGenerator.validateSPFRecord(domain),
        settings.dkim_enabled
          ? DKIMGenerator.validateDKIMRecord(domain, settings.dkim_selector)
          : Promise.resolve(false),
        DKIMGenerator.validateDMARCRecord(domain)
      ]);

      const results = {
        spf: spfResult,
        dkim: { valid: dkimResult, enabled: settings.dkim_enabled },
        dmarc: dmarcResult,
        domain
      };

      setValidationResults(results);

      const scoreData = DKIMGenerator.calculateDeliverabilityScore(
        spfResult.valid,
        dkimResult,
        dmarcResult.valid,
        dmarcResult.policy || undefined
      );

      setDeliverabilityScore(scoreData);

      let message = `DNS-Validierung für ${domain} abgeschlossen:\n\n`;
      message += `✉️ SPF: ${spfResult.valid ? '✅ Gültig' : '❌ Nicht gefunden'}\n`;
      message += `🔐 DKIM: ${dkimResult ? '✅ Gültig' : '❌ Nicht gefunden/Deaktiviert'}\n`;
      message += `🛡️ DMARC: ${dmarcResult.valid ? '✅ Gültig' : '❌ Nicht gefunden'}\n\n`;
      message += `📊 Zustellbarkeits-Score: ${scoreData.score}% (${scoreData.rating})`;

      if (scoreData.recommendations.length > 0) {
        message += `\n\n💡 Empfehlungen:\n${scoreData.recommendations.join('\n')}`;
      }

      alert(message);
    } catch (error) {
      console.error('DNS Validation Error:', error);
      alert('Fehler bei der DNS-Validierung');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">SMTP E-Mail Einstellungen</h2>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'basic', label: 'Grundeinstellungen' },
              { id: 'auth', label: 'E-Mail-Authentifizierung' },
              { id: 'test', label: 'Test & Validierung' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 border-b-2 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Basic Settings Tab */}
        {activeTab === 'basic' && (
          <>
            {/* Provider Auswahl */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-Mail Anbieter
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'custom', name: 'Benutzerdefiniert' },
                  { key: 'gmail', name: 'Gmail' },
                  { key: 'outlook', name: 'Outlook' },
                  { key: 'yahoo', name: 'Yahoo' },
                  { key: '1and1', name: '1&1 IONOS' },
                  { key: 'strato', name: 'Strato' }
                ].map(provider => (
                  <button
                    key={provider.key}
                    onClick={() => handleProviderChange(provider.key)}
                    className={`p-3 text-sm border rounded-lg transition-colors cursor-pointer ${
                      settings.smtp_provider === provider.key
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {provider.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Server Einstellungen */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Server Einstellungen</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={settings.smtp_host}
                    onChange={e => setSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="smtp.beispiel.de"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port
                    </label>
                    <input
                      type="number"
                      value={settings.smtp_port}
                      onChange={e => setSettings(prev => ({ ...prev, smtp_port: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verschlüsselung
                    </label>
                    <select
                      value={settings.smtp_secure}
                      onChange={e => setSettings(prev => ({ ...prev, smtp_secure: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md pr-8 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="true">SSL/TLS</option>
                      <option value="false">Keine</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Anmeldedaten */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Anmeldedaten</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Benutzername / E-Mail
                  </label>
                  <input
                    type="email"
                    value={settings.smtp_username}
                    onChange={e => setSettings(prev => ({ ...prev, smtp_username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="ihre@email.de"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passwort
                  </label>
                  <input
                    type="password"
                    value={settings.smtp_password}
                    onChange={e => setSettings(prev => ({ ...prev, smtp_password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Absender Einstellungen */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-4">Absender Einstellungen</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Absender E-Mail
                  </label>
                  <input
                    type="email"
                    value={settings.smtp_from_email}
                    onChange={e => setSettings(prev => ({ ...prev, smtp_from_email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="noreply@brennholzkoenig.de"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Absender Name
                  </label>
                  <input
                    type="text"
                    value={settings.smtp_from_name}
                    onChange={e => setSettings(prev => ({ ...prev, smtp_from_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Brennholz König"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* E-Mail Authentication Tab */}
        {activeTab === 'auth' && (
          <div className="space-y-6">
            {/* SPF Record */}
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full mr-3">
                  <i className="ri-shield-check-line text-blue-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-blue-900">SPF (Sender Policy Framework)</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    SPF-Record für DNS
                  </label>
                  <input
                    type="text"
                    value={settings.spf_record}
                    onChange={e => setSettings(prev => ({ ...prev, spf_record: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="v=spf1 include:_spf.google.com ~all"
                  />
                  <p className="text-sm text-blue-700 mt-2">
                    Dieser SPF-Record muss in Ihren DNS-Einstellungen als TXT-Record hinzugefügt werden.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">DNS-Konfiguration:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Record-Typ:</strong> TXT</p>
                    <p><strong>Name:</strong> @ (oder Ihre Domain)</p>
                    <p><strong>Wert:</strong> {settings.spf_record || 'Noch nicht konfiguriert'}</p>
                    <p><strong>TTL:</strong> 3600</p>
                  </div>
                </div>
              </div>
            </div>

            {/* DKIM Configuration */}
            <div className="bg-green-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-full mr-3">
                  <i className="ri-key-2-line text-green-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-green-900">DKIM (DomainKeys Identified Mail)</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="dkim_enabled"
                    checked={settings.dkim_enabled}
                    onChange={e => setSettings(prev => ({ ...prev, dkim_enabled: e.target.checked }))}
                    className="mr-3"
                  />
                  <label htmlFor="dkim_enabled" className="text-sm font-medium text-green-900">
                    DKIM-Signierung aktivieren
                  </label>
                </div>

                {settings.dkim_enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-900 mb-2">
                        DKIM-Domain
                      </label>
                      <input
                        type="text"
                        value={settings.dkim_domain}
                        onChange={e => setSettings(prev => ({ ...prev, dkim_domain: e.target.value }))}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        placeholder="brennholzkoenig.de"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-green-900 mb-2">
                        DKIM-Selector
                      </label>
                      <input
                        type="text"
                        value={settings.dkim_selector}
                        onChange={e => setSettings(prev => ({ ...prev, dkim_selector: e.target.value }))}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        placeholder="default"
                      />
                    </div>
                  </div>
                )}

                {settings.dkim_enabled && (
                  <div>
                    <label className="block text-sm font-medium text-green-900 mb-2">
                      DKIM Private Key
                    </label>
                    <textarea
                      value={settings.dkim_private_key}
                      onChange={e => setSettings(prev => ({ ...prev, dkim_private_key: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="-----BEGIN RSA PRIVATE KEY-----"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={generateDKIMKeys}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm whitespace-nowrap"
                      >
                        Schlüssel generieren
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DMARC Policy */}
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 flex items-center justify-center bg-purple-100 rounded-full mr-3">
                  <i className="ri-shield-star-line text-purple-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-purple-900">DMARC (Domain-based Message Authentication)</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-900 mb-2">
                    DMARC-Policy
                  </label>
                  <select
                    value={settings.dmarc_policy}
                    onChange={e => setSettings(prev => ({ ...prev, dmarc_policy: e.target.value }))}
                    className="w-full px-3 py-2 border border-purple-300 rounded-md pr-8 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="none">none - Nur Monitoring</option>
                    <option value="quarantine">quarantine - Verdächtige E-Mails in Spam</option>
                    <option value="reject">reject - Verdächtige E-Mails ablehnen</option>
                  </select>
                </div>

                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-2">Empfohlener DMARC-Record:</h4>
                  <code className="text-sm text-purple-800 bg-purple-100 px-2 py-1 rounded block">
                    v=DMARC1; p={settings.dmarc_policy}; rua=mailto:dmarc@{settings.dkim_domain || 'ihre-domain.de'}
                  </code>
                  <p className="text-sm text-purple-700 mt-2">
                    Dieser Record sollte als TXT-Record für "_dmarc.ihre-domain.de" hinzugefügt werden.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test & Validation Tab */}
        {activeTab === 'test' && (
          <div className="space-y-6">
            {/* Test E-Mail */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-4">SMTP Test mit Authentifizierung</h3>

              <div className="flex gap-3">
                <input
                  type="email"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  placeholder="test@beispiel.de"
                />
                <button
                  onClick={sendTestEmail}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {loading ? 'Sende...' : 'Test senden'}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Testet SMTP-Konfiguration mit DKIM/SPF-Authentifizierung
              </p>
            </div>

            {/* DNS Validation */}
            <div className="bg-yellow-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-yellow-900">DNS-Records validieren</h3>
                <button
                  onClick={validateDNSRecords}
                  disabled={loading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {loading ? 'Prüfe...' : 'Alle prüfen'}
                </button>
              </div>

              {validationResults.domain && (
                <div className="bg-white rounded-lg p-4 border border-yellow-200 mb-4">
                  <h4 className="font-medium text-yellow-900 mb-3">
                    Validierungsergebnisse für {validationResults.domain}:
                  </h4>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-800">SPF-Record:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          validationResults.spf?.valid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {validationResults.spf?.valid ? 'Gültig' : 'Nicht gefunden'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-yellow-800">DKIM-Record:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          validationResults.dkim?.valid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {validationResults.dkim?.valid ? 'Gültig' : 'Nicht gefunden'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-yellow-800">DMARC-Record:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          validationResults.dmarc?.valid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {validationResults.dmarc?.valid
                          ? `Gültig (${validationResults.dmarc.policy})`
                          : 'Nicht gefunden'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {deliverabilityScore && (
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-yellow-900">Zustellbarkeits-Score</h4>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-900">
                        {deliverabilityScore.score}%
                      </div>
                      <div className="text-sm text-yellow-700">{deliverabilityScore.rating}</div>
                    </div>
                  </div>

                  {deliverabilityScore.recommendations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-yellow-200">
                      <h5 className="font-medium text-yellow-900 mb-2">Verbesserungen:</h5>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        {deliverabilityScore.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-yellow-600 mr-2">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Authentication Status */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-4">Aktuelle Authentifizierungseinstellungen</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">SPF-Record konfiguriert:</span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      settings.spf_record ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {settings.spf_record ? 'Ja' : 'Nein'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-700">DKIM-Signierung:</span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      settings.dkim_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {settings.dkim_enabled ? 'Aktiviert' : 'Deaktiviert'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-700">DMARC-Policy:</span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      settings.dmarc_policy !== 'none'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {settings.dmarc_policy}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Erwartete Zustellrate:</span>
                  <span className="text-gray-900 font-medium">
                    {settings.dkim_enabled && settings.spf_record
                      ? '95%+'
                      : settings.spf_record || settings.dkim_enabled
                      ? '80-90%'
                      : '60-70%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Speichern Button */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={saveSettings}
            disabled={loading}
            className="w-full md:w-auto px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 font-medium cursor-pointer whitespace-nowrap"
          >
            {loading ? 'Wird gespeichert...' : 'Einstellungen speichern'}
          </button>
        </div>
      </div>

      {/* Hilfe Sektion */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-3"> E-Mail-Authentifizierung Hinweise</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>SPF:</strong> Verhindert E-Mail-Spoofing und verbessert die Zustellbarkeit
          </p>
          <p>
            <strong>DKIM:</strong> Digitale Signatur bestätigt die Authentizität Ihrer E-Mails
          </p>
          <p>
            <strong>DMARC:</strong> Kombiniert SPF und DKIM für maximalen Schutz
          </p>
          <p>
            <strong>Wichtig:</strong> DNS-Änderungen können bis zu 24 Stunden dauern
          </p>
        </div>
      </div>
    </div>
  );
}
