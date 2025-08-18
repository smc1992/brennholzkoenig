
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface EmailTemplate {
  id: string;
  name: string;
  type: 'welcome' | 'abandoned_cart' | 'follow_up' | 'newsletter' | 'order_reminder';
  subject: string;
  content: string;
  delay_hours?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  template_id: string;
  trigger_type: 'cart_abandonment' | 'new_customer' | 'post_purchase' | 'manual';
  trigger_delay: number;
  is_active: boolean;
  sent_count: number;
  open_count: number;
  click_count: number;
  created_at: string;
}

export default function EmailAutomationTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [activeTab, setActiveTab] = useState('templates');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'abandoned_cart' as const,
    subject: '',
    content: '',
    delay_hours: 2,
    is_active: true
  });
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    template_id: '',
    trigger_type: 'cart_abandonment' as const,
    trigger_delay: 2,
    is_active: true
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadEmailData();
  }, []);

  const loadEmailData = async () => {
    try {
      setLoading(true);

      const { data: templatesData, error: templatesError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'email_template')
        .order('created_at', { ascending: false });

      if (templatesError) {
        console.error('Templates error:', templatesError);
      }

      const parsedTemplates = templatesData?.map(item => ({
        id: item.setting_key,
        ...JSON.parse(item.setting_value),
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || [];

      setTemplates(parsedTemplates);

      const { data: campaignData, error: campaignError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'email_campaign')
        .order('created_at', { ascending: false });

      if (campaignError) {
        console.error('Campaigns error:', campaignError);
      }

      const parsedCampaigns = campaignData?.map(item => ({
        id: item.setting_key,
        ...JSON.parse(item.setting_value),
        created_at: item.created_at
      })) || [];

      setCampaigns(parsedCampaigns);

      setMessage('');
    } catch (error) {
      console.error('Error loading email data:', error);
      setMessage('Fehler beim Laden der E-Mail-Daten. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) {
      setMessage('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    setLoading(true);
    try {
      const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const templateData = {
        ...newTemplate,
        id: templateId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('app_settings')
        .insert({
          setting_type: 'email_template',
          setting_key: templateId,
          setting_value: JSON.stringify(templateData),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Insert error:', error);
        throw new Error(`Fehler beim Speichern: ${error.message}`);
      }

      await loadEmailData();
      setShowNewTemplate(false);
      setNewTemplate({
        name: '',
        type: 'abandoned_cart',
        subject: '',
        content: '',
        delay_hours: 2,
        is_active: true
      });
      setMessage('E-Mail-Template erfolgreich erstellt!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving template:', error);
      setMessage(`Fehler beim Speichern: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveCampaign = async () => {
    if (!newCampaign.name || !newCampaign.template_id) {
      setMessage('Bitte Name und Template auswählen');
      return;
    }

    setLoading(true);
    try {
      const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const campaignData = {
        ...newCampaign,
        id: campaignId,
        sent_count: 0,
        open_count: 0,
        click_count: 0,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('app_settings')
        .insert({
          setting_type: 'email_campaign',
          setting_key: campaignId,
          setting_value: JSON.stringify(campaignData),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Insert error:', error);
        throw new Error(`Fehler beim Speichern: ${error.message}`);
      }

      await loadEmailData();
      setShowNewCampaign(false);
      setNewCampaign({
        name: '',
        template_id: '',
        trigger_type: 'cart_abandonment',
        trigger_delay: 2,
        is_active: true
      });
      setMessage('E-Mail-Kampagne erfolgreich erstellt!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      setMessage(`Fehler beim Speichern: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async (templateId: string) => {
    setLoading(true);
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        setMessage('Template nicht gefunden');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: 'admin@brennholzkoenig.de',
          subject: `[TEST] ${template.subject}`,
          html: template.content
            .replace(/{{customer_name}}/g, 'Max Mustermann')
            .replace(/{{cart_items}}/g, '3x Premium Brennholz Buche (25cm)')
            .replace(/{{cart_total}}/g, '€299,50')
            .replace(/{{order_number}}/g, 'BHK-12345678'),
          template_type: 'test_automation'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        setMessage('Test-E-Mail erfolgreich gesendet! Prüfen Sie Ihr Postfach.');
      } else {
        throw new Error(result.error || 'Unbekannter Fehler beim E-Mail-Versand');
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      setMessage(`Fehler beim Senden der Test-E-Mail: ${error.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const triggerCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const template = templates.find(t => t.id === campaign.template_id);
    if (!template) {
      setMessage('Template für Kampagne nicht gefunden');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: 'admin@brennholzkoenig.de',
          subject: `[KAMPAGNE] ${template.subject}`,
          html: template.content
            .replace(/{{customer_name}}/g, 'Test Kunde')
            .replace(/{{cart_items}}/g, 'Demo Produkte')
            .replace(/{{cart_total}}/g, '€199,99')
            .replace(/{{order_number}}/g, 'DEMO-12345'),
          template_type: 'campaign_test'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        const updatedCampaign = {
          ...campaign,
          sent_count: campaign.sent_count + 1
        };

        await supabase
          .from('app_settings')
          .update({
            setting_value: JSON.stringify(updatedCampaign),
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', campaignId);

        await loadEmailData();
        setMessage(`Kampagne "${campaign.name}" erfolgreich ausgeführt!`);
      } else {
        throw new Error(result.error || 'Kampagne konnte nicht ausgeführt werden');
      }
    } catch (error: any) {
      console.error('Error triggering campaign:', error);
      setMessage(`Fehler beim Ausführen der Kampagne: ${error.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const toggleTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setLoading(true);
    try {
      const updatedTemplate = { 
        ...template, 
        is_active: !template.is_active,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('app_settings')
        .update({
          setting_value: JSON.stringify(updatedTemplate),
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', templateId);

      if (error) throw error;

      await loadEmailData();
      setMessage(`Template ${updatedTemplate.is_active ? 'aktiviert' : 'deaktiviert'}!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error toggling template:', error);
      setMessage('Fehler beim Ändern des Templates');
    } finally {
      setLoading(false);
    }
  };

  const toggleCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    setLoading(true);
    try {
      const updatedCampaign = { 
        ...campaign, 
        is_active: !campaign.is_active 
      };

      const { error } = await supabase
        .from('app_settings')
        .update({
          setting_value: JSON.stringify(updatedCampaign),
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', campaignId);

      if (error) throw error;

      await loadEmailData();
      setMessage(`Kampagne ${updatedCampaign.is_active ? 'aktiviert' : 'deaktiviert'}!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error toggling campaign:', error);
      setMessage('Fehler beim Ändern der Kampagne');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTemplates = async () => {
    setLoading(true);
    try {
      const defaultTemplates = [
        {
          name: 'Warenkorbabbrecher - 2 Stunden',
          type: 'abandoned_cart',
          subject: '🔥 Ihr Brennholz wartet noch auf Sie!',
          content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background: #C04020; color: white; padding: 30px 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🔥 Brennholzkönig</h1>
                <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Premium Brennholz aus Fulda</p>
              </div>
              <div style="padding: 40px 30px; background: #ffffff;">
                <h2 style="color: #1A1A1A; margin-bottom: 25px; font-size: 24px;">Hallo {{customer_name}},</h2>
                <p style="color: #4b5563; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">Sie haben hochwertiges Brennholz in Ihren Warenkorb gelegt, aber Ihre Bestellung noch nicht abgeschlossen. Lassen Sie sich diese Gelegenheit nicht entgehen!</p>
                <div style="background: #fef3c7; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                  <h3 style="color: #92400e; margin-top: 0; margin-bottom: 15px; font-size: 18px;">🛒 Ihre Auswahl:</h3>
                  <p style="margin: 0 0 10px; font-weight: 600; color: #1f2937;">{{cart_items}}</p>
                  <p style="margin: 0; font-size: 20px; font-weight: bold; color: #C04020;">Gesamtpreis: {{cart_total}}</p>
                </div>
                <div style="text-align: center; margin-bottom: 30px;">
                  <a href="https://brennholzkoenig.de/warenkorb" style="background: #C04020; color: white; padding: 18px 35px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 16px; transition: all 0.3s;">🛒 Bestellung jetzt abschließen</a>
                </div>
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 30px;">
                  <h4 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">⚡ Warum Brennholzkönig?</h4>
                  <ul style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.6;">
                    <li>🌟 Premium Qualität - nur 18-20% Restfeuchte</li>
                    <li>🚚 Kostenlose Lieferung ab 199€</li>
                    <li>⏰ 24h Express-Lieferung verfügbar</li>
                    <li>🔥 Optimaler Brennwert - lange Brenndauer</li>
                  </ul>
                </div>
              </div>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
                <p style="margin: 0;">Diese E-Mail wurde automatisch generiert. Bei Fragen kontaktieren Sie uns gerne.</p>
                <p style="margin: 5px 0 0;">Brennholzkönig - Ihr Partner für Premium Brennholz</p>
              </div>
            </div>`,
          delay_hours: 2,
          is_active: true
        },
        {
          name: 'Willkommen Neukunde',
          type: 'welcome',
          subject: '🌟 Willkommen bei Brennholzkönig - Ihr 10% Willkommensrabatt!',
          content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background: #C04020; color: white; padding: 30px 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎉 Willkommen bei Brennholzkönig!</h1>
                <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Premium Brennholz aus Fulda</p>
              </div>
              <div style="padding: 40px 30px; background: #ffffff;">
                <h2 style="color: #1A1A1A; margin-bottom: 25px; font-size: 24px;">Hallo {{customer_name}},</h2>
                <p style="color: #4b5563; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">herzlich willkommen bei Brennholzkönig! Wir freuen uns sehr, dass Sie sich für unser Premium Brennholz entschieden haben.</p>
                <div style="background: #dcfce7; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid #16a34a; text-align: center;">
                  <h3 style="color: #15803d; margin-top: 0; margin-bottom: 15px; font-size: 20px;">🎁 Ihr Willkommensgeschenk!</h3>
                  <div style="background: #16a34a; color: white; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; margin: 15px 0;">
                    Code: WILLKOMMEN10 - 10% Rabatt
                  </div>
                  <p style="color: #15803d; margin: 10px 0 0; font-size: 14px;">Gültig für Ihre nächste Bestellung ab 199€</p>
                </div>
                <div style="text-align: center; margin-bottom: 30px;">
                  <a href="https://brennholzkoenig.de/shop" style="background: #C04020; color: white; padding: 18px 35px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 16px; margin-right: 15px;">🛒 Jetzt einkaufen</a>
                  <a href="https://brennholzkoenig.de/ueber-uns" style="background: #6b7280; color: white; padding: 18px 35px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 16px;">ℹ️ Über uns</a>
                </div>
              </div>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
                <p style="margin: 0;">Vielen Dank für Ihr Vertrauen in Brennholzkönig!</p>
                <p style="margin: 5px 0 0;">Ihr Team vom Brennholzkönig aus Fulda</p>
              </div>
            </div>`,
          delay_hours: 1,
          is_active: true
        },
        {
          name: 'Nachfassung - 7 Tage nach Kauf',
          type: 'follow_up',
          subject: '🔥 Wie zufrieden sind Sie mit Ihrem Brennholz?',
          content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background: #C04020; color: white; padding: 30px 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: bold;">💬 Brennholzkönig</h1>
                <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Ihre Meinung ist uns wichtig</p>
              </div>
              <div style="padding: 40px 30px; background: #ffffff;">
                <h2 style="color: #1A1A1A; margin-bottom: 25px; font-size: 24px;">Hallo {{customer_name}},</h2>
                <p style="color: #4b5563; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">vor einer Woche haben Sie Brennholz bei uns bestellt (Bestellung {{order_number}}). Wir hoffen, Sie sind rundum zufrieden mit der Qualität und unserem Service!</p>
                <div style="background: #dbeafe; padding: 25px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
                  <h3 style="color: #1d4ed8; margin-top: 0; margin-bottom: 20px; font-size: 20px;">⭐ Bewerten Sie Ihren Einkauf</h3>
                  <p style="color: #1e40af; margin-bottom: 20px;">Ihre Bewertung hilft anderen Kunden und uns dabei, unseren Service stetig zu verbessern.</p>
                  <a href="https://brennholzkoenig.de/bewertung" style="background: #1d4ed8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">⭐ Jetzt bewerten</a>
                </div>
                <div style="text-align: center;">
                  <a href="https://brennholzkoenig.de/shop" style="background: #C04020; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">🔥 Nachbestellen</a>
                </div>
              </div>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
                <p style="margin: 0;">Vielen Dank für Ihr Vertrauen in Brennholzkönig!</p>
                <p style="margin: 5px 0 0;">Bei Fragen sind wir gerne für Sie da.</p>
              </div>
            </div>`,
          delay_hours: 168,
          is_active: true
        }
      ];

      let successCount = 0;
      for (const template of defaultTemplates) {
        const templateId = `email_auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const templateData = {
          ...template,
          id: templateId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('app_settings')
          .insert({
            setting_type: 'email_template',
            setting_key: templateId,
            setting_value: JSON.stringify(templateData),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Template creation error:', error);
          throw new Error(`Fehler beim Erstellen des Templates "${template.name}": ${error.message}`);
        }

        successCount++;
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      await loadEmailData();
      setMessage(`✅ ${successCount} Standard-Templates erfolgreich erstellt! Alle verwenden die globale SMTP-Konfiguration und sind sofort einsatzbereit.`);
      setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
      console.error('Error creating default templates:', error);
      setMessage(`❌ Fehler beim Erstellen der Standard-Templates: ${error.message}`);
      setTimeout(() => setMessage(''), 8000);
    } finally {
      setLoading(false);
    }
  };

  if (loading && templates.length === 0 && campaigns.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C04020]"></div>
            <span className="ml-3 text-gray-600">Lade E-Mail-Automatisierung...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full mr-3">
              <i className="ri-mail-line text-blue-600"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">E-Mail-Automatisierung</h2>
              <p className="text-gray-600">Automatische E-Mail-Kampagnen für Kundenbindung</p>
            </div>
          </div>
          {templates.length === 0 && (
            <button
              onClick={createDefaultTemplates}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Erstelle Templates...
                </>
              ) : (
                <>
                  <i className="ri-add-line mr-2"></i>
                  Standard-Templates erstellen
                </>
              )}
            </button>
          )}
        </div>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium border ${message.includes('erfolgreich') || message.includes('✅')
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'
            }`}>
            <div className="flex items-start">
              <i className={`mr-2 mt-0.5 ${message.includes('erfolgreich') || message.includes('✅') ? 'ri-check-line' : 'ri-error-warning-line'}`}></i>
              <span>{message}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">E-Mail Templates</p>
                <p className="text-2xl font-bold text-blue-800">{templates.length}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
                <i className="ri-file-text-line text-blue-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Aktive Kampagnen</p>
                <p className="text-2xl font-bold text-green-800">{campaigns.filter(c => c.is_active).length}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-lg">
                <i className="ri-rocket-line text-green-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Gesendete E-Mails</p>
                <p className="text-2xl font-bold text-purple-800">{campaigns.reduce((acc, c) => acc + c.sent_count, 0)}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-lg">
                <i className="ri-send-plane-line text-purple-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Öffnungsrate</p>
                <p className="text-2xl font-bold text-orange-800">
                  {campaigns.length > 0
                    ? Math.round((campaigns.reduce((acc, c) => acc + c.open_count, 0) /
                      Math.max(campaigns.reduce((acc, c) => acc + c.sent_count, 0), 1)) * 100)
                    : 0}%
                </p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-orange-100 rounded-lg">
                <i className="ri-eye-line text-orange-600"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="ri-file-text-line mr-2"></i>
              E-Mail Templates ({templates.length})
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${activeTab === 'campaigns'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="ri-rocket-line mr-2"></i>
              Automatisierte Kampagnen ({campaigns.length})
            </button>
          </nav>
        </div>

        {activeTab === 'templates' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#1A1A1A]">E-Mail Templates verwalten</h3>
              <button
                onClick={() => setShowNewTemplate(true)}
                disabled={loading}
                className="bg-[#C04020] hover:bg-[#A03318] text-white px-4 py-2 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <i className="ri-add-line mr-2"></i>
                Neues Template
              </button>
            </div>

            {showNewTemplate && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-bold text-[#1A1A1A] mb-4">Neues E-Mail Template erstellen</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Template Name *</label>
                      <input
                        type="text"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="z.B. Warenkorbabbrecher - 2 Stunden"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Template Typ</label>
                      <select
                        value={newTemplate.type}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="abandoned_cart">Warenkorbabbrecher</option>
                        <option value="welcome">Willkommen</option>
                        <option value="follow_up">Nachfassung</option>
                        <option value="newsletter">Newsletter</option>
                        <option value="order_reminder">Bestellerinnerung</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-Mail Betreff *</label>
                    <input
                      type="text"
                      value={newTemplate.subject}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="z.B. 🔥 Ihr Brennholz wartet noch auf Sie!"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-Mail Inhalt (HTML) *</label>
                    <textarea
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                      rows={12}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="HTML-Inhalt der E-Mail..."
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Verfügbare Platzhalter: {'{'}customer_name{'}'}, {'{'}cart_items{'}'}, {'{'}cart_total{'}'}, {'{'}order_number{'}'}
                    </div>
                  </div>

                  {newTemplate.type === 'abandoned_cart' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Verzögerung (Stunden)</label>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={newTemplate.delay_hours}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, delay_hours: parseInt(e.target.value) || 2 }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowNewTemplate(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium cursor-pointer whitespace-nowrap"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={saveTemplate}
                      disabled={loading}
                      className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-2 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      {loading ? 'Speichert...' : 'Template erstellen'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {templates.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                  <i className="ri-file-text-line text-2xl text-gray-400"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">Noch keine E-Mail Templates</h3>
                <p className="text-gray-500 mb-4">Erstellen Sie Templates für automatisierte E-Mail-Kampagnen.</p>
                <button
                  onClick={createDefaultTemplates}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  {loading ? 'Erstelle...' : 'Standard-Templates erstellen'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-bold text-[#1A1A1A]">{template.name}</h4>
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${template.type === 'abandoned_cart' ? 'bg-red-100 text-red-800' :
                            template.type === 'welcome' ? 'bg-green-100 text-green-800' :
                              template.type === 'follow_up' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                          }`}>
                            {getTemplateTypeLabel(template.type)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${template.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {template.is_active ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2"><strong>Betreff:</strong> {template.subject}</p>
                        {template.delay_hours && (
                          <p className="text-sm text-gray-500">Verzögerung: {template.delay_hours} Stunden</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Erstellt: {new Date(template.created_at).toLocaleString('de-DE')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => sendTestEmail(template.id)}
                          disabled={loading}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                        >
                          <i className="ri-send-plane-line mr-1"></i>
                          Test
                        </button>
                        <button
                          onClick={() => toggleTemplate(template.id)}
                          disabled={loading}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 ${template.is_active
                            ? 'bg-red-100 hover:bg-red-200 text-red-800'
                            : 'bg-green-100 hover:bg-green-200 text-green-800'
                          }`}
                        >
                          {template.is_active ? 'Deaktivieren' : 'Aktivieren'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#1A1A1A]">Automatisierte Kampagnen</h3>
              <button
                onClick={() => setShowNewCampaign(true)}
                disabled={loading}
                className="bg-[#C04020] hover:bg-[#A03318] text-white px-4 py-2 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <i className="ri-add-line mr-2"></i>
                Neue Kampagne
              </button>
            </div>

            {showNewCampaign && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-bold text-[#1A1A1A] mb-4">Neue automatisierte Kampagne erstellen</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kampagnen Name *</label>
                      <input
                        type="text"
                        value={newCampaign.name}
                        onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="z.B. Warenkorbabbrecher Kampagne"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">E-Mail Template *</label>
                      <select
                        value={newCampaign.template_id}
                        onChange={(e) => setNewCampaign(prev => ({ ...prev, template_id: e.target.value }))}
                        className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Template auswählen</option>
                        {templates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name} ({getTemplateTypeLabel(template.type)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Auslöser Typ</label>
                      <select
                        value={newCampaign.trigger_type}
                        onChange={(e) => setNewCampaign(prev => ({ ...prev, trigger_type: e.target.value as any }))}
                        className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="cart_abandonment">Warenkorbabbruch</option>
                        <option value="new_customer">Neukunde</option>
                        <option value="post_purchase">Nach Kauf</option>
                        <option value="manual">Manuell</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Verzögerung (Stunden)</label>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={newCampaign.trigger_delay}
                        onChange={(e) => setNewCampaign(prev => ({ ...prev, trigger_delay: parseInt(e.target.value) || 2 }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowNewCampaign(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium cursor-pointer whitespace-nowrap"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={saveCampaign}
                      disabled={loading}
                      className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-2 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      {loading ? 'Speichert...' : 'Kampagne erstellen'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {campaigns.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                  <i className="ri-rocket-line text-2xl text-gray-400"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">Noch keine automatisierten Kampagnen</h3>
                <p className="text-gray-500">Erstellen Sie Kampagnen für automatische E-Mail-Versendung.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-bold text-[#1A1A1A]">{campaign.name}</h4>
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${campaign.trigger_type === 'cart_abandonment' ? 'bg-red-100 text-red-800' :
                            campaign.trigger_type === 'new_customer' ? 'bg-green-100 text-green-800' :
                              campaign.trigger_type === 'post_purchase' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                          }`}>
                            {getCampaignTypeLabel(campaign.trigger_type)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${campaign.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {campaign.is_active ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                          <div>
                            <span className="text-gray-500">Template:</span>
                            <p className="font-medium">
                              {templates.find(t => t.id === campaign.template_id)?.name || 'Unbekannt'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Verzögerung:</span>
                            <p className="font-medium">{campaign.trigger_delay}h</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Gesendet:</span>
                            <p className="font-medium">{campaign.sent_count}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Öffnungsrate:</span>
                            <p className="font-medium">
                              {campaign.sent_count > 0
                                ? Math.round((campaign.open_count / campaign.sent_count) * 100)
                                : 0}%
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Erstellt: {new Date(campaign.created_at).toLocaleString('de-DE')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => triggerCampaign(campaign.id)}
                          disabled={loading || !campaign.is_active}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                        >
                          <i className="ri-send-plane-line mr-1"></i>
                          Test
                        </button>
                        <button
                          onClick={() => toggleCampaign(campaign.id)}
                          disabled={loading}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 ${campaign.is_active
                            ? 'bg-red-100 hover:bg-red-200 text-red-800'
                            : 'bg-green-100 hover:bg-green-200 text-green-800'
                          }`}
                        >
                          {campaign.is_active ? 'Stoppen' : 'Starten'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  function getTemplateTypeLabel(type: string) {
    const types: Record<string, string> = {
      'welcome': 'Willkommen',
      'abandoned_cart': 'Warenkorbabbrecher',
      'follow_up': 'Nachfassung',
      'newsletter': 'Newsletter',
      'order_reminder': 'Bestellerinnerung'
    };
    return types[type] || type;
  }

  function getCampaignTypeLabel(type: string) {
    const types: Record<string, string> = {
      'cart_abandonment': 'Warenkorbabbruch',
      'new_customer': 'Neukunde',
      'post_purchase': 'Nach Kauf',
      'manual': 'Manuell'
    };
    return types[type] || type;
  }
}
