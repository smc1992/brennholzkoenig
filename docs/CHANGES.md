# Änderungsprotokoll

## 2025-08-20: Produktbild-Upload-Funktion

### Hinzugefügt
- components/ProductImageUploader.tsx: Neue Komponente für direkten Bildupload
- Integration in Produkt-Formulare (Add/Edit) im Admin-Bereich

### Geändert
- app/admin/ProductManagementTab.tsx: Text-Input durch Upload-Komponente ersetzt
- app/admin/ProductsTab.tsx: Text-Input durch Upload-Komponente ersetzt

### Vorteile
- Direkter Bildupload für Produkte ohne manuelle URL-Eingabe
- Automatische Speicherung in Supabase Storage
- Automatische CDN-URL-Generierung
- Verbesserte Benutzerfreundlichkeit für Produktmanagement

## 2025-08-20: CDN-Proxy für Supabase Storage

### Hinzugefügt
- infra/cdn-proxy/ (Dockerfile + nginx.conf + README.md)
- utils/cdn.ts: Hilfsfunktion für CDN-URLs eingeführt
- next.config.js: images.remotePatterns für cdn.brennholz-koenig.de erweitert

### Geändert
- MediaManager.tsx: Supabase-Storage-URLs auf cdnUrl() umgestellt

### Vorteile
- SEO-freundliche URLs für Medien (cdn.brennholz-koenig.de statt *.supabase.co)
- Besseres Caching für statische Inhalte
- Konsistente URL-Struktur für alle Medien
- Branding-Vorteile durch eigene Domain
