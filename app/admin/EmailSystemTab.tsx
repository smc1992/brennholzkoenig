
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface EmailTemplate {
  id: number;
  setting_key: string;
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
  setting_key: string;
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
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    html_content: '',
    text_content: '',
    type: 'order_confirmation',
    active: true,
    preview_mode: false,
    editor_mode: 'visual', // 'visual' or 'code'
    attachments: [] as Array<{ name: string; url: string; type: string; size: number; storagePath?: string }>,
    triggers: {
      order_confirmation: false,
      shipping_notification: false,
      customer_order_cancellation: false,
      admin_order_cancellation: false,
      newsletter: false,
      low_stock: false,
      out_of_stock: false,
      loyalty_points_earned: false,
      loyalty_points_redeemed: false,
      loyalty_tier_upgrade: false,
      loyalty_points_expiring: false
    }
  });
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Using the centralized Supabase client from lib/supabase.ts

  useEffect(() => {
    console.log('🚀 EmailSystemTab mounted, starting to load data...');
    testSupabaseConnection();
    loadEmailSettings();
    loadEmailLogs();
  }, []);

  useEffect(() => {
    console.log('📧 EmailTemplates state changed:', emailTemplates.length, emailTemplates);
  }, [emailTemplates]);

  const testSupabaseConnection = async () => {
    console.log('🔍 Testing Supabase connection...');
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection error:', error);
      } else {
        console.log('✅ Supabase connection successful:', data);
      }
    } catch (err) {
      console.error('❌ Supabase connection failed:', err);
    }
  };

  const loadEmailSettings = async () => {
    console.log('🔄 Loading email settings and templates...');
    try {
      const { data: smtpData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'smtp_config')
        .single();

      if (smtpData) {
        const settings = JSON.parse(smtpData.setting_value);
        setEmailSettings(settings);
        console.log('✅ SMTP settings loaded');
      }

      // Load templates from the app_settings table
      console.log('🔍 Querying app_settings table for email templates...');
      const { data: templatesData, error: templatesError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'email_template')
        .order('created_at', { ascending: false });

      if (templatesError) {
        console.error('❌ Error loading email templates:', templatesError);
      } else {
        console.log('📧 Raw templates data:', templatesData);
        console.log('📧 Templates count:', templatesData?.length || 0);
        
        if (templatesData && templatesData.length > 0) {
          const mappedTemplates = templatesData.map((t: any) => {
            try {
              console.log('📧 Parsing template:', t.setting_key, 'Value:', t.setting_value);
              const templateData = JSON.parse(t.setting_value);
              return { 
                id: t.id,
                setting_key: t.setting_key,
                setting_type: t.setting_type,
                setting_value: t.setting_value,
                template: templateData
              };
            } catch (error) {
              console.error('❌ JSON parsing error for template:', t.setting_key, 'Error:', error);
              console.error('❌ Problematic JSON:', t.setting_value);
              // Return template with null data to avoid breaking the entire list
              return { 
                id: t.id,
                setting_key: t.setting_key,
                setting_type: t.setting_type,
                setting_value: t.setting_value,
                template: null
              };
            }
          });
          console.log('📧 Mapped templates:', mappedTemplates);
          setEmailTemplates(mappedTemplates);
        } else {
          console.log('📧 No templates found in database');
          setEmailTemplates([]);
        }
      }

    } catch (error) {
      console.error('❌ Error loading email settings:', error);
    } finally {
      setLoading(false);
      console.log('✅ Email settings loading completed');
    }
  };

  const loadEmailLogs = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'email_log')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setEmailLogs(data.map((log: any) => ({
          ...log,
          log_data: JSON.parse(log.setting_value)
        })));
      }
    } catch (error) {
      console.error('Error loading email logs:', error);
    }
  };

  const openTemplateModal = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      const templateData = template.template;
      setTemplateForm({
        name: template.setting_key,
        subject: templateData.subject || '',
        html_content: templateData.html_content || '',
        text_content: templateData.text_content || '',
        type: templateData.type || 'order_confirmation',
        active: templateData.active !== false,
        preview_mode: false,
        editor_mode: 'visual',
        attachments: templateData.attachments || [],
        triggers: templateData.triggers || {
          order_confirmation: false,
          shipping_notification: false,
          customer_order_cancellation: false,
          admin_order_cancellation: false,
          newsletter: false,
          low_stock: false,
          out_of_stock: false
        }
      });
    } else {
      setEditingTemplate(null);
      // Lade Standard-Template für neues Template
      const defaultTemplate = getDefaultTemplate('order_confirmation');
      setTemplateForm({
        name: '',
        subject: defaultTemplate.subject,
        html_content: defaultTemplate.html,
        text_content: defaultTemplate.text,
        type: 'order_confirmation',
        active: true,
        preview_mode: false,
        editor_mode: 'visual',
        attachments: [],
        triggers: {
          order_confirmation: false,
          shipping_notification: false,
          customer_order_cancellation: false,
          admin_order_cancellation: false,
          newsletter: false,
          low_stock: false,
          out_of_stock: false,
          loyalty_points_earned: false,
          loyalty_points_redeemed: false,
          loyalty_tier_upgrade: false,
          loyalty_points_expiring: false
        }
      });
    }
    setShowTemplateModal(true);
    setShowPreview(false);
  };

  const saveTemplate = async () => {
    try {
      setSaving(true);
      
      // Validierung
      if (!templateForm.name.trim()) {
        alert('Bitte geben Sie einen Template-Namen ein.');
        return;
      }
      
      if (!templateForm.subject.trim()) {
        alert('Bitte geben Sie einen Betreff ein.');
        return;
      }
      
      if (!templateForm.html_content.trim()) {
        alert('Bitte geben Sie einen E-Mail-Inhalt ein.');
        return;
      }
      
      const templateData = {
        subject: templateForm.subject,
        html_content: templateForm.html_content,
        text_content: templateForm.text_content || templateForm.html_content.replace(/<[^>]*>/g, ''),
        type: templateForm.type,
        active: templateForm.active,
        triggers: templateForm.triggers,
        attachments: templateForm.attachments,
        target_audience: templateForm.type === 'order_confirmation' ? 'customer' : 'customer', // customer oder admin
        admin_notification: templateForm.triggers?.order_confirmation || false,
        created_at: editingTemplate ? undefined : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let result;
      if (editingTemplate) {
        // Update existing template in app_settings table
        result = await supabase
          .from('app_settings')
          .update({
            setting_key: templateForm.name,
            setting_value: JSON.stringify(templateData),
            description: `E-Mail Template: ${templateForm.name}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTemplate.id)
          .select();
      } else {
        // Create new template in app_settings table
        result = await supabase
          .from('app_settings')
          .insert({
            setting_key: templateForm.name,
            setting_value: JSON.stringify(templateData),
            setting_type: 'email_template',
            description: `E-Mail Template: ${templateForm.name}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
      }
      
      if (result.error) {
        throw result.error;
      }
      
      console.log('Template saved successfully:', result.data);

      // Form zurücksetzen
      setTemplateForm({
        name: '',
        subject: '',
        html_content: '',
        text_content: '',
        type: 'order_confirmation',
        active: true,
        preview_mode: false,
        editor_mode: 'visual',
        attachments: [],
        triggers: {
          order_confirmation: false,
          shipping_notification: false,
          customer_order_cancellation: false,
          admin_order_cancellation: false,
          newsletter: false,
          low_stock: false,
          out_of_stock: false,
          loyalty_points_earned: false,
          loyalty_points_redeemed: false,
          loyalty_tier_upgrade: false,
          loyalty_points_expiring: false
        }
      });
      
      setShowTemplateModal(false);
      setEditingTemplate(null);
      
      // Templates neu laden
      await loadEmailSettings();
      
      alert(editingTemplate ? 'Template erfolgreich aktualisiert!' : 'Template erfolgreich erstellt!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert(`Fehler beim Speichern des Templates: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (template: EmailTemplate) => {
    if (!confirm('Möchten Sie dieses Template wirklich löschen?')) return;
    
    try {
      await supabase
        .from('app_settings')
        .delete()
        .eq('id', template.id);
      
      loadEmailSettings(); // Reload templates
      alert('Template erfolgreich gelöscht!');
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Fehler beim Löschen des Templates');
    }
  };

  const getTemplateTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'order_confirmation': 'Bestellbestätigung',
      'shipping_notification': 'Versandbenachrichtigung',
      'low_stock_warning': 'Lagerwarnung',
      'newsletter': 'Newsletter',
      'password_reset': 'Passwort zurücksetzen',
      'welcome': 'Willkommen'
    };
    return types[type] || type;
  };

  const insertPlaceholder = (placeholder: string) => {
    if (templateForm.editor_mode === 'visual') {
      // Insert into visual editor
      const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
      if (editor) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          
          // Erstelle Platzhalter-Element
          const span = document.createElement('span');
          span.className = 'inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mx-1';
          span.textContent = placeholder;
          span.contentEditable = 'false';
          span.style.userSelect = 'none';
          span.style.display = 'inline-block';
          span.style.margin = '0 2px';
          
          // Füge Platzhalter ein
          range.deleteContents();
          range.insertNode(span);
          
          // Cursor nach dem Platzhalter positionieren
          range.setStartAfter(span);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Content aktualisieren
          setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
        } else {
          // Fallback: Am Ende einfügen
          editor.focus();
          const span = document.createElement('span');
          span.className = 'inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mx-1';
          span.textContent = placeholder;
          span.contentEditable = 'false';
          span.style.userSelect = 'none';
          span.style.display = 'inline-block';
          span.style.margin = '0 2px';
          
          editor.appendChild(span);
          
          // Cursor nach dem Platzhalter setzen
          const range = document.createRange();
          const selection = window.getSelection();
          range.setStartAfter(span);
          range.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(range);
          
          setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
        }
      }
    } else {
      // Insert into code editor
      const textarea = document.querySelector('textarea[placeholder*="HTML"]') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const newText = text.substring(0, start) + placeholder + text.substring(end);
        setTemplateForm(prev => ({ ...prev, html_content: newText }));
        
        // Cursor nach dem Platzhalter positionieren
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
        }, 0);
      } else {
        // Fallback: Direkt zum Content hinzufügen
        setTemplateForm(prev => ({ 
          ...prev, 
          html_content: prev.html_content + placeholder 
        }));
      }
    }
  };

  const generatePreviewContent = () => {
    let content = templateForm.html_content;
    // Replace placeholders with sample data
    const sampleData: Record<string, string> = {
      '{{customer_name}}': 'Max Mustermann',
      '{{order_number}}': 'BK-2024-001',
      '{{order_total}}': '89,99 €',
      '{{order_date}}': new Date().toLocaleDateString('de-DE'),
      '{{delivery_address}}': 'Musterstraße 123, 12345 Musterstadt',
      '{{tracking_number}}': 'DHL123456789',
      '{{product_list}}': '<ul><li>Brennholz Buche 33cm - 1 Raummeter</li><li>Anzündhilfe - 1 Paket</li></ul>',
      '{{company_name}}': 'Brennholzkönig',
      '{{support_email}}': 'info@brennholz-koenig.de'
    };
    
    Object.entries(sampleData).forEach(([placeholder, value]) => {
      content = content.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    
    return content;
  };

  const getDefaultTemplate = (type: string) => {
    const templates: Record<string, { subject: string; html: string; text: string }> = {
      'order_confirmation': {
        subject: 'Bestellbestätigung - Ihre Bestellung {{order_number}}',
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
  <div style="background-color: #C04020; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
    <img src="/images/Brennholzkönig%20transparent.webp?v=4&t=1695730300" alt="Brennholzkönig Logo" style="max-width: 200px; height: auto; margin-bottom: 10px;">
    <p style="margin: 5px 0 0; opacity: 0.9;">Premium Brennholz direkt vom Produzenten</p>
  </div>
  
  <h2 style="color: #C04020; margin-top: 0;">Vielen Dank für Ihre Bestellung!</h2>
  
  <p>Liebe/r {{customer_name}},</p>
  
  <p>wir haben Ihre Bestellung erhalten und bestätigen diese hiermit. Ihre Bestellnummer lautet: <strong>{{order_number}}</strong></p>
  
  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #C04020;">Bestelldetails:</h3>
    <p><strong>Bestellnummer:</strong> {{order_number}}</p>
    <p><strong>Bestelldatum:</strong> {{order_date}}</p>
    <p><strong>Gesamtbetrag:</strong> {{order_total}}</p>
    <p><strong>Lieferadresse:</strong><br>{{delivery_address}}</p>
  </div>
  
  <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #C04020;">Ihre Produkte:</h3>
    {{product_list}}
  </div>
  
  <p>Wir werden Sie über den Versandstatus informieren, sobald Ihre Bestellung bearbeitet wurde.</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  
  <div style="background-color: #1A1A1A; color: white; padding: 15px; text-align: center; border-radius: 5px; margin: 20px -20px -20px -20px;">
    <p style="margin: 0; font-size: 12px; opacity: 0.8;">Bei Fragen erreichen Sie uns unter: {{support_email}}</p>
    <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.8;">{{company_name}} - Ihr Partner für Premium Brennholz</p>
  </div>
</div>`,
        text: `Vielen Dank für Ihre Bestellung!

Liebe/r {{customer_name}},

wir haben Ihre Bestellung erhalten und bestätigen diese hiermit.

Bestelldetails:
- Bestellnummer: {{order_number}}
- Bestelldatum: {{order_date}}
- Gesamtbetrag: {{order_total}}
- Lieferadresse: {{delivery_address}}

Wir werden Sie über den Versandstatus informieren.

Bei Fragen erreichen Sie uns unter: {{support_email}}

{{company_name}} - Ihr Partner für Premium Brennholz`
      },
      'shipping_notification': {
        subject: 'Ihre Bestellung {{order_number}} wurde versendet',
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
  <div style="background-color: #C04020; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
    <img src="/images/Brennholzkönig%20transparent.webp?v=4&t=1695730300" alt="Brennholzkönig Logo" style="max-width: 200px; height: auto; margin-bottom: 10px;">
    <p style="margin: 5px 0 0; opacity: 0.9;">Premium Brennholz direkt vom Produzenten</p>
  </div>
  
  <h2 style="color: #C04020; margin-top: 0;">📦 Ihre Bestellung ist unterwegs!</h2>
  
  <p>Liebe/r {{customer_name}},</p>
  
  <p>Ihre Bestellung <strong>{{order_number}}</strong> wurde heute versendet und ist nun auf dem Weg zu Ihnen!</p>
  
  <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; border-left: 4px solid #C04020; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #C04020;">Versandinformationen:</h3>
    <p><strong>Sendungsverfolgung:</strong> {{tracking_number}}</p>
    <p><strong>Versanddatum:</strong> {{shipping_date}}</p>
    <p><strong>Voraussichtliche Lieferung:</strong> {{estimated_delivery}}</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{tracking_url}}" style="background-color: #C04020; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Sendung verfolgen</a>
  </div>
  
  <p>Vielen Dank für Ihr Vertrauen in unsere Premium-Brennholzprodukte!</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  
  <div style="background-color: #1A1A1A; color: white; padding: 15px; text-align: center; border-radius: 5px; margin: 20px -20px -20px -20px;">
    <p style="margin: 0; font-size: 12px; opacity: 0.8;">Bei Fragen erreichen Sie uns unter: {{support_email}}</p>
    <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.8;">{{company_name}} - Ihr Partner für Premium Brennholz</p>
  </div>
</div>`,
        text: `Ihre Bestellung ist unterwegs!

Liebe/r {{customer_name}},

Ihre Bestellung {{order_number}} wurde heute versendet und ist nun auf dem Weg zu Ihnen!

Versandinformationen:
- Sendungsverfolgung: {{tracking_number}}
- Versanddatum: {{shipping_date}}
- Voraussichtliche Lieferung: {{estimated_delivery}}

Sendung verfolgen: {{tracking_url}}

Vielen Dank für Ihr Vertrauen in unsere Premium-Brennholzprodukte!

Bei Fragen erreichen Sie uns unter: {{support_email}}
{{company_name}} - Ihr Partner für Premium Brennholz`
      }
    };
    
    return templates[type] || templates['order_confirmation'];
  };

  const saveSmtpSettings = async () => {
    setSaving(true);
    try {
      // Verwende die universelle SMTP-Upsert-Funktion
      const { data, error } = await supabase
        .rpc('universal_smtp_upsert', {
          p_setting_type: 'smtp_config',
          p_setting_key: 'main',
          p_setting_value: JSON.stringify(emailSettings),
          p_description: 'Email system SMTP configuration'
        });

      if (error) {
        console.error('RPC-Fehler:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const result = data[0];
        if (result.success) {
          console.log(`SMTP-Einstellungen erfolgreich gespeichert! Operation: ${result.operation}`);
          alert('SMTP-Einstellungen erfolgreich gespeichert!');
        } else {
          console.error('Datenbankfehler:', result.message);
          throw new Error(result.message);
        }
      } else {
        console.log('Keine Antwort von der Datenbankfunktion.');
        alert('SMTP-Einstellungen gespeichert (keine Bestätigung erhalten).');
      }
    } catch (error) {
      console.error('Error saving SMTP settings:', error);
      alert('Fehler beim Speichern der SMTP-Einstellungen: ' + (error as any).message);
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
      const response = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: testEmail,
          subject: 'SMTP Test von Brennholzkönig Admin',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="background-color: #C04020; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
                <h1 style="margin: 0; font-size: 24px;">🔥 Brennholzkönig</h1>
                <p style="margin: 5px 0 0; opacity: 0.9;">Premium Brennholz direkt vom Produzenten</p>
              </div>
              <h2 style="color: #C04020; margin-top: 0;">SMTP-Test erfolgreich!</h2>
              <p style="color: #333; line-height: 1.6;">Diese Test-E-Mail wurde erfolgreich über Ihre SMTP-Konfiguration versendet.</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Zeitpunkt:</strong> ${new Date().toLocaleString('de-DE')}</p>
                <p style="margin: 5px 0;"><strong>SMTP-Server:</strong> ${emailSettings.smtp_host}:${emailSettings.smtp_port}</p>
                <p style="margin: 5px 0;"><strong>Von:</strong> ${emailSettings.from_email}</p>
              </div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <div style="background-color: #1A1A1A; color: white; padding: 15px; text-align: center; border-radius: 5px; margin: 20px -20px -20px -20px;">
                <p style="margin: 0; font-size: 12px; opacity: 0.8;">
                  Diese E-Mail wurde automatisch vom Brennholzkönig Admin-System generiert.
                </p>
                <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.8;">
                  Bei Fragen erreichen Sie uns unter: info@brennholz-koenig.de
                </p>
              </div>
            </div>
          `,
          text: `SMTP-Test erfolgreich!

Diese Test-E-Mail wurde erfolgreich über Ihre SMTP-Konfiguration versendet.

Zeitpunkt: ${new Date().toLocaleString('de-DE')}
SMTP-Server: ${emailSettings.smtp_host}:${emailSettings.smtp_port}
Von: ${emailSettings.from_email}

Brennholzkönig - Premium Brennholz direkt vom Produzenten
Bei Fragen erreichen Sie uns unter: info@brennholz-koenig.de`
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert(`✅ Test-E-Mail erfolgreich an ${testEmail} gesendet!\n\nMessage ID: ${result.messageId || 'N/A'}`);
          loadEmailLogs(); 
        } else {
          throw new Error(result.error || 'Unbekannter Fehler');
        }
      } else {
        const errorData = await response.text();
        throw new Error(`SMTP-Test fehlgeschlagen: ${errorData}`);
      }
    } catch (error) {
      console.error('SMTP test error:', error);
      alert(`❌ SMTP-Test fehlgeschlagen!\n\nFehler: ${(error as Error).message}\n\nBitte überprüfen Sie Ihre SMTP-Einstellungen.`);
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
                <button 
                  onClick={() => openTemplateModal()}
                  className="bg-[#C04020] hover:bg-[#A03318] text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-add-line mr-2"></i>
                  Template hinzufügen
                </button>
              </div>

              {emailTemplates.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded-full mx-auto mb-4">
                    <i className="ri-file-text-line text-2xl text-gray-400"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Keine Templates vorhanden</h3>
                  <p className="text-gray-500 mb-4">Erstellen Sie Ihr erstes E-Mail-Template für automatische Benachrichtigungen.</p>
                  <button 
                    onClick={() => openTemplateModal()}
                    className="bg-[#C04020] hover:bg-[#A03318] text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    <i className="ri-add-line mr-2"></i>
                    Erstes Template erstellen
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emailTemplates.map((template) => {
                    const templateData = template.template;
                    
                    // Skip templates with malformed JSON
                    if (!templateData) {
                      return (
                        <div key={template.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 flex items-center justify-center bg-red-100 rounded-lg">
                              <i className="ri-error-warning-line text-red-600"></i>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-red-900">{template.setting_key}</h4>
                              <p className="text-sm text-red-600">Fehlerhaftes JSON - Template kann nicht geladen werden</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    const typeIcons: Record<string, { icon: string; color: string }> = {
                      'order_confirmation': { icon: 'ri-check-line', color: 'green' },
                      'shipping_notification': { icon: 'ri-truck-line', color: 'blue' },
                      'low_stock_warning': { icon: 'ri-alert-line', color: 'red' },
                      'newsletter': { icon: 'ri-heart-line', color: 'purple' },
                      'password_reset': { icon: 'ri-lock-line', color: 'orange' },
                      'welcome': { icon: 'ri-user-smile-line', color: 'indigo' }
                    };
                    const typeConfig = typeIcons[templateData.type] || { icon: 'ri-mail-line', color: 'gray' };
                    
                    return (
                      <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-10 h-10 flex items-center justify-center bg-${typeConfig.color}-100 rounded-lg`}>
                            <i className={`${typeConfig.icon} text-${typeConfig.color}-600`}></i>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{template.setting_key}</h4>
                            <p className="text-sm text-gray-600">{getTemplateTypeLabel(templateData.type)}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                            templateData.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {templateData.active ? 'Aktiv' : 'Inaktiv'}
                          </span>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => openTemplateModal(template)}
                              className="text-blue-600 hover:text-blue-800 cursor-pointer"
                              title="Bearbeiten"
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                            <button 
                              onClick={() => deleteTemplate(template)}
                              className="text-red-600 hover:text-red-800 cursor-pointer"
                              title="Löschen"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-4 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingTemplate ? 'Template bearbeiten' : 'Neues Template erstellen'}
                </h3>
                <button 
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Template Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Template-Name *
                  </label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    placeholder="z.B. Bestellbestätigung"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Template-Typ *
                  </label>
                  <select
                    value={templateForm.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setTemplateForm(prev => ({ ...prev, type: newType }));
                      // Auto-fill with default template if content is empty
                      if (!templateForm.html_content && !editingTemplate) {
                        const defaultTemplate = getDefaultTemplate(newType);
                        setTemplateForm(prev => ({
                          ...prev,
                          type: newType,
                          subject: defaultTemplate.subject,
                          html_content: defaultTemplate.html,
                          text_content: defaultTemplate.text
                        }));
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] cursor-pointer"
                  >
                    <option value="order_confirmation">Bestellbestätigung</option>
                    <option value="shipping_notification">Versandbenachrichtigung</option>
                    <option value="low_stock_warning">Lagerwarnung</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="password_reset">Passwort zurücksetzen</option>
                    <option value="welcome">Willkommen</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  E-Mail-Betreff *
                </label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                  placeholder="z.B. Ihre Bestellung bei Brennholzkönig wurde bestätigt"
                  required
                />
              </div>

              {/* E-Mail Editor */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-bold text-gray-700">
                    E-Mail-Inhalt *
                  </label>
                  <div className="flex items-center space-x-4">
                    {/* Editor Mode Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setTemplateForm(prev => ({ ...prev, editor_mode: 'visual' }))}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          templateForm.editor_mode === 'visual' 
                            ? 'bg-white text-[#C04020] shadow-sm' 
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <i className="ri-edit-line mr-1"></i>
                        Visuell
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemplateForm(prev => ({ ...prev, editor_mode: 'code' }))}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          templateForm.editor_mode === 'code' 
                            ? 'bg-white text-[#C04020] shadow-sm' 
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <i className="ri-code-line mr-1"></i>
                        Code
                      </button>
                    </div>
                    
                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      <i className="ri-eye-line mr-1"></i>
                      {showPreview ? 'Vorschau ausblenden' : 'Vorschau anzeigen'}
                    </button>
                  </div>
                </div>

                {/* Platzhalter */}
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600 mb-2">Verfügbare Platzhalter:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      '{{customer_name}}', '{{order_number}}', '{{order_total}}', 
                      '{{order_date}}', '{{delivery_address}}', '{{tracking_number}}',
                      '{{product_list}}', '{{company_name}}', '{{company_business}}',
                      '{{company_address}}', '{{company_phone}}', '{{company_email}}',
                      '{{company_website}}', '{{support_email}}'
                    ].map(placeholder => (
                      <span 
                        key={placeholder}
                        onClick={() => insertPlaceholder(placeholder)}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded cursor-pointer hover:bg-blue-200 transition-colors"
                        title={`Klicken zum Einfügen: ${placeholder}`}
                      >
                        {placeholder}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Editor Content */}
                  <div className={showPreview ? 'lg:grid lg:grid-cols-2 lg:gap-4' : ''}>
                    <div>
                      {templateForm.editor_mode === 'visual' ? (
                        /* Visual Editor */
                        <div className="border border-gray-300 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
                            <div className="flex flex-wrap items-center gap-2 p-2">
                               {/* Basis-Formatierung */}
                               <div className="flex items-center space-x-1">
                                 <button
                                   type="button"
                                   onClick={() => {
                                     document.execCommand('bold', false);
                                     const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                     if (editor) {
                                       setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                     }
                                   }}
                                   className="p-1 hover:bg-gray-200 rounded text-sm transition-colors"
                                   title="Fett"
                                 >
                                   <i className="ri-bold"></i>
                                 </button>
                                 <button
                                   type="button"
                                   onClick={() => {
                                     document.execCommand('italic', false);
                                     const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                     if (editor) {
                                       setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                     }
                                   }}
                                   className="p-1 hover:bg-gray-200 rounded text-sm transition-colors"
                                   title="Kursiv"
                                 >
                                   <i className="ri-italic"></i>
                                 </button>
                                 <button
                                   type="button"
                                   onClick={() => {
                                     document.execCommand('underline', false);
                                     const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                     if (editor) {
                                       setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                     }
                                   }}
                                   className="p-1 hover:bg-gray-200 rounded text-sm transition-colors"
                                   title="Unterstrichen"
                                 >
                                   <i className="ri-underline"></i>
                                 </button>
                               </div>

                               <div className="w-px h-4 bg-gray-300"></div>

                               {/* Schriftgröße */}
                                <div className="flex items-center space-x-1">
                                  <select
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value) {
                                        const selection = window.getSelection();
                                        if (selection && selection.rangeCount > 0) {
                                          const range = selection.getRangeAt(0);
                                          const span = document.createElement('span');
                                          span.style.fontSize = value;
                                          
                                          if (range.collapsed) {
                                            span.textContent = '\u200B';
                                            range.insertNode(span);
                                            range.setStart(span, 0);
                                            range.setEnd(span, 1);
                                          } else {
                                            try {
                                              range.surroundContents(span);
                                            } catch {
                                              const contents = range.extractContents();
                                              span.appendChild(contents);
                                              range.insertNode(span);
                                            }
                                          }
                                          
                                          selection.removeAllRanges();
                                          selection.addRange(range);
                                        }
                                        
                                        const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                        if (editor) {
                                          setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                        }
                                        e.target.value = '';
                                      }
                                    }}
                                    className="text-xs border border-gray-300 rounded px-1 py-1 cursor-pointer w-16"
                                    title="Schriftgröße"
                                  >
                                    <option value="">Größe</option>
                                    <option value="8px">8px</option>
                                    <option value="10px">10px</option>
                                    <option value="12px">12px</option>
                                    <option value="14px">14px</option>
                                    <option value="16px">16px</option>
                                    <option value="18px">18px</option>
                                    <option value="20px">20px</option>
                                    <option value="22px">22px</option>
                                    <option value="24px">24px</option>
                                    <option value="28px">28px</option>
                                    <option value="32px">32px</option>
                                    <option value="36px">36px</option>
                                    <option value="48px">48px</option>
                                  </select>
                                  
                                  <input
                                    type="number"
                                    min="6"
                                    max="72"
                                    placeholder="px"
                                    className="text-xs border border-gray-300 rounded px-1 py-1 w-12"
                                    title="Benutzerdefinierte Schriftgröße"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const value = (e.target as HTMLInputElement).value;
                                        if (value && parseInt(value) >= 6 && parseInt(value) <= 72) {
                                          const fontSize = value + 'px';
                                          const selection = window.getSelection();
                                          if (selection && selection.rangeCount > 0) {
                                            const range = selection.getRangeAt(0);
                                            const span = document.createElement('span');
                                            span.style.fontSize = fontSize;
                                            
                                            if (range.collapsed) {
                                              span.textContent = '\u200B';
                                              range.insertNode(span);
                                              range.setStart(span, 0);
                                              range.setEnd(span, 1);
                                            } else {
                                              try {
                                                range.surroundContents(span);
                                              } catch {
                                                const contents = range.extractContents();
                                                span.appendChild(contents);
                                                range.insertNode(span);
                                              }
                                            }
                                            
                                            selection.removeAllRanges();
                                            selection.addRange(range);
                                          }
                                          
                                          const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                          if (editor) {
                                            setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                          }
                                          (e.target as HTMLInputElement).value = '';
                                        }
                                      }
                                    }}
                                  />
                                </div>

                                {/* Schriftart */}
                                <select
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value) {
                                      const selection = window.getSelection();
                                      if (selection && selection.rangeCount > 0) {
                                        const range = selection.getRangeAt(0);
                                        const span = document.createElement('span');
                                        span.style.fontFamily = value;
                                        
                                        if (range.collapsed) {
                                          span.textContent = '\u200B';
                                          range.insertNode(span);
                                          range.setStart(span, 0);
                                          range.setEnd(span, 1);
                                        } else {
                                          try {
                                            range.surroundContents(span);
                                          } catch {
                                            const contents = range.extractContents();
                                            span.appendChild(contents);
                                            range.insertNode(span);
                                          }
                                        }
                                        
                                        selection.removeAllRanges();
                                        selection.addRange(range);
                                      }
                                      
                                      const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                      if (editor) {
                                        setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                      }
                                      e.target.value = '';
                                    }
                                  }}
                                  className="text-xs border border-gray-300 rounded px-1 py-1 cursor-pointer"
                                  title="Schriftart"
                                >
                                  <option value="">Schriftart</option>
                                  <option value="Arial, sans-serif">Arial</option>
                                  <option value="Helvetica, Arial, sans-serif">Helvetica</option>
                                  <option value="'Times New Roman', Times, serif">Times New Roman</option>
                                  <option value="Georgia, serif">Georgia</option>
                                  <option value="'Courier New', Courier, monospace">Courier New</option>
                                  <option value="Verdana, Geneva, sans-serif">Verdana</option>
                                  <option value="Tahoma, Geneva, sans-serif">Tahoma</option>
                                  <option value="'Trebuchet MS', Helvetica, sans-serif">Trebuchet MS</option>
                                  <option value="'Lucida Sans Unicode', 'Lucida Grande', sans-serif">Lucida Sans</option>
                                  <option value="Impact, Charcoal, sans-serif">Impact</option>
                                  <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                                  <option value="'Palatino Linotype', 'Book Antiqua', Palatino, serif">Palatino</option>
                                  <option value="'Lucida Console', Monaco, monospace">Lucida Console</option>
                                  <option value="system-ui, -apple-system, sans-serif">System UI</option>
                                </select>

                               {/* Textfarbe */}
                                <input
                                  type="color"
                                  onChange={(e) => {
                                    document.execCommand('foreColor', false, e.target.value);
                                    const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                    if (editor) {
                                      setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                    }
                                  }}
                                  className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                                  title="Textfarbe"
                                  defaultValue="#000000"
                                />

                                {/* Hintergrundfarbe */}
                                <input
                                  type="color"
                                  onChange={(e) => {
                                    document.execCommand('backColor', false, e.target.value);
                                    const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                    if (editor) {
                                      setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                    }
                                  }}
                                  className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                                  title="Hintergrundfarbe"
                                  defaultValue="#ffffff"
                                />

                               <div className="w-px h-4 bg-gray-300"></div>

                               {/* Format */}
                               <select
                                 onChange={(e) => {
                                   const value = e.target.value;
                                   if (value) {
                                     document.execCommand('formatBlock', false, value);
                                     const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                     if (editor) {
                                       setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                     }
                                     e.target.value = '';
                                   }
                                 }}
                                 className="text-xs border border-gray-300 rounded px-1 py-1 cursor-pointer"
                                 title="Format"
                               >
                                 <option value="">Format</option>
                                 <option value="h1">Überschrift 1</option>
                                 <option value="h2">Überschrift 2</option>
                                 <option value="h3">Überschrift 3</option>
                                 <option value="p">Absatz</option>
                               </select>

                               <div className="w-px h-4 bg-gray-300"></div>

                               {/* Listen */}
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      document.execCommand('insertUnorderedList', false);
                                      const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                      if (editor) {
                                        setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                      }
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded text-sm transition-colors"
                                    title="Aufzählung"
                                  >
                                    <i className="ri-list-unordered"></i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      document.execCommand('insertOrderedList', false);
                                      const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                      if (editor) {
                                        setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                      }
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded text-sm transition-colors"
                                    title="Nummerierte Liste"
                                  >
                                    <i className="ri-list-ordered"></i>
                                  </button>
                                </div>

                                <div className="w-px h-4 bg-gray-300"></div>

                                {/* Ausrichtung */}
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      document.execCommand('justifyLeft', false);
                                      const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                      if (editor) {
                                        setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                      }
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded text-sm transition-colors"
                                    title="Linksbündig"
                                  >
                                    <i className="ri-align-left"></i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      document.execCommand('justifyCenter', false);
                                      const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                      if (editor) {
                                        setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                      }
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded text-sm transition-colors"
                                    title="Zentriert"
                                  >
                                    <i className="ri-align-center"></i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      document.execCommand('justifyRight', false);
                                      const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                      if (editor) {
                                        setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                      }
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded text-sm transition-colors"
                                    title="Rechtsbündig"
                                  >
                                    <i className="ri-align-right"></i>
                                  </button>
                                </div>

                                <div className="w-px h-4 bg-gray-300"></div>

                                {/* Erweiterte Funktionen */}
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const url = prompt('Link-URL eingeben:');
                                      if (url) {
                                        document.execCommand('createLink', false, url);
                                        const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                        if (editor) {
                                          setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                        }
                                      }
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded text-sm transition-colors"
                                    title="Link"
                                  >
                                    <i className="ri-link"></i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                       // Erstelle versteckten File-Input für Bild-Upload
                                       const fileInput = document.createElement('input');
                                       fileInput.type = 'file';
                                       fileInput.accept = 'image/*';
                                       fileInput.style.display = 'none';
                                       
                                       fileInput.onchange = async (e) => {
                                         const file = (e.target as HTMLInputElement).files?.[0];
                                         if (!file) return;
                                         
                                         try {
                                           // Upload zu Supabase
                                           const timestamp = Date.now();
                                           const randomId = Math.random().toString(36).substring(2, 15);
                                           const fileExtension = file.name.split('.').pop();
                                           const fileName = `email-images/${timestamp}-${randomId}.${fileExtension}`;
                                           
                                           const { data, error } = await supabase.storage
                                             .from('email-attachments')
                                             .upload(fileName, file);
                                           
                                           if (error) throw error;
                                           
                                           const { data: urlData } = supabase.storage
                                             .from('email-attachments')
                                             .getPublicUrl(fileName);
                                           
                                           const img = `<img src="${urlData.publicUrl}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 4px; margin: 10px 0; display: block;" />`;
                                           document.execCommand('insertHTML', false, img);
                                           
                                           const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                           if (editor) {
                                             setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                           }
                                         } catch (error) {
                                           console.error('Bild-Upload Fehler:', error);
                                           alert('Fehler beim Hochladen des Bildes');
                                         }
                                       };
                                       
                                       document.body.appendChild(fileInput);
                                       fileInput.click();
                                       document.body.removeChild(fileInput);
                                     }}
                                    className="p-1 hover:bg-gray-200 rounded text-sm transition-colors"
                                    title="Bild einfügen"
                                  >
                                    <i className="ri-image-line"></i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const table = `
                                        <table style="border-collapse: collapse; width: 100%; margin: 15px 0; border: 1px solid #ddd;">
                                          <tr>
                                            <td style="border: 1px solid #ddd; padding: 8px; background-color: #f9f9f9;">Spalte 1</td>
                                            <td style="border: 1px solid #ddd; padding: 8px; background-color: #f9f9f9;">Spalte 2</td>
                                          </tr>
                                          <tr>
                                            <td style="border: 1px solid #ddd; padding: 8px;">Inhalt 1</td>
                                            <td style="border: 1px solid #ddd; padding: 8px;">Inhalt 2</td>
                                          </tr>
                                        </table>
                                      `;
                                      document.execCommand('insertHTML', false, table);
                                      const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                      if (editor) {
                                        setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                      }
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded text-sm transition-colors"
                                    title="Tabelle einfügen"
                                  >
                                    <i className="ri-table-line"></i>
                                  </button>
                                  <button
                                     type="button"
                                     onClick={() => {
                                       document.execCommand('insertHorizontalRule', false);
                                       const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                       if (editor) {
                                         setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                       }
                                     }}
                                     className="p-1 hover:bg-gray-200 rounded text-sm transition-colors"
                                     title="Trennlinie"
                                   >
                                     <i className="ri-separator"></i>
                                   </button>
                                   <button
                                     type="button"
                                     onClick={() => {
                                       const buttonText = prompt('Button-Text eingeben:', 'Jetzt bestellen');
                                       const buttonUrl = prompt('Button-URL eingeben:', 'https://brennholz-koenig.de');
                                       if (buttonText && buttonUrl) {
                                         const button = `
                                           <div style="text-align: center; margin: 20px 0;">
                                             <a href="${buttonUrl}" style="
                                               display: inline-block;
                                               background-color: #C04020;
                                               color: white;
                                               padding: 12px 24px;
                                               text-decoration: none;
                                               border-radius: 6px;
                                               font-weight: bold;
                                               font-size: 16px;
                                               border: none;
                                               cursor: pointer;
                                               transition: background-color 0.3s;
                                             " onmouseover="this.style.backgroundColor='#A03318'" onmouseout="this.style.backgroundColor='#C04020'">
                                               ${buttonText}
                                             </a>
                                           </div>
                                         `;
                                         document.execCommand('insertHTML', false, button);
                                         const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                         if (editor) {
                                           setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                         }
                                       }
                                     }}
                                     className="p-1 hover:bg-gray-200 rounded text-sm transition-colors"
                                     title="Button einfügen"
                                   >
                                     <i className="ri-checkbox-blank-line"></i>
                                   </button>
                                 </div>

                                 <div className="w-px h-4 bg-gray-300"></div>

                                 {/* Layout-Blöcke */}
                                 <div className="flex items-center space-x-1">
                                   <select
                                     onChange={(e) => {
                                       const value = e.target.value;
                                       if (value) {
                                         let layoutBlock = '';
                                         
                                         switch (value) {
                                           case 'header':
                                             layoutBlock = `
                                               <div style="background-color: #C04020; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: 0 0 20px 0;">
                                                 <h1 style="margin: 0; font-size: 24px;">🔥 {{company_name}}</h1>
                                                 <p style="margin: 5px 0 0; opacity: 0.9;">Premium Brennholz direkt vom Produzenten</p>
                                               </div>
                                             `;
                                             break;
                                           case 'footer':
                                             layoutBlock = `
                                               <div style="background-color: #1A1A1A; color: white; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0 0 0;">
                                                 <p style="margin: 0; font-size: 12px; opacity: 0.8;">Bei Fragen erreichen Sie uns unter: {{support_email}}</p>
                                                 <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.8;">{{company_name}} - Ihr Partner für Premium Brennholz</p>
                                               </div>
                                             `;
                                             break;
                                           case 'infobox':
                                             layoutBlock = `
                                               <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #C04020;">
                                                 <h3 style="margin-top: 0; color: #C04020;">Wichtige Information</h3>
                                                 <p style="margin-bottom: 0;">Hier können Sie wichtige Informationen für Ihre Kunden einfügen.</p>
                                               </div>
                                             `;
                                             break;
                                           case 'contact':
                                             layoutBlock = `
                                               <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                                 <h3 style="margin-top: 0; color: #C04020;">Kontakt</h3>
                                                 <p style="margin: 5px 0;"><strong>E-Mail:</strong> {{support_email}}</p>
                                                 <p style="margin: 5px 0;"><strong>Telefon:</strong> +49 (0) 123 456789</p>
                                                 <p style="margin: 5px 0;"><strong>Adresse:</strong> Musterstraße 123, 12345 Musterstadt</p>
                                               </div>
                                             `;
                                             break;
                                         }
                                         
                                         if (layoutBlock) {
                                           document.execCommand('insertHTML', false, layoutBlock);
                                           const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                           if (editor) {
                                             setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                           }
                                         }
                                         e.target.value = '';
                                       }
                                     }}
                                     className="text-xs border border-gray-300 rounded px-1 py-1 cursor-pointer"
                                     title="Layout-Block"
                                   >
                                     <option value="">Layout</option>
                                     <option value="header">Header</option>
                                     <option value="footer">Footer</option>
                                     <option value="infobox">Info-Box</option>
                                     <option value="contact">Kontakt-Block</option>
                                   </select>
                                 </div>

                               <div className="w-px h-4 bg-gray-300"></div>

                               {/* Aktionen */}
                               <button
                                 type="button"
                                 onClick={() => {
                                   const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
                                   if (editor && confirm('Möchten Sie den Inhalt wirklich löschen?')) {
                                     editor.innerHTML = '<p>Hier können Sie Ihren E-Mail-Inhalt eingeben...</p>';
                                     setTemplateForm(prev => ({ ...prev, html_content: editor.innerHTML }));
                                   }
                                 }}
                                 className="p-1 hover:bg-red-200 text-red-600 rounded text-sm transition-colors"
                                 title="Inhalt löschen"
                               >
                                 <i className="ri-delete-bin-line"></i>
                               </button>
                             </div>
                          </div>
                          <div
                             ref={(el) => {
                               if (el && templateForm.editor_mode === 'visual') {
                                 // Nur setzen wenn sich der Inhalt geändert hat
                                 if (el.innerHTML !== templateForm.html_content) {
                                   el.innerHTML = templateForm.html_content;
                                 }
                                 // Scroll-Verhalten explizit setzen
                                 el.style.overflowY = 'auto';
                                 el.style.overflowX = 'hidden';
                                 el.style.height = '400px';
                                 el.style.maxHeight = '400px';
                               }
                             }}
                             contentEditable
                             className="p-4 focus:outline-none"
                             style={{ 
                               height: '400px',
                               maxHeight: '400px',
                               overflowY: 'auto',
                               overflowX: 'hidden',
                               border: 'none',
                               outline: 'none',
                               wordWrap: 'break-word',
                               whiteSpace: 'normal',
                               lineHeight: '1.5',
                               fontSize: '14px',
                               fontFamily: 'system-ui, -apple-system, sans-serif',
                               backgroundColor: '#ffffff',
                               cursor: 'text',
                               scrollBehavior: 'smooth'
                             }}
                             onInput={(e) => {
                               const target = e.target as HTMLDivElement;
                               const newContent = target.innerHTML;
                               if (newContent !== templateForm.html_content) {
                                 setTemplateForm(prev => ({ ...prev, html_content: newContent }));
                               }
                             }}
                             onPaste={(e) => {
                               e.preventDefault();
                               const text = e.clipboardData.getData('text/plain');
                               document.execCommand('insertText', false, text);
                             }}
                             onKeyDown={(e) => {
                               // Verbesserte Tastatur-Navigation
                               if (e.key === 'Tab') {
                                 e.preventDefault();
                                 document.execCommand('insertText', false, '    ');
                               }
                               // Enter für neue Zeile
                               if (e.key === 'Enter' && !e.shiftKey) {
                                 e.preventDefault();
                                 document.execCommand('insertHTML', false, '<br><br>');
                               }
                             }}
                             onFocus={(e) => {
                               // Sicherstellen dass Scroll funktioniert
                               const target = e.target as HTMLDivElement;
                               target.style.overflowY = 'auto';
                             }}
                             suppressContentEditableWarning={true}
                           />
                        </div>
                      ) : (
                        /* Code Editor */
                        <textarea
                          value={templateForm.html_content}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, html_content: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] font-mono text-sm"
                          placeholder="HTML-Inhalt der E-Mail..."
                          rows={16}
                          required
                        />
                      )}
                    </div>

                    {/* Preview */}
                    {showPreview && (
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
                          <h4 className="text-sm font-medium text-gray-700">
                            <i className="ri-eye-line mr-1"></i>
                            Vorschau
                          </h4>
                        </div>
                        <div 
                          className="p-4 bg-white"
                          style={{ maxHeight: '400px', overflowY: 'auto' }}
                          dangerouslySetInnerHTML={{ __html: generatePreviewContent() }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Text Content */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Text-Inhalt (Fallback)
                </label>
                <textarea
                  value={templateForm.text_content}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, text_content: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                  placeholder="Text-Version der E-Mail (für E-Mail-Clients ohne HTML-Unterstützung)..."
                  rows={6}
                />
              </div>

              {/* Anhänge */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Anhänge (optional)
                </label>
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">Dateien anhängen (PDF, Bilder, Dokumente)</span>
                    <input
                       type="file"
                       multiple
                       accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                       onChange={async (e) => {
                         const files = Array.from(e.target.files || []);
                         if (files.length === 0) return;
                         
                         setUploadingAttachment(true);
                         try {
                           const uploadedAttachments: Array<{ name: string; url: string; type: string; size: number; storagePath: string }> = [];
                           
                           for (const file of files) {
                             // Eindeutigen Dateinamen generieren
                             const timestamp = Date.now();
                             const randomId = Math.random().toString(36).substring(2, 15);
                             const fileExtension = file.name.split('.').pop();
                             const fileName = `email-attachments/${timestamp}-${randomId}.${fileExtension}`;
                             
                             // Datei zu Supabase Storage hochladen
                             const { data, error } = await supabase.storage
                               .from('email-attachments')
                               .upload(fileName, file, {
                                 cacheControl: '3600',
                                 upsert: false
                               });
                             
                             if (error) {
                               console.error('Supabase Upload Fehler:', error);
                               throw new Error(`Upload fehlgeschlagen für ${file.name}: ${error.message}`);
                             }
                             
                             // Öffentliche URL generieren
                             const { data: urlData } = supabase.storage
                               .from('email-attachments')
                               .getPublicUrl(fileName);
                             
                             uploadedAttachments.push({
                               name: file.name,
                               url: urlData.publicUrl,
                               type: file.type,
                               size: file.size,
                               storagePath: fileName
                             });
                           }
                           
                           setTemplateForm(prev => ({
                             ...prev,
                             attachments: [...prev.attachments, ...uploadedAttachments]
                           }));
                           
                           alert(`${uploadedAttachments.length} Datei(en) erfolgreich hochgeladen!`);
                         } catch (error) {
                           console.error('Fehler beim Hochladen:', error);
                           alert(`Fehler beim Hochladen: ${(error as Error).message}`);
                         } finally {
                           setUploadingAttachment(false);
                           e.target.value = ''; // Reset input
                         }
                       }}
                      className="hidden"
                      id="attachment-upload"
                    />
                    <label
                      htmlFor="attachment-upload"
                      className={`px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-200 transition-colors ${
                        uploadingAttachment ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploadingAttachment ? (
                        <>
                          <i className="ri-loader-4-line mr-1 animate-spin"></i>
                          Hochladen...
                        </>
                      ) : (
                        <>
                          <i className="ri-attachment-line mr-1"></i>
                          Dateien auswählen
                        </>
                      )}
                    </label>
                  </div>
                  
                  {templateForm.attachments.length > 0 && (
                    <div className="space-y-2">
                      {templateForm.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center space-x-2">
                            <i className="ri-file-line text-gray-500"></i>
                            <span className="text-sm font-medium">{attachment.name}</span>
                            <span className="text-xs text-gray-500">({(attachment.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button
                             type="button"
                             onClick={async () => {
                               const attachmentToRemove = templateForm.attachments[index];
                               
                               // Aus Supabase Storage löschen wenn storagePath vorhanden
                               if (attachmentToRemove.storagePath) {
                                 try {
                                   const { error } = await supabase.storage
                                     .from('email-attachments')
                                     .remove([attachmentToRemove.storagePath]);
                                   
                                   if (error) {
                                     console.error('Fehler beim Löschen aus Storage:', error);
                                   }
                                 } catch (error) {
                                   console.error('Storage-Löschfehler:', error);
                                 }
                               }
                               
                               // Aus Template entfernen
                               setTemplateForm(prev => ({
                                 ...prev,
                                 attachments: prev.attachments.filter((_, i) => i !== index)
                               }));
                             }}
                             className="text-red-600 hover:text-red-800 cursor-pointer"
                             title="Anhang entfernen"
                           >
                             <i className="ri-close-line"></i>
                           </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {templateForm.attachments.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      <i className="ri-attachment-line text-2xl mb-2 block"></i>
                      Keine Anhänge ausgewählt
                    </div>
                  )}
                </div>
              </div>

              {/* Template Aktivierung */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="template-active"
                    checked={templateForm.active}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, active: e.target.checked }))}
                    className="mr-3"
                  />
                  <label htmlFor="template-active" className="text-sm font-medium text-gray-700">
                    Template aktivieren
                  </label>
                </div>

                {/* Trigger-Konfiguration */}
                {templateForm.active && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-800 mb-3">Automatische Trigger</h4>
                    <div className="space-y-3">
                      
                      {/* Template-Typ Auswahl */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Template-Zielgruppe
                        </label>
                        <select
                          value={templateForm.type === 'admin_notification' ? 'admin' : 'customer'}
                          onChange={(e) => {
                            const isAdmin = e.target.value === 'admin';
                            setTemplateForm(prev => ({
                              ...prev,
                              type: isAdmin ? 'admin_notification' : 'order_confirmation'
                            }));
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                        >
                          <option value="customer">Kunde (Bestellbestätigung)</option>
                          <option value="admin">Administrator (Benachrichtigung)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {templateForm.type === 'admin_notification' 
                            ? 'Diese E-Mail wird an die Admin-E-Mail-Adresse gesendet'
                            : 'Diese E-Mail wird an den Kunden gesendet'
                          }
                        </p>
                      </div>

                      {/* Bestellbestätigung Trigger */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="trigger-order-confirmation"
                            checked={templateForm.triggers?.order_confirmation || false}
                            onChange={(e) => setTemplateForm(prev => ({
                              ...prev,
                              triggers: {
                                ...prev.triggers,
                                order_confirmation: e.target.checked
                              }
                            }))}
                            className="mr-2"
                          />
                          <label htmlFor="trigger-order-confirmation" className="text-sm text-gray-700">
                            Bei neuer Bestellung automatisch senden
                          </label>
                        </div>
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          {templateForm.type === 'admin_notification' ? 'An Admin' : 'An Kunde'}
                        </span>
                      </div>

                      {/* Versandbenachrichtigung Trigger */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="trigger-shipping-notification"
                            checked={templateForm.triggers?.shipping_notification || false}
                            onChange={(e) => setTemplateForm(prev => ({
                              ...prev,
                              triggers: {
                                ...prev.triggers,
                                shipping_notification: e.target.checked
                              }
                            }))}
                            className="mr-2"
                          />
                          <label htmlFor="trigger-shipping-notification" className="text-sm text-gray-700">
                            Bei Versand automatisch senden
                          </label>
                        </div>
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          Versandbenachrichtigung
                        </span>
                      </div>

                      {/* Kunden-Bestellstornierung Trigger */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="trigger-customer-order-cancellation"
                            checked={templateForm.triggers?.customer_order_cancellation || false}
                            onChange={(e) => setTemplateForm(prev => ({
                              ...prev,
                              triggers: {
                                ...prev.triggers,
                                customer_order_cancellation: e.target.checked
                              }
                            }))}
                            className="mr-2"
                          />
                          <label htmlFor="trigger-customer-order-cancellation" className="text-sm text-gray-700">
                            Bei Bestellstornierung an Kunde senden
                          </label>
                        </div>
                        <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                          An Kunde
                        </span>
                      </div>

                      {/* Admin-Bestellstornierung Trigger */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="trigger-admin-order-cancellation"
                            checked={templateForm.triggers?.admin_order_cancellation || false}
                            onChange={(e) => setTemplateForm(prev => ({
                              ...prev,
                              triggers: {
                                ...prev.triggers,
                                admin_order_cancellation: e.target.checked
                              }
                            }))}
                            className="mr-2"
                          />
                          <label htmlFor="trigger-admin-order-cancellation" className="text-sm text-gray-700">
                            Bei Bestellstornierung an Admin senden
                          </label>
                        </div>
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                          An Admin
                        </span>
                      </div>

                      {/* Newsletter Trigger */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="trigger-newsletter"
                            checked={templateForm.triggers?.newsletter || false}
                            onChange={(e) => setTemplateForm(prev => ({
                              ...prev,
                              triggers: {
                                ...prev.triggers,
                                newsletter: e.target.checked
                              }
                            }))}
                            className="mr-2"
                          />
                          <label htmlFor="trigger-newsletter" className="text-sm text-gray-700">
                            Als Newsletter verwenden
                          </label>
                        </div>
                        <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                          Marketing
                        </span>
                      </div>

                      {/* Lagerwarnung Trigger */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="trigger-low-stock"
                            checked={templateForm.triggers?.low_stock || false}
                            onChange={(e) => setTemplateForm(prev => ({
                              ...prev,
                              triggers: {
                                ...prev.triggers,
                                low_stock: e.target.checked
                              }
                            }))}
                            className="mr-2"
                          />
                          <label htmlFor="trigger-low-stock" className="text-sm text-gray-700">
                            Bei niedrigem Lagerbestand senden
                          </label>
                        </div>
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                          Lagerwarnung
                        </span>
                      </div>

                      {/* Ausverkauft Trigger */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="trigger-out-of-stock"
                            checked={templateForm.triggers?.out_of_stock || false}
                            onChange={(e) => setTemplateForm(prev => ({
                              ...prev,
                              triggers: {
                                ...prev.triggers,
                                out_of_stock: e.target.checked
                              }
                            }))}
                            className="mr-2"
                          />
                          <label htmlFor="trigger-out-of-stock" className="text-sm text-gray-700">
                            Bei ausverkauftem Produkt senden
                          </label>
                        </div>
                        <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                          Ausverkauft
                        </span>
                      </div>

                      {/* Loyalty Trigger Sektion */}
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <h5 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                          Loyalty-System Trigger
                        </h5>

                        {/* Punkte erhalten Trigger */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="trigger-loyalty-points-earned"
                              checked={templateForm.triggers?.loyalty_points_earned || false}
                              onChange={(e) => setTemplateForm(prev => ({
                                ...prev,
                                triggers: {
                                  ...prev.triggers,
                                  loyalty_points_earned: e.target.checked
                                }
                              }))}
                              className="mr-2"
                            />
                            <label htmlFor="trigger-loyalty-points-earned" className="text-sm text-gray-700">
                              Bei erhaltenen Loyalty-Punkten senden
                            </label>
                          </div>
                          <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                            Punkte erhalten
                          </span>
                        </div>

                        {/* Punkte eingelöst Trigger */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="trigger-loyalty-points-redeemed"
                              checked={templateForm.triggers?.loyalty_points_redeemed || false}
                              onChange={(e) => setTemplateForm(prev => ({
                                ...prev,
                                triggers: {
                                  ...prev.triggers,
                                  loyalty_points_redeemed: e.target.checked
                                }
                              }))}
                              className="mr-2"
                            />
                            <label htmlFor="trigger-loyalty-points-redeemed" className="text-sm text-gray-700">
                              Bei eingelösten Loyalty-Punkten senden
                            </label>
                          </div>
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            Punkte eingelöst
                          </span>
                        </div>

                        {/* Tier-Upgrade Trigger */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="trigger-loyalty-tier-upgrade"
                              checked={templateForm.triggers?.loyalty_tier_upgrade || false}
                              onChange={(e) => setTemplateForm(prev => ({
                                ...prev,
                                triggers: {
                                  ...prev.triggers,
                                  loyalty_tier_upgrade: e.target.checked
                                }
                              }))}
                              className="mr-2"
                            />
                            <label htmlFor="trigger-loyalty-tier-upgrade" className="text-sm text-gray-700">
                              Bei Loyalty-Tier-Upgrade senden
                            </label>
                          </div>
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                            Tier-Upgrade
                          </span>
                        </div>

                        {/* Punkte ablaufend Trigger */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="trigger-loyalty-points-expiring"
                              checked={templateForm.triggers?.loyalty_points_expiring || false}
                              onChange={(e) => setTemplateForm(prev => ({
                                ...prev,
                                triggers: {
                                  ...prev.triggers,
                                  loyalty_points_expiring: e.target.checked
                                }
                              }))}
                              className="mr-2"
                            />
                            <label htmlFor="trigger-loyalty-points-expiring" className="text-sm text-gray-700">
                              Bei ablaufenden Loyalty-Punkten senden
                            </label>
                          </div>
                          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                            Punkte ablaufend
                          </span>
                        </div>
                      </div>

                    </div>
                    
                    <div className="mt-3 p-3 bg-blue-100 rounded border border-blue-300">
                      <p className="text-xs text-blue-700">
                        <i className="ri-information-line mr-1"></i>
                        Aktivierte Trigger senden automatisch E-Mails bei entsprechenden Ereignissen.
                        Stelle sicher, dass SMTP konfiguriert ist.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex-shrink-0 p-6 border-t border-gray-200 flex justify-end space-x-4 bg-white">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                onClick={saveTemplate}
                disabled={saving || !templateForm.name || !templateForm.subject || !templateForm.html_content}
                className={`px-6 py-2 bg-[#C04020] hover:bg-[#A03318] text-white rounded-lg font-medium transition-colors cursor-pointer ${
                  saving || !templateForm.name || !templateForm.subject || !templateForm.html_content 
                    ? 'opacity-50 cursor-not-allowed' : ''
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
                    {editingTemplate ? 'Aktualisieren' : 'Erstellen'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
