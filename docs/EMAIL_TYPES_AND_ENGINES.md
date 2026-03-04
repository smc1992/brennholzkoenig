# E-Mail-Typen und verwendete Engines

Ziel: Übersicht, welche E-Mails über die Admin-Templates (Email System Tab) via Trigger-Engine laufen und welche direkt über den SMTP-E-Mail-Service gesendet werden.

## Engines im Überblick

- Email Trigger Engine (`lib/emailTriggerEngine.ts`)
  - Nutzt Templates aus der Admin „Email System Tab“ (App-Einstellung `app_settings`, `setting_type = 'email_template'`).
  - Sendet mit `sendTemplateEmail` (Produktiv) bzw. partiell `sendTemplateEmailTest` (Debug/Test).
  - Aktivierung pro Template über `template.active` oder `template.triggers`.

- Email Template Engine (`lib/emailTemplateEngine.ts`)
  - Lädt/normalisiert Templates aus `app_settings`.
  - Ersetzt Platzhalter und übergibt an Versandfunktionen.

- Direkter SMTP E-Mail-Service (`lib/emailService.ts` bzw. `lib/services/nodemailerService.ts`)
  - Versendet einfache Mails ohne Trigger/Template-Logik.
  - Wird für generische/Debug-/Spezialfälle genutzt.

## Mapping: E-Mail-Typ → Engine

- Bestellung
  - `order_confirmation` → Trigger Engine + Admin-Template
  - `shipping_notification` → Trigger Engine + Admin-Template
  - `customer_order_cancellation` → Trigger Engine + Admin-Template
  - `admin_order_cancellation` → Trigger Engine + Admin-Template

- Lager/Bestand
  - `low_stock` → Trigger Engine + Admin-Template
  - `out_of_stock` → Trigger Engine + Admin-Template

- Newsletter
  - `newsletter` → Trigger Engine + Admin-Template (Empfängerliste aus `newsletter_subscribers`)

- Loyalty (Treueprogramm)
  - `loyalty_points_earned` → Trigger Engine + Admin-Template
  - `loyalty_points_redeemed` → Trigger Engine + Admin-Template
  - `loyalty_tier_upgrade` → Trigger Engine + Admin-Template
  - `loyalty_points_expiring` → Trigger Engine + Admin-Template
  - API-Route: `/api/send-loyalty-notification` ruft je nach Event die passende Trigger-Funktion auf

- Support/Allgemein/Debug
  - `app/api/send-email` → Direkter SMTP-Service (ohne Admin-Template)
  - `app/api/debug-email-send` → Direkter SMTP-Service (Debug/Verbindungstest)
  - `app/api/support/email-notification` → Direkter SMTP-Service (Support-Fälle)
  - `app/api/test-send-template` → Template Engine (Testversand eines Template-Typs)
  - `app/api/test-email-triggers` → Trigger Engine (Testen mehrerer Trigger)

## Technische Hinweise zur Entkopplung

- Server-Only: Die E-Mail-Module sind mit `import 'server-only';` gekennzeichnet, damit keine Node-Core-Module in Client-Bundles gelangen.
- Loyalty-Service: `lib/loyaltyService.ts` löst Benachrichtigungen über Events und ruft `/api/send-loyalty-notification` (Trigger Engine) statt direkte HTML-Mails.
- Templates: Aktivierung und Variablenpflege erfolgen in der Admin „Email System Tab“. Die Trigger-Engine lädt nur aktive Templates.

## Relevante Dateien

- `lib/emailTriggerEngine.ts` (Trigger-Logik und Versand über Templates)
- `lib/emailTemplateEngine.ts` (Template-Lookup und Platzhalterersetzung)
- `lib/emailService.ts`, `lib/services/nodemailerService.ts` (direkter SMTP-Versand)
- `app/admin/EmailSystemTab.tsx` (Verwaltung der Templates)
- `app/api/send-loyalty-notification/route.ts` (Event-basierte Loyalty-Benachrichtigung)