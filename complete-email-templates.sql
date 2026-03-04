-- Vollständige E-Mail-Templates für Brennholzkönig
-- Diese Templates werden in der app_settings Tabelle mit setting_type 'email_template' gespeichert

-- Template 3: Versandbenachrichtigung
INSERT INTO app_settings (setting_type, setting_key, setting_value, description, created_at, updated_at) VALUES
('email_template', 'shipping_notification', '{
  "template_key": "shipping_notification",
  "template_name": "Versandbenachrichtigung",
  "template_type": "shipping_notification",
  "subject": "Ihre Bestellung #{order_id} wurde versendet",
  "html_content": "<!DOCTYPE html>\n<html>\n<head>\n    <meta charset=\"utf-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Versandbenachrichtigung</title>\n    <style>\n        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }\n        .container { max-width: 600px; margin: 0 auto; background-color: white; }\n        .header { background-color: #C04020; color: white; padding: 20px; text-align: center; }
        .logo { max-width: 200px; height: auto; }\n        .content { padding: 30px; }\n        .shipping-info { background-color: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #C04020; }
        .footer { background-color: #1A1A1A; color: white; padding: 20px; text-align: center; }
        .button { background-color: #C04020; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }\n    </style>\n</head>\n<body>\n    <div class=\"container\">\n        <div class=\"header\">\n            <img src=\"/images/Brennholzkönig%20transparent.webp?v=4&t=1695730300\" alt=\"Brennholzkönig Logo\" class=\"logo\">\n            <p>Ihre Bestellung ist unterwegs!</p>\n        </div>\n        \n        <div class=\"content\">\n            <h2>Versandbestätigung</h2>\n            <p>Hallo {customer_name},</p>\n            <p>gute Nachrichten! Ihre Bestellung wurde soeben versendet und ist auf dem Weg zu Ihnen.</p>\n            \n            <div class=\"shipping-info\">\n                <h3>Versandinformationen</h3>\n                <p><strong>Bestellnummer:</strong> #{order_id}</p>\n                <p><strong>Versanddatum:</strong> {shipping_date}</p>\n                <p><strong>Tracking-Nummer:</strong> {tracking_number}</p>\n                <p><strong>Versandunternehmen:</strong> {shipping_company}</p>\n                <p><strong>Voraussichtliche Lieferung:</strong> {estimated_delivery}</p>\n            </div>\n            \n            <p>Sie können den Status Ihrer Sendung jederzeit über die Tracking-Nummer verfolgen.</p>\n            \n            <a href=\"{tracking_url}\" class=\"button\">Sendung verfolgen</a>\n        </div>\n        \n        <div class=\"footer\">\n            <p>Brennholzkönig - Ihr Partner für Premium Brennholz</p>\n            <p>Bei Fragen erreichen Sie uns unter: info@brennholz-koenig.de</p>\n        </div>\n    </div>\n</body>\n</html>",
  "text_content": "Versandbestätigung\n\nHallo {customer_name},\n\ngute Nachrichten! Ihre Bestellung wurde soeben versendet und ist auf dem Weg zu Ihnen.\n\nVersandinformationen:\n- Bestellnummer: #{order_id}\n- Versanddatum: {shipping_date}\n- Tracking-Nummer: {tracking_number}\n- Versandunternehmen: {shipping_company}\n- Voraussichtliche Lieferung: {estimated_delivery}\n\nSie können den Status Ihrer Sendung jederzeit über die Tracking-Nummer verfolgen.\n\nSendung verfolgen: {tracking_url}\n\nBrennholzkönig - Ihr Partner für Premium Brennholz\nBei Fragen erreichen Sie uns unter: info@brennholz-koenig.de",
  "variables": ["customer_name", "order_id", "shipping_date", "tracking_number", "shipping_company", "estimated_delivery", "tracking_url"],
  "is_active": true,
  "triggers": {
    "shipping_notification": true
  },
  "description": "Benachrichtigung bei Versand der Bestellung"
}', 'Email template: Versandbenachrichtigung', NOW(), NOW())
ON CONFLICT (setting_type, setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- Template 4: Newsletter
INSERT INTO app_settings (setting_type, setting_key, setting_value, description, created_at, updated_at) VALUES
('email_template', 'newsletter', '{
  "template_key": "newsletter",
  "template_name": "Newsletter Premium",
  "template_type": "newsletter",
  "subject": "🔥 Brennholzkönig Newsletter - {newsletter_title}",
  "html_content": "<!DOCTYPE html>\n<html>\n<head>\n    <meta charset=\"utf-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Newsletter</title>\n    <style>\n        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }\n        .container { max-width: 600px; margin: 0 auto; background-color: white; }\n        .header { background-color: #C04020; color: white; padding: 20px; text-align: center; }\n        .logo { max-width: 200px; height: auto; }\n        .content { padding: 30px; }\n        .newsletter-content { background-color: #f8fafc; padding: 20px; margin: 20px 0; border-radius: 8px; }\n        .footer { background-color: #1A1A1A; color: white; padding: 20px; text-align: center; }\n        .button { background-color: #C04020; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }\n        .unsubscribe { font-size: 12px; color: #666; margin-top: 20px; }\n    </style>\n</head>\n<body>\n    <div class=\"container\">\n        <div class=\"header\">\n            <img src=\"/images/Brennholzkönig%20transparent.webp?v=4&t=1695730300\" alt=\"Brennholzkönig Logo\" class=\"logo\">\n            <p>Premium Brennholz News & Angebote</p>\n        </div>\n        \n        <div class=\"content\">\n            <h2>{newsletter_title}</h2>\n            <p>Hallo {customer_name},</p>\n            \n            <div class=\"newsletter-content\">\n                {newsletter_content}\n            </div>\n            \n            <p>Vielen Dank, dass Sie Teil der Brennholzkönig-Familie sind!</p>\n            \n            <a href=\"{website_url}\" class=\"button\">Jetzt einkaufen</a>\n            \n            <div class=\"unsubscribe\">\n                <p>Sie erhalten diese E-Mail, weil Sie sich für unseren Newsletter angemeldet haben.</p>\n                <p><a href=\"{unsubscribe_url}\">Hier abmelden</a> | Newsletter-Datum: {newsletter_date}</p>\n            </div>\n        </div>\n        \n        <div class=\"footer\">\n            <p>Brennholzkönig - Ihr Partner für Premium Brennholz</p>\n            <p>Bei Fragen erreichen Sie uns unter: info@brennholz-koenig.de</p>\n        </div>\n    </div>\n</body>\n</html>",
  "text_content": "{newsletter_title}\n\nHallo {customer_name},\n\n{newsletter_content}\n\nVielen Dank, dass Sie Teil der Brennholzkönig-Familie sind!\n\nJetzt einkaufen: {website_url}\n\nSie erhalten diese E-Mail, weil Sie sich für unseren Newsletter angemeldet haben.\nHier abmelden: {unsubscribe_url}\nNewsletter-Datum: {newsletter_date}\n\nBrennholzkönig - Ihr Partner für Premium Brennholz\nBei Fragen erreichen Sie uns unter: info@brennholz-koenig.de",
  "variables": ["customer_name", "newsletter_title", "newsletter_content", "website_url", "unsubscribe_url", "newsletter_date"],
  "is_active": true,
  "triggers": {
    "newsletter": true
  },
  "description": "Newsletter-Template für Marketing-E-Mails"
}', 'Email template: Newsletter Premium', NOW(), NOW())
ON CONFLICT (setting_type, setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- Template 5: Lagerbestand Warnung
INSERT INTO app_settings (setting_type, setting_key, setting_value, description, created_at, updated_at) VALUES
('email_template', 'low_stock', '{
  "template_key": "low_stock",
  "template_name": "Lagerbestand Warnung",
  "template_type": "low_stock",
  "subject": "⚠️ Niedriger Lagerbestand: {product_name}",
  "html_content": "<!DOCTYPE html>\n<html>\n<head>\n    <meta charset=\"utf-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Lagerbestand Warnung</title>\n    <style>\n        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }\n        .container { max-width: 600px; margin: 0 auto; background-color: white; }\n        .header { background-color: #C04020; color: white; padding: 20px; text-align: center; }\n        .logo { max-width: 200px; height: auto; }\n        .content { padding: 30px; }\n        .alert-box { background-color: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #C04020; }\n        .footer { background-color: #1A1A1A; color: white; padding: 20px; text-align: center; }\n        .button { background-color: #C04020; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }\n    </style>\n</head>\n<body>\n    <div class=\"container\">\n        <div class=\"header\">\n            <img src=\"/images/Brennholzkönig%20transparent.webp?v=4&t=1695730300\" alt=\"Brennholzkönig Logo\" class=\"logo\">\n            <p>Niedriger Lagerbestand erkannt</p>\n        </div>\n        \n        <div class=\"content\">\n            <h2>Lagerbestand-Warnung</h2>\n            <p>Hallo Admin-Team,</p>\n            <p>der Lagerbestand für ein Produkt ist unter den kritischen Wert gefallen und benötigt Ihre Aufmerksamkeit.</p>\n            \n            <div class=\"alert-box\">\n                <h3>Produktinformationen</h3>\n                <p><strong>Produktname:</strong> {product_name}</p>\n                <p><strong>Aktueller Bestand:</strong> {current_stock} Einheiten</p>\n                <p><strong>Mindestbestand:</strong> {minimum_stock} Einheiten</p>\n                <p><strong>Empfohlene Nachbestellung:</strong> {recommended_reorder} Einheiten</p>\n                <p><strong>Letzter Verkauf:</strong> {last_sale_date}</p>\n            </div>\n            \n            <p>Bitte prüfen Sie den Lagerbestand und bestellen Sie bei Bedarf nach, um Lieferengpässe zu vermeiden.</p>\n            \n            <a href=\"{admin_inventory_url}\" class=\"button\">Lager verwalten</a>\n        </div>\n        \n        <div class=\"footer\">\n            <p>Brennholzkönig - Automatisches Lagerverwaltungssystem</p>\n            <p>Diese E-Mail wurde automatisch generiert.</p>\n        </div>\n    </div>\n</body>\n</html>",
  "text_content": "Lagerbestand-Warnung\n\nHallo Admin-Team,\n\nder Lagerbestand für ein Produkt ist unter den kritischen Wert gefallen und benötigt Ihre Aufmerksamkeit.\n\nProduktinformationen:\n- Produktname: {product_name}\n- Aktueller Bestand: {current_stock} Einheiten\n- Mindestbestand: {minimum_stock} Einheiten\n- Empfohlene Nachbestellung: {recommended_reorder} Einheiten\n- Letzter Verkauf: {last_sale_date}\n\nBitte prüfen Sie den Lagerbestand und bestellen Sie bei Bedarf nach, um Lieferengpässe zu vermeiden.\n\nLager verwalten: {admin_inventory_url}\n\nBrennholzkönig - Automatisches Lagerverwaltungssystem\nDiese E-Mail wurde automatisch generiert.",
  "variables": ["product_name", "current_stock", "minimum_stock", "recommended_reorder", "last_sale_date", "admin_inventory_url"],
  "is_active": true,
  "triggers": {
    "low_stock": true
  },
  "description": "Warnung bei niedrigem Lagerbestand"
}', 'Email template: Lagerbestand Warnung', NOW(), NOW())
ON CONFLICT (setting_type, setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- Template 6: Willkommen Neukunde
INSERT INTO app_settings (setting_type, setting_key, setting_value, description, created_at, updated_at) VALUES
('email_template', 'welcome', '{
  "template_key": "welcome",
  "template_name": "Willkommen Neukunde",
  "template_type": "welcome",
  "subject": "Willkommen bei Brennholzkönig, {customer_name}! 🔥",
  "html_content": "<!DOCTYPE html>\n<html>\n<head>\n    <meta charset=\"utf-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Willkommen</title>\n    <style>\n        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }\n        .container { max-width: 600px; margin: 0 auto; background-color: white; }\n        .header { background-color: #C04020; color: white; padding: 20px; text-align: center; }\n        .logo { max-width: 200px; height: auto; }\n        .content { padding: 30px; }\n        .welcome-box { background-color: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #C04020; }\n        .benefits { background-color: #f8fafc; padding: 20px; margin: 20px 0; border-radius: 8px; }\n        .footer { background-color: #1A1A1A; color: white; padding: 20px; text-align: center; }\n        .button { background-color: #C04020; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }\n    </style>\n</head>\n<body>\n    <div class=\"container\">\n        <div class=\"header\">\n            <img src=\"/images/Brennholzkönig%20transparent.webp?v=4&t=1695730300\" alt=\"Brennholzkönig Logo\" class=\"logo\">\n            <p>Premium Brennholz direkt vom Produzenten</p>\n        </div>\n        \n        <div class=\"content\">\n            <h2>Herzlich willkommen, {customer_name}!</h2>\n            <p>Vielen Dank für Ihre Registrierung bei Brennholzkönig. Wir freuen uns, Sie als neuen Kunden begrüßen zu dürfen!</p>\n            \n            <div class=\"welcome-box\">\n                <h3>Ihre Vorteile als Brennholzkönig-Kunde:</h3>\n                <ul>\n                    <li>✅ Premium Brennholz in bester Qualität</li>\n                    <li>✅ Schnelle und zuverlässige Lieferung</li>\n                    <li>✅ Persönlicher Kundenservice</li>\n                    <li>✅ Exklusive Angebote und Rabatte</li>\n                    <li>✅ Nachhaltige Forstwirtschaft</li>\n                </ul>\n            </div>\n            \n            <div class=\"benefits\">\n                <h4>🎁 Willkommensbonus</h4>\n                <p>Als Dankeschön erhalten Sie <strong>10% Rabatt</strong> auf Ihre erste Bestellung!</p>\n                <p><strong>Gutscheincode:</strong> WILLKOMMEN10</p>\n            </div>\n            \n            <p>Stöbern Sie jetzt in unserem Sortiment und entdecken Sie unser hochwertiges Brennholz.</p>\n            \n            <a href=\"{shop_url}\" class=\"button\">Jetzt einkaufen</a>\n        </div>\n        \n        <div class=\"footer\">\n            <p>Brennholzkönig - Ihr Partner für Premium Brennholz</p>\n            <p>Bei Fragen erreichen Sie uns unter: info@brennholz-koenig.de</p>\n        </div>\n    </div>\n</body>\n</html>",
  "text_content": "Herzlich willkommen bei Brennholzkönig!\n\nHallo {customer_name},\n\nvielen Dank für Ihre Registrierung bei Brennholzkönig. Wir freuen uns, Sie als neuen Kunden begrüßen zu dürfen!\n\nIhre Vorteile als Brennholzkönig-Kunde:\n- Premium Brennholz in bester Qualität\n- Schnelle und zuverlässige Lieferung\n- Persönlicher Kundenservice\n- Exklusive Angebote und Rabatte\n- Nachhaltige Forstwirtschaft\n\nWillkommensbonus:\nAls Dankeschön erhalten Sie 10% Rabatt auf Ihre erste Bestellung!\nGutscheincode: WILLKOMMEN10\n\nStöbern Sie jetzt in unserem Sortiment und entdecken Sie unser hochwertiges Brennholz.\n\nJetzt einkaufen: {shop_url}\n\nBrennholzkönig - Ihr Partner für Premium Brennholz\nBei Fragen erreichen Sie uns unter: info@brennholz-koenig.de",
  "variables": ["customer_name", "shop_url"],
  "is_active": true,
  "triggers": {
    "welcome": true
  },
  "description": "Willkommens-E-Mail für neue Kunden"
}', 'Email template: Willkommen Neukunde', NOW(), NOW())
ON CONFLICT (setting_type, setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();