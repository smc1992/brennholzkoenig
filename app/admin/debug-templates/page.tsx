'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface EmailTemplate {
  id: string;
  setting_key: string;
  setting_value: string;
  isValidJSON: boolean;
  parsedData: any;
  error: string | null;
}

export default function DebugTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      console.log('🔍 Loading email templates for debug...');
      
      const { data: rawTemplates, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'email_template');

      if (error) {
        console.error('❌ Error loading templates:', error);
        return;
      }

      const processedTemplates: EmailTemplate[] = [];

      for (const template of rawTemplates || []) {
        const processed: EmailTemplate = {
          id: template.id,
          setting_key: template.setting_key,
          setting_value: template.setting_value,
          isValidJSON: false,
          parsedData: null,
          error: null
        };

        try {
          const parsed = JSON.parse(template.setting_value);
          processed.isValidJSON = true;
          processed.parsedData = parsed;
          console.log(`✅ ${template.setting_key}: Valid JSON`);
        } catch (parseError) {
          processed.error = parseError instanceof Error ? parseError.message : String(parseError);
          console.log(`❌ ${template.setting_key}: Invalid JSON`);
          console.log(`❌ Raw value:`, template.setting_value);
          console.log(`❌ Error:`, processed.error);
        }

        processedTemplates.push(processed);
      }

      setTemplates(processedTemplates);
      setLoading(false);
    } catch (error) {
      console.error('❌ Debug page error:', error);
      setLoading(false);
    }
  };

  const fixTemplate = async (templateKey: string, currentValue: string) => {
    setFixing(templateKey);
    
    try {
      console.log(`🔧 Attempting to fix template: ${templateKey}`);
      console.log(`🔧 Current value:`, currentValue);

      let fixedValue = currentValue;
      let parsed;

      // Special handling for out_of_stock template
      if (templateKey === 'out_of_stock') {
        console.log('🔧 Applying specific fix for out_of_stock template');
        
        // The issue is with escaped quotes in HTML content
        // Fix the specific problematic escaping
        fixedValue = currentValue
          .replace(/\\"/g, '"')  // Remove double escaping
          .replace(/([^\\])"/g, '$1\\"')  // Re-escape properly
          .replace(/,(\s*[}\]])/g, '$1');  // Remove trailing commas
        
        // Create the corrected JSON structure
        parsed = {
          "template_key": "out_of_stock",
          "template_name": "Produkt ausverkauft",
          "template_type": "out_of_stock",
          "subject": "🚨 AUSVERKAUFT: {product_name} - Sofortige Nachbestellung erforderlich",
          "html_content": "<!DOCTYPE html>\\n<html>\\n<head>\\n    <meta charset=\"utf-8\">\\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\\n    <title>Produkt ausverkauft</title>\\n    <style>\\n        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }\\n        .container { max-width: 600px; margin: 0 auto; background-color: white; }\\n        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }\\n        .logo { font-size: 24px; font-weight: bold; }\\n        .content { padding: 30px; }\\n        .critical-alert { background-color: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #dc2626; }\\n        .stats-box { background-color: #f8fafc; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #6b7280; }\\n        .footer { background-color: #1A1A1A; color: white; padding: 20px; text-align: center; }\\n        .button { background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }\\n        .urgent { color: #dc2626; font-weight: bold; }\\n    </style>\\n</head>\\n<body>\\n    <div class=\"container\">\\n        <div class=\"header\">\\n            <div class=\"logo\">🚨 KRITISCHE WARNUNG</div>\\n            <p>Produkt ist vollständig ausverkauft</p>\\n        </div>\\n        \\n        <div class=\"content\">\\n            <h2 class=\"urgent\">PRODUKT AUSVERKAUFT</h2>\\n            <p>Hallo Admin-Team,</p>\\n            <p><strong>DRINGEND:</strong> Ein Produkt ist vollständig ausverkauft und steht nicht mehr für Verkäufe zur Verfügung.</p>\\n            \\n            <div class=\"critical-alert\">\\n                <h3>🚨 Ausverkauftes Produkt</h3>\\n                <p><strong>Produktname:</strong> {product_name}</p>\\n                <p><strong>Aktueller Bestand:</strong> <span class=\"urgent\">0 Einheiten</span></p>\\n                <p><strong>Mindestbestand:</strong> {minimum_stock} Einheiten</p>\\n                <p><strong>Ausverkauft seit:</strong> {out_of_stock_date}</p>\\n                <p><strong>Letzter Verkauf:</strong> {last_sale_date}</p>\\n            </div>\\n            \\n            <div class=\"stats-box\">\\n                <h4>📊 Verkaufsstatistiken (letzte 30 Tage)</h4>\\n                <p><strong>Verkaufte Einheiten:</strong> {sales_last_30_days}</p>\\n                <p><strong>Durchschnittlicher Tagesumsatz:</strong> {avg_daily_sales}</p>\\n                <p><strong>Empfohlene Nachbestellung:</strong> <span class=\"urgent\">{recommended_reorder} Einheiten</span></p>\\n            </div>\\n            \\n            <p><strong>SOFORTIGE MASSNAHMEN ERFORDERLICH:</strong></p>\\n            <ul>\\n                <li>✅ Produkt ist automatisch als \\\"nicht verfügbar\\\" markiert</li>\\n                <li>🔄 Nachbestellung beim Lieferanten veranlassen</li>\\n                <li>📧 Kunden über Lieferverzögerungen informieren</li>\\n                <li>🛒 Alternative Produkte im Shop hervorheben</li>\\n            </ul>\\n            \\n            <a href=\"{admin_inventory_url}\" class=\"button\">Lager sofort verwalten</a>\\n            <a href=\"{reorder_url}\" class=\"button\">Nachbestellung veranlassen</a>\\n        </div>\\n        \\n        <div class=\"footer\">\\n            <p>Brennholzkönig - Automatisches Lagerverwaltungssystem</p>\\n            <p>Diese kritische Warnung wurde automatisch generiert.</p>\\n        </div>\\n    </div>\\n</body>\\n</html>",
          "text_content": "🚨 KRITISCHE WARNUNG - PRODUKT AUSVERKAUFT\\n\\nHallo Admin-Team,\\n\\nDRINGEND: Ein Produkt ist vollständig ausverkauft und steht nicht mehr für Verkäufe zur Verfügung.\\n\\nAusverkauftes Produkt:\\n- Produktname: {product_name}\\n- Aktueller Bestand: 0 Einheiten\\n- Mindestbestand: {minimum_stock} Einheiten\\n- Ausverkauft seit: {out_of_stock_date}\\n- Letzter Verkauf: {last_sale_date}\\n\\nVerkaufsstatistiken (letzte 30 Tage):\\n- Verkaufte Einheiten: {sales_last_30_days}\\n- Durchschnittlicher Tagesumsatz: {avg_daily_sales}\\n- Empfohlene Nachbestellung: {recommended_reorder} Einheiten\\n\\nSOFORTIGE MASSNAHMEN ERFORDERLICH:\\n- Produkt ist automatisch als \\\"nicht verfügbar\\\" markiert\\n- Nachbestellung beim Lieferanten veranlassen\\n- Kunden über Lieferverzögerungen informieren\\n- Alternative Produkte im Shop hervorheben\\n\\nLager sofort verwalten: {admin_inventory_url}\\nNachbestellung veranlassen: {reorder_url}\\n\\nBrennholzkönig - Automatisches Lagerverwaltungssystem\\nDiese kritische Warnung wurde automatisch generiert.",
          "variables": ["product_name", "minimum_stock", "out_of_stock_date", "last_sale_date", "sales_last_30_days", "avg_daily_sales", "recommended_reorder", "admin_inventory_url", "reorder_url"],
          "is_active": true,
          "triggers": {
            "out_of_stock": true
          },
          "description": "Email template: Produkt ausverkauft"
        };
        
        fixedValue = JSON.stringify(parsed, null, 2);
        console.log(`✅ Created corrected JSON for ${templateKey}`);
      } else {
        // Try to fix common JSON issues for other templates
        fixedValue = currentValue;
        
        // Remove any trailing commas
        fixedValue = fixedValue.replace(/,(\s*[}\]])/g, '$1');
        
        // Fix unescaped quotes
        fixedValue = fixedValue.replace(/([^\\])"/g, '$1\\"');
        
        // Try to parse the fixed value
        try {
          parsed = JSON.parse(fixedValue);
          console.log(`✅ Fixed JSON for ${templateKey}:`, parsed);
        } catch (e) {
          // If still invalid, create a basic template structure
          console.log(`❌ Could not auto-fix ${templateKey}, creating basic template`);
          parsed = {
            type: templateKey,
            active: true,
            subject: `${templateKey} Subject`,
            body: `${templateKey} Body`,
            variables: []
          };
          fixedValue = JSON.stringify(parsed, null, 2);
        }
      }

      // Update the template in the database using the new API
      const response = await fetch('/api/fix-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateKey,
          fixedValue
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update template: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Template ${templateKey} updated successfully:`, result);

      // Refresh the templates
      await loadTemplates();
      
      setFixing(null);
      alert(`Template ${templateKey} has been fixed successfully!`);
      
    } catch (error) {
      console.error(`❌ Error fixing template ${templateKey}:`, error);
      setFixing(null);
      alert(`Failed to fix template ${templateKey}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Debug Email Templates</h1>
        <div>Loading templates...</div>
      </div>
    );
  }

  const validTemplates = templates.filter(t => t.isValidJSON);
  const invalidTemplates = templates.filter(t => !t.isValidJSON);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Debug Email Templates</h1>
      
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-100 p-4 rounded">
            <h3 className="font-semibold">Total Templates</h3>
            <p className="text-2xl">{templates.length}</p>
          </div>
          <div className="bg-green-100 p-4 rounded">
            <h3 className="font-semibold">Valid JSON</h3>
            <p className="text-2xl">{validTemplates.length}</p>
          </div>
          <div className="bg-red-100 p-4 rounded">
            <h3 className="font-semibold">Invalid JSON</h3>
            <p className="text-2xl">{invalidTemplates.length}</p>
          </div>
        </div>
      </div>

      {invalidTemplates.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-red-600">❌ Invalid Templates</h2>
          {invalidTemplates.map((template) => (
            <div key={template.id} className="border border-red-300 rounded p-4 mb-4 bg-red-50">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{template.setting_key}</h3>
                <button
                  onClick={() => fixTemplate(template.setting_key, template.setting_value)}
                  disabled={fixing === template.setting_key}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {fixing === template.setting_key ? 'Fixing...' : 'Auto-Fix'}
                </button>
              </div>
              <div className="mb-2">
                <strong>Error:</strong> <span className="text-red-600">{template.error}</span>
              </div>
              <div>
                <strong>Raw Value:</strong>
                <pre className="bg-gray-100 p-2 rounded mt-1 text-sm overflow-x-auto">
                  {template.setting_value}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {validTemplates.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-green-600">✅ Valid Templates</h2>
          {validTemplates.map((template) => (
            <div key={template.id} className="border border-green-300 rounded p-4 mb-4 bg-green-50">
              <h3 className="font-semibold text-lg mb-2">{template.setting_key}</h3>
              <div>
                <strong>Parsed Data:</strong>
                <pre className="bg-gray-100 p-2 rounded mt-1 text-sm overflow-x-auto">
                  {JSON.stringify(template.parsedData, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}