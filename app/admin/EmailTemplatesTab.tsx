
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface EmailTemplate {
  id?: number;
  template_key: string;
  template_name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
  is_active: boolean;
  template_type: 'order_confirmation' | 'shipping_notification' | 'admin_notification' | 'newsletter' | 'custom';
  description?: string;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    template_key: 'order_confirmation',
    template_name: 'Bestellbestätigung',
    template_type: 'order_confirmation',
    subject: 'Ihre Bestellung bei Brennholzkönig - Bestätigung #{order_id}',
    html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bestellbestätigung</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #C04020; color: white; padding: 20px; text-align: center; }
        .logo { max-width: 200px; height: auto; margin-bottom: 10px; }
        .content { padding: 30px; }
        .order-details { background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .footer { background-color: #1A1A1A; color: white; padding: 20px; text-align: center; }
        .button { background-color: #C04020; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="/images/Brennholzkönig%20transparent.webp?v=4&t=1695730300" alt="Brennholzkönig Logo" class="logo">
            <p>Premium Brennholz direkt vom Produzenten</p>
        </div>
        
        <div class="content">
            <h2>Vielen Dank für Ihre Bestellung!</h2>
            <p>Hallo {customer_name},</p>
            <p>wir haben Ihre Bestellung erfolgreich erhalten und bestätigen hiermit den Eingang.</p>
            
            <div class="order-details">
                <h3>Bestelldetails</h3>
                <p><strong>Bestellnummer:</strong> #{order_id}</p>
                <p><strong>Bestelldatum:</strong> {order_date}</p>
                <p><strong>Gesamtbetrag:</strong> {total_amount}€</p>
                <p><strong>Lieferadresse:</strong><br>
                {delivery_address}</p>
            </div>
            
            <p>Ihre Bestellung wird schnellstmöglich bearbeitet. Sie erhalten eine weitere E-Mail, sobald Ihre Bestellung versendet wurde.</p>
            
            <a href="{order_tracking_url}" class="button">Bestellung verfolgen</a>
        </div>
        
        <div class="footer">
            <p>Brennholzkönig - Ihr Partner für Premium Brennholz</p>
            <p>Bei Fragen erreichen Sie uns unter: info@brennholz-koenig.de</p>
        </div>
    </div>
</body>
</html>`,
    text_content: `Vielen Dank für Ihre Bestellung!

Hallo {customer_name},

wir haben Ihre Bestellung erfolgreich erhalten und bestätigen hiermit den Eingang.

Bestelldetails:
- Bestellnummer: #{order_id}
- Bestelldatum: {order_date}
- Gesamtbetrag: {total_amount}€
- Lieferadresse: {delivery_address}

Ihre Bestellung wird schnellstmöglich bearbeitet. Sie erhalten eine weitere E-Mail, sobald Ihre Bestellung versendet wurde.

Bestellung verfolgen: {order_tracking_url}

Brennholzkönig - Ihr Partner für Premium Brennholz
Bei Fragen erreichen Sie uns unter: info@brennholz-koenig.de`,
    variables: ['customer_name', 'order_id', 'order_date', 'total_amount', 'delivery_address', 'order_tracking_url'],
    is_active: true,
    description: 'Automatische Bestätigung nach Bestelleingang'
  },
  {
    template_key: 'shipping_notification',
    template_name: 'Versandbenachrichtigung',
    template_type: 'shipping_notification',
    subject: 'Ihre Bestellung #{order_id} ist unterwegs!',
    html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Versandbenachrichtigung</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #C04020; color: white; padding: 20px; text-align: center; }
        .logo { max-width: 200px; height: auto; margin-bottom: 10px; }
        .content { padding: 30px; }
        .shipping-info { background-color: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #C04020; }
        .footer { background-color: #1A1A1A; color: white; padding: 20px; text-align: center; }
        .button { background-color: #C04020; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="/images/Brennholzkönig%20transparent.webp?v=4&t=1695730300" alt="Brennholzkönig Logo" class="logo">
            <p>Premium Brennholz direkt vom Produzenten</p>
        </div>
        
        <div class="content">
            <h2>🚚 Ihre Bestellung ist unterwegs!</h2>
            <p>Hallo {customer_name},</p>
            <p>gute Nachrichten! Ihre Bestellung #{order_id} wurde versendet und ist nun auf dem Weg zu Ihnen.</p>
            
            <div class="shipping-info">
                <h3>Versandinformationen</h3>
                <p><strong>Tracking-Nummer:</strong> {tracking_number}</p>
                <p><strong>Versanddatum:</strong> {shipping_date}</p>
                <p><strong>Voraussichtliche Lieferung:</strong> {estimated_delivery}</p>
                <p><strong>Versandunternehmen:</strong> {shipping_company}</p>
            </div>
            
            <p>Sie können den Status Ihrer Sendung jederzeit über die Tracking-Nummer verfolgen.</p>
            
            <a href="{tracking_url}" class="button">Sendung verfolgen</a>
        </div>
        
        <div class="footer">
            <p>Brennholzkönig - Ihr Partner für Premium Brennholz</p>
            <p>Bei Fragen erreichen Sie uns unter: info@brennholz-koenig.de</p>
        </div>
    </div>
</body>
</html>`,
    text_content: `Ihre Bestellung ist unterwegs!

Hallo {customer_name},

gute Nachrichten! Ihre Bestellung #{order_id} wurde versendet und ist nun auf dem Weg zu Ihnen.

Versandinformationen:
- Tracking-Nummer: {tracking_number}
- Versanddatum: {shipping_date}
- Voraussichtliche Lieferung: {estimated_delivery}
- Versandunternehmen: {shipping_company}

Sie können den Status Ihrer Sendung jederzeit über die Tracking-Nummer verfolgen.

Sendung verfolgen: {tracking_url}

Brennholzkönig - Ihr Partner für Premium Brennholz
Bei Fragen erreichen Sie uns unter: info@brennholz-koenig.de`,
    variables: ['customer_name', 'order_id', 'tracking_number', 'shipping_date', 'estimated_delivery', 'shipping_company', 'tracking_url'],
    is_active: true,
    description: 'Benachrichtigung bei Versand der Bestellung'
  },
  {
    template_key: 'customer_order_cancellation',
    template_name: 'Kunden: Bestellstornierung',
    template_type: 'order_confirmation',
    subject: 'Ihre Bestellung #{order_number} wurde storniert',
    html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bestellstornierung</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #C04020; color: white; padding: 20px; text-align: center; }
        .logo { max-width: 200px; height: auto; margin-bottom: 10px; }
        .content { padding: 30px; }
        .cancellation-info { background-color: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107; }
        .footer { background-color: #1A1A1A; color: white; padding: 20px; text-align: center; }
        .button { background-color: #C04020; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="/images/Brennholzkönig%20transparent.webp?v=4&t=1695730300" alt="Brennholzkönig Logo" class="logo">
            <p>Premium Brennholz direkt vom Produzenten</p>
        </div>
        
        <div class="content">
            <h2>Bestellung storniert</h2>
            <p>Hallo {{customer_name}},</p>
            <p>Ihre Bestellung wurde erfolgreich storniert.</p>
            
            <div class="cancellation-info">
                <h3>Stornierte Bestellung</h3>
                <p><strong>Bestellnummer:</strong> #{{order_number}}</p>
                <p><strong>Bestelldatum:</strong> {{order_date}}</p>
                <p><strong>Stornierungsdatum:</strong> {{cancellation_date}}</p>
                <p><strong>Betrag:</strong> {{order_total}}</p>
            </div>
            
            <p>Falls Sie eine Zahlung geleistet haben, wird diese in den nächsten 3-5 Werktagen auf Ihr Konto zurückerstattet.</p>
            
            <p>Bei Fragen zur Stornierung oder Rückerstattung stehen wir Ihnen gerne zur Verfügung.</p>
            
            <a href="{{shop_url}}" class="button">Weiter einkaufen</a>
        </div>
        
        <div class="footer">
            <p>Brennholzkönig - Ihr Partner für Premium Brennholz</p>
            <p>Bei Fragen erreichen Sie uns unter: {{support_email}}</p>
        </div>
    </div>
</body>
</html>`,
    text_content: `Bestellung storniert

Hallo {{customer_name}},

Ihre Bestellung wurde erfolgreich storniert.

Stornierte Bestellung:
- Bestellnummer: #{{order_number}}
- Bestelldatum: {{order_date}}
- Stornierungsdatum: {{cancellation_date}}
- Betrag: {{order_total}}

Falls Sie eine Zahlung geleistet haben, wird diese in den nächsten 3-5 Werktagen auf Ihr Konto zurückerstattet.

Bei Fragen zur Stornierung oder Rückerstattung stehen wir Ihnen gerne zur Verfügung.

Weiter einkaufen: {{shop_url}}

Brennholzkönig - Ihr Partner für Premium Brennholz
Bei Fragen erreichen Sie uns unter: {{support_email}}`,
    variables: ['customer_name', 'order_number', 'order_date', 'cancellation_date', 'order_total', 'shop_url', 'support_email'],
    is_active: true,
    description: 'Benachrichtigung an Kunden bei Bestellstornierung (Kunde)'
  },
  {
    template_key: 'admin_order_cancellation',
    template_name: 'Admin: Bestellstornierung',
    template_type: 'admin_notification',
    subject: 'Bestellung #{order_number} wurde storniert',
    html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bestellstornierung</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #1A1A1A; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .cancellation-summary { background-color: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107; }
        .customer-info { background-color: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .button { background-color: #C04020; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>⚠️ Bestellung storniert</h2>
        </div>
        
        <div class="content">
            <h3>Stornierungsdetails</h3>
            
            <div class="cancellation-summary">
                <p><strong>Bestellnummer:</strong> #{{order_number}}</p>
                <p><strong>Bestelldatum:</strong> {{order_date}}</p>
                <p><strong>Stornierungsdatum:</strong> {{cancellation_date}}</p>
                <p><strong>Betrag:</strong> {{order_total}}</p>
                <p><strong>Status:</strong> Storniert</p>
            </div>
            
            <div class="customer-info">
                <h4>Kundeninformationen</h4>
                <p><strong>Name:</strong> {{customer_name}}</p>
                <p><strong>E-Mail:</strong> {{customer_email}}</p>
                <p><strong>Telefon:</strong> {{customer_phone}}</p>
            </div>
            
            <h4>Stornierte Artikel</h4>
            <div>{{order_items}}</div>
            
            <p><strong>Hinweis:</strong> Prüfen Sie, ob eine Rückerstattung erforderlich ist.</p>
            
            <a href="{{admin_order_url}}" class="button">Bestellung im Admin anzeigen</a>
        </div>
    </div>
</body>
</html>`,
    text_content: `Bestellung storniert

Stornierungsdetails:
- Bestellnummer: #{{order_number}}
- Bestelldatum: {{order_date}}
- Stornierungsdatum: {{cancellation_date}}
- Betrag: {{order_total}}
- Status: Storniert

Kundeninformationen:
- Name: {{customer_name}}
- E-Mail: {{customer_email}}
- Telefon: {{customer_phone}}

Stornierte Artikel:
{{order_items}}

Hinweis: Prüfen Sie, ob eine Rückerstattung erforderlich ist.

Bestellung im Admin anzeigen: {{admin_order_url}}`,
    variables: ['order_number', 'order_date', 'cancellation_date', 'order_total', 'customer_name', 'customer_email', 'customer_phone', 'order_items', 'admin_order_url'],
    is_active: true,
    description: 'Admin-Benachrichtigung bei Bestellstornierung (Admin)'
  },
  {
    template_key: 'admin_new_order',
    template_name: 'Admin: Neue Bestellung',
    template_type: 'admin_notification',
    subject: 'Neue Bestellung #{order_id} eingegangen',
    html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Neue Bestellung</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #1A1A1A; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .order-summary { background-color: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107; }
        .customer-info { background-color: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .button { background-color: #C04020; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🔔 Neue Bestellung eingegangen</h2>
        </div>
        
        <div class="content">
            <h3>Bestelldetails</h3>
            
            <div class="order-summary">
                <p><strong>Bestellnummer:</strong> #{order_id}</p>
                <p><strong>Bestelldatum:</strong> {order_date}</p>
                <p><strong>Gesamtbetrag:</strong> {total_amount}€</p>
                <p><strong>Zahlungsstatus:</strong> {payment_status}</p>
            </div>
            
            <div class="customer-info">
                <h4>Kundeninformationen</h4>
                <p><strong>Name:</strong> {customer_name}</p>
                <p><strong>E-Mail:</strong> {customer_email}</p>
                <p><strong>Telefon:</strong> {customer_phone}</p>
                <p><strong>Lieferadresse:</strong><br>{delivery_address}</p>
            </div>
            
            <h4>Bestellte Artikel</h4>
            <div>{order_items}</div>
            
            <a href="{admin_order_url}" class="button">Bestellung im Admin bearbeiten</a>
        </div>
    </div>
</body>
</html>`,
    text_content: `Neue Bestellung eingegangen

Bestelldetails:
- Bestellnummer: #{order_id}
- Bestelldatum: {order_date}
- Gesamtbetrag: {total_amount}€
- Zahlungsstatus: {payment_status}

Kundeninformationen:
- Name: {customer_name}
- E-Mail: {customer_email}
- Telefon: {customer_phone}
- Lieferadresse: {delivery_address}

Bestellte Artikel:
{order_items}

Bestellung im Admin bearbeiten: {admin_order_url}`,
    variables: ['order_id', 'order_date', 'total_amount', 'payment_status', 'customer_name', 'customer_email', 'customer_phone', 'delivery_address', 'order_items', 'admin_order_url'],
    is_active: true,
    description: 'Admin-Benachrichtigung bei neuen Bestellungen'
  }
];

export default function EmailTemplatesTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'email_template')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const parsedTemplates = data?.map((item: any) => ({
        id: item.id,
        ...JSON.parse(item.setting_value),
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || [];

      setTemplates(parsedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      setMessage('Fehler beim Laden der Templates.');
    }
  };

  const saveTemplate = async (template: EmailTemplate) => {
    setLoading(true);
    try {
      const templateData = {
        template_key: template.template_key,
        template_name: template.template_name,
        subject: template.subject,
        html_content: template.html_content,
        text_content: template.text_content,
        variables: template.variables,
        is_active: template.is_active,
        template_type: template.template_type,
        description: template.description
      };

      const { error } = await supabase
        .rpc('universal_smtp_upsert', {
          p_setting_type: 'email_template',
          p_setting_key: template.template_key,
          p_setting_value: JSON.stringify(templateData),
          p_description: `Email template: ${template.template_name}`
        });

      if (error) throw error;

      setMessage('Template erfolgreich gespeichert!');
      setIsEditing(false);
      setIsCreating(false);
      setSelectedTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      setMessage('Fehler beim Speichern des Templates.');
    }
    setLoading(false);
  };

  const createDefaultTemplates = async () => {
    setLoading(true);
    try {
      let successCount = 0;
      
      for (const template of DEFAULT_TEMPLATES) {
        try {
          const { error } = await supabase
            .rpc('universal_smtp_upsert', {
              p_setting_type: 'email_template',
              p_setting_key: template.template_key,
              p_setting_value: JSON.stringify(template),
              p_description: `Email template: ${template.template_name}`
            });

          if (!error) {
            successCount++;
          }
        } catch (err) {
          console.error(`Error creating template ${template.template_key}:`, err);
        }
      }

      setMessage(`✅ ${successCount} Standard-Templates erfolgreich erstellt! Alle verwenden die globale SMTP-Konfiguration und sind sofort einsatzbereit.`);
      loadTemplates();
    } catch (error) {
      console.error('Error creating default templates:', error);
      setMessage('Fehler beim Erstellen der Standard-Templates.');
    }
    setLoading(false);
  };

  const deleteTemplate = async (templateKey: string) => {
    if (!confirm('Möchten Sie dieses Template wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('app_settings')
        .delete()
        .eq('setting_type', 'email_template')
        .eq('setting_key', templateKey);

      if (error) throw error;

      setMessage('Template erfolgreich gelöscht!');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      setMessage('Fehler beim Löschen des Templates.');
    }
  };

  const startEditing = (template: EmailTemplate) => {
    setSelectedTemplate({ ...template });
    setIsEditing(true);
    setIsCreating(false);
  };

  const startCreating = () => {
    setSelectedTemplate({
      template_key: '',
      template_name: '',
      subject: '',
      html_content: '',
      text_content: '',
      variables: [],
      is_active: true,
      template_type: 'custom',
      description: ''
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  const cancelEditing = () => {
    setSelectedTemplate(null);
    setIsEditing(false);
    setIsCreating(false);
  };

  if (isEditing || isCreating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isCreating ? 'Neues E-Mail-Template erstellen' : 'E-Mail-Template bearbeiten'}
            </h2>
            <p className="text-gray-600">Template für automatische E-Mails konfigurieren</p>
          </div>
          <button
            onClick={cancelEditing}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Zurück
          </button>
        </div>

        {selectedTemplate && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template-Name *
                </label>
                <input
                  type="text"
                  value={selectedTemplate.template_name}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, template_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="z.B. Bestellbestätigung"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template-Key *
                </label>
                <input
                  type="text"
                  value={selectedTemplate.template_key}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, template_key: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="z.B. order_confirmation"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-Mail-Betreff *
              </label>
              <input
                type="text"
                value={selectedTemplate.subject}
                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="z.B. Ihre Bestellung #{order_id} wurde bestätigt"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTML-Inhalt *
              </label>
              <textarea
                value={selectedTemplate.html_content}
                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, html_content: e.target.value })}
                rows={15}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                placeholder="HTML-Inhalt der E-Mail..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text-Inhalt (Fallback)
              </label>
              <textarea
                value={selectedTemplate.text_content}
                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, text_content: e.target.value })}
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Text-Version der E-Mail..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template-Typ
                </label>
                <select
                  value={selectedTemplate.template_type}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, template_type: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="order_confirmation">Bestellbestätigung</option>
                  <option value="shipping_notification">Versandbenachrichtigung</option>
                  <option value="admin_notification">Admin-Benachrichtigung</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="custom">Benutzerdefiniert</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTemplate.is_active}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Template aktiv</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschreibung
              </label>
              <input
                type="text"
                value={selectedTemplate.description || ''}
                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Kurze Beschreibung des Templates"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelEditing}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => saveTemplate(selectedTemplate)}
                disabled={loading || !selectedTemplate.template_name || !selectedTemplate.template_key || !selectedTemplate.subject}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Speichere...' : 'Template speichern'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">E-Mail-Templates</h2>
          <p className="text-gray-600">Verwalten Sie Templates für automatische E-Mails</p>
        </div>
        <div className="flex space-x-3">
          {templates.length === 0 && (
            <button
              onClick={createDefaultTemplates}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Erstelle...' : 'Standard-Templates erstellen'}
            </button>
          )}
          <button
            onClick={startCreating}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <i className="ri-add-line mr-2"></i>
            Neues Template
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('✅') || message.includes('erfolgreich') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded-full mx-auto mb-4">
            <i className="ri-mail-line text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">Keine E-Mail-Templates vorhanden</h3>
          <p className="text-gray-500 mb-4">Erstellen Sie Templates für automatische E-Mails an Ihre Kunden.</p>
          <button
            onClick={createDefaultTemplates}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Erstelle...' : 'Standard-Templates erstellen'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{template.template_name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    template.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {template.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEditing(template)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Bearbeiten"
                  >
                    <i className="ri-edit-line"></i>
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.template_key)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Löschen"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Typ:</strong> {template.template_type}</p>
                <p><strong>Betreff:</strong> {template.subject.substring(0, 50)}...</p>
                <p><strong>Variablen:</strong> {template.variables.length}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
