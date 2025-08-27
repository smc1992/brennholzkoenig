
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface EmailTemplate {
  id: number;
  setting_name: string;
  setting_type: string;
  setting_value: string;
  template: any; // Parsed JSON from setting_value
}

interface EmailLogData {
  status: 'sent' | 'failed' | 'pending';
  subject: string;
  to: string;
  sent_at: string;
  type?: string;
}

interface EmailLog {
  id: number;
  setting_name: string;
  setting_type: string;
  setting_value: string;
  log_data: EmailLogData;
}

interface EmailSettings {
  smtp_host: string;
  smtp_port: string | number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
  dkim_private_key: string;
  dkim_selector: string;
}

export default function EmailSystemTab() {
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
    use_tls: true,
    dkim_private_key: '',
    dkim_selector: 'default'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [testing, setTesting] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [activeTab, setActiveTab] = useState('smtp');
  const [showPassword, setShowPassword] = useState(false);

  // Using the centralized Supabase client from lib/supabase.ts

  useEffect(() => {
    loadEmailSettings();
    loadEmailLogs();
  }, []);

  const loadEmailSettings = async () => {
    try {
      const { data: smtpData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'smtp_config')
        .single();

      if (smtpData) {
        const settings = JSON.parse(smtpData.setting_value);
        setEmailSettings(settings);
      }

      const { data: templatesData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'email_template');

      if (templatesData) {
        setEmailTemplates(templatesData.map(t => ({ 
          ...t,
          template: JSON.parse(t.setting_value)
        })));
      }

    } catch (error) {
      console.error('Error loading email settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailLogs = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'email_log')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (data) {
        const logs = data.map(log => ({ 
          ...log,
          log_data: JSON.parse(log.setting_value)
        }));
        setEmailLogs(logs);
      }
    } catch (error) {
      console.error('Error loading email logs:', error);
    }
  };

  const saveSmtpSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          setting_type: 'smtp_config',
          setting_key: 'main',
          setting_value: JSON.stringify(emailSettings),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      alert('SMTP-Einstellungen erfolgreich gespeichert!');
    } catch (error) {
      console.error('Error saving SMTP settings:', error);
      alert('Fehler beim Speichern der SMTP-Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  const testSmtpConnection = async () => {
    if (!testEmail) {
      alert('Bitte geben Sie eine Test-E-Mail-Adresse ein');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: testEmail,
          subject: 'SMTP Test von Brennholzkönig Admin',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #C04020;">SMTP-Test erfolgreich!</h2>
              <p>Diese Test-E-Mail wurde erfolgreich über Ihre SMTP-Konfiguration versendet.</p>
              <p><strong>Zeitpunkt:</strong> ${new Date().toLocaleString('de-DE')}</p>
              <p><strong>SMTP-Server:</strong> ${emailSettings.smtp_host}:${emailSettings.smtp_port}</p>
              <hr style="border: 1px solid #eee; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">
                Diese E-Mail wurde automatisch vom Brennholzkönig Admin-System generiert.
              </p>
            </div>
          `,
          test_mode: true,
          smtp_settings: emailSettings
        })
      });

      if (response.ok) {
        alert(`Test-E-Mail erfolgreich an ${testEmail} gesendet!`);
        loadEmailLogs(); 
      } else {
        const errorData = await response.text();
        throw new Error(`SMTP-Test fehlgeschlagen: ${errorData}`);
      }
    } catch (error) {
      console.error('SMTP test error:', error);
      alert('SMTP-Test fehlgeschlagen. Überprüfen Sie Ihre Einstellungen.');
    } finally {
      setTesting(false);
    }
  };

  const getSmtpPresets = () => [
    {
      name: 'Gmail',
      host: 'smtp.gmail.com',
      port: '587',
      secure: false,
      info: 'Benötigt App-Passwort bei 2FA'
    },
    {
      name: 'Outlook/Hotmail',
      host: 'smtp-mail.outlook.com',
      port: '587',
      secure: false,
      info: 'Microsoft-Konto erforderlich'
    },
    {
      name: 'Yahoo',
      host: 'smtp.mail.yahoo.com',
      port: '587',
      secure: false,
      info: 'App-Passwort erforderlich'
    },
    {
      name: '1&1 IONOS',
      host: 'smtp.ionos.de',
      port: '587',
      secure: false,
      info: 'Beliebter deutscher Anbieter'
    },
    {
      name: 'Strato',
      host: 'smtp.strato.de',
      port: '587',
      secure: false,
      info: 'Deutscher Hosting-Anbieter'
    }
  ];

  interface SmtpPreset {
    name: string;
    host: string;
    port: string | number;
    secure: boolean;
    info: string;
  }

  const applySmtpPreset = (preset: SmtpPreset) => {
    setEmailSettings(prev => ({ 
      ...prev,
      smtp_host: preset.host,
      smtp_port: preset.port,
      use_tls: preset.secure
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
          <i className="ri-mail-send-line text-2xl text-white"></i>
        </div>
        <p className="text-lg font-medium text-gray-700">Lade E-Mail-System...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">E-Mail-System</h2>
            <p className="text-gray-600">SMTP-Konfiguration und E-Mail-Verwaltung</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${ 
              emailSettings.smtp_host ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {emailSettings.smtp_host ? 'SMTP konfiguriert' : 'SMTP nicht konfiguriert'}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'smtp', label: 'SMTP-Konfiguration', icon: 'ri-settings-3-line' },
              { id: 'templates', label: 'E-Mail-Templates', icon: 'ri-file-text-line' },
              { id: 'logs', label: 'E-Mail-Protokoll', icon: 'ri-history-line' },
              { id: 'test', label: 'Test-Center', icon: 'ri-test-tube-line' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 border-b-2 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap ${ 
                  activeTab === tab.id
                    ? 'border-[#C04020] text-[#C04020]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center mr-2 inline-block">
                  <i className={tab.icon}></i>
                </div>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* SMTP Configuration */}
          {activeTab === 'smtp' && (
            <div className="space-y-6">
              {/* SMTP Presets */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-3">
                  <i className="ri-magic-line mr-2"></i>
                  Schnell-Konfiguration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getSmtpPresets().map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => applySmtpPreset(preset)}
                      className="text-left p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <div className="font-medium text-blue-900">{preset.name}</div>
                      <div className="text-xs text-blue-600 mt-1">{preset.info}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* SMTP Form */}
              <form onSubmit={(e) => { e.preventDefault(); saveSmtpSettings(); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      SMTP-Server *
                    </label>
                    <input
                      type="text"
                      value={emailSettings.smtp_host}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                      placeholder="smtp.gmail.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Port *
                    </label>
                    <select
                      value={emailSettings.smtp_port}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_port: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] cursor-pointer pr-8"
                    >
                      <option value="587">587 (STARTTLS)</option>
                      <option value="465">465 (SSL)</option>
                      <option value="25">25 (Unverschlüsselt)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Benutzername/E-Mail *
                    </label>
                    <input
                      type="email"
                      value={emailSettings.smtp_username}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_username: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                      placeholder="ihre-email@domain.de"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Passwort *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={emailSettings.smtp_password}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_password: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-[#C04020]"
                        placeholder="Ihr SMTP-Passwort"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                      >
                        <div className="w-5 h-5 flex items-center justify-center text-gray-400">
                          <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Absender-E-Mail *
                    </label>
                    <input
                      type="email"
                      value={emailSettings.from_email}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, from_email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                      placeholder="noreply@brennholzkoenig.de"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Absender-Name
                    </label>
                    <input
                      type="text"
                      value={emailSettings.from_name}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, from_name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                      placeholder="Brennholzkönig"
                    />
                  </div>
                </div>

                {/* SSL/TLS Option */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="secure"
                    checked={emailSettings.use_tls}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, use_tls: e.target.checked }))}
                    className="mr-3"
                  />
                  <label htmlFor="secure" className="text-sm font-medium text-gray-700">
                    SSL/TLS-Verschlüsselung verwenden (nur bei Port 465)
                  </label>
                </div>

                {/* Save Button */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${ 
                      saving ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {saving ? (
                      <>
                        <i className="ri-loader-4-line mr-2 animate-spin"></i>
                        Speichere...
                      </>
                    ) : (
                      <>
                        <i className="ri-save-line mr-2"></i>
                        SMTP-Einstellungen speichern
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Security Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="w-5 h-5 flex items-center justify-center mr-3 text-yellow-600 mt-0.5">
                    <i className="ri-shield-line"></i>
                  </div>
                  <div className="text-yellow-800">
                    <h4 className="font-bold mb-2">Sicherheitshinweise:</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Verwenden Sie bei Gmail und anderen Anbietern App-Passwörter statt normaler Passwörter</li>
                      <li>Aktivieren Sie 2-Faktor-Authentifizierung bei Ihrem E-Mail-Anbieter</li>
                      <li>Nutzen Sie möglichst verschlüsselte Verbindungen (STARTTLS oder SSL)</li>
                      <li>Die Passwörter werden verschlüsselt in der Datenbank gespeichert</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Test Center */}
          {activeTab === 'test' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-bold text-green-900 mb-3">
                  <i className="ri-test-tube-line mr-2"></i>
                  SMTP-Verbindung testen
                </h3>
                <p className="text-green-800 text-sm mb-4">
                  Senden Sie eine Test-E-Mail, um Ihre SMTP-Konfiguration zu überprüfen.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-green-900 mb-2">
                      Test-E-Mail-Adresse
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="flex-1 border border-green-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                        placeholder="test@example.com"
                      />
                      <button
                        onClick={testSmtpConnection}
                        disabled={testing || !emailSettings.smtp_host || !testEmail}
                        className={`bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${ 
                          testing || !emailSettings.smtp_host || !testEmail ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {testing ? (
                          <>
                            <i className="ri-loader-4-line mr-2 animate-spin"></i>
                            Sende...
                          </>
                        ) : (
                          <>
                            <i className="ri-send-plane-line mr-2"></i>
                            Test senden
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {!emailSettings.smtp_host && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm">
                        <i className="ri-error-warning-line mr-2"></i>
                        Bitte konfigurieren Sie zuerst Ihre SMTP-Einstellungen.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Current SMTP Status */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">Aktuelle SMTP-Konfiguration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Server:</span>
                    <span className="ml-2 font-medium">{emailSettings.smtp_host || 'Nicht konfiguriert'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Port:</span>
                    <span className="ml-2 font-medium">{emailSettings.smtp_port}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Benutzername:</span>
                    <span className="ml-2 font-medium">{emailSettings.smtp_username || 'Nicht konfiguriert'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Absender:</span>
                    <span className="ml-2 font-medium">{emailSettings.from_email || 'Nicht konfiguriert'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Verschlüsselung:</span>
                    <span className="ml-2 font-medium">
                      {emailSettings.use_tls ? 'SSL/TLS' : 'STARTTLS'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 font-medium ${ 
                      emailSettings.smtp_host ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {emailSettings.smtp_host ? 'Konfiguriert' : 'Nicht konfiguriert'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">E-Mail-Protokoll</h3>
                <button
                  onClick={loadEmailLogs}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-refresh-line mr-2"></i>
                  Aktualisieren
                </button>
              </div>

              {emailLogs.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded-full mx-auto mb-4">
                    <i className="ri-mail-line text-2xl text-gray-400"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Keine E-Mails versendet</h3>
                  <p className="text-gray-500">E-Mail-Protokolle werden hier angezeigt, sobald E-Mails versendet wurden.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emailLogs.map((log, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${ 
                              log.log_data.status === 'sent' ? 'bg-green-100 text-green-800' : 
                              log.log_data.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {log.log_data.status === 'sent' ? 'Gesendet' : 
                               log.log_data.status === 'failed' ? 'Fehlgeschlagen' : 'Ausstehend'}
                            </span>
                            <span className="font-medium text-gray-900">{log.log_data.subject}</span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            An: {log.log_data.to} • {new Date(log.log_data.sent_at).toLocaleString('de-DE')}
                          </div>
                          {log.log_data.type && (
                            <div className="text-xs text-gray-500 mt-1">
                              Typ: {log.log_data.type}
                            </div>
                          )}
                        </div>
                        <div className="w-6 h-6 flex items-center justify-center text-gray-400">
                          <i className={`ri-${log.log_data.status === 'sent' ? 'check' : log.log_data.status === 'failed' ? 'close' : 'time'}-line`}></i>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Email Templates */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">E-Mail-Templates</h3>
                <button className="bg-[#C04020] hover:bg-[#A03318] text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap">
                  <i className="ri-add-line mr-2"></i>
                  Template hinzufügen
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-lg">
                      <i className="ri-check-line text-green-600"></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Bestellbestätigung</h4>
                      <p className="text-sm text-gray-600">Automatisch nach Bestellung</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">
                      Aktiv
                    </span>
                    <button className="text-blue-600 hover:text-blue-800 cursor-pointer">
                      <i className="ri-edit-line"></i>
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
                      <i className="ri-truck-line text-blue-600"></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Versandbenachrichtigung</h4>
                      <p className="text-sm text-gray-600">Bei Statusänderung zu "Versendet"</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800">
                      Entwurf
                    </span>
                    <button className="text-blue-600 hover:text-blue-800 cursor-pointer">
                      <i className="ri-edit-line"></i>
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-red-100 rounded-lg">
                      <i className="ri-alert-line text-red-600"></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Lagerwarnung</h4>
                      <p className="text-sm text-gray-600">Bei niedrigem Lagerbestand</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">
                      Aktiv
                    </span>
                    <button className="text-blue-600 hover:text-blue-800 cursor-pointer">
                      <i className="ri-edit-line"></i>
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-lg">
                      <i className="ri-heart-line text-purple-600"></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Newsletter</h4>
                      <p className="text-sm text-gray-600">Marketing-E-Mails</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800">
                      Inaktiv
                    </span>
                    <button className="text-blue-600 hover:text-blue-800 cursor-pointer">
                      <i className="ri-edit-line"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
