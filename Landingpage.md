Projekt-Instruktion: Städte-Landingpage-Generator für
Next.js + Supabase
Dieses Dokument beschreibt die vollständige Instruktion für den Web-Coding-Assistenten, um einen
städtebezogenen Landingpage-Generator in eine bestehende Next.js/Supabase-Webshop-Anwendung zu
integrieren. Die Landingpages sollen das **Design und UX der Hauptseite erben**, damit ein konsistentes
Look & Feel besteht. Die Seiten werden für Local SEO optimiert und generieren eigenständige Inhalte je
Stadt.
1) Architektur & Ziel
Die Anwendung basiert auf Next.js (App Router) und Supabase. Es soll eine Funktion entstehen, die für jede
Stadt eine Landingpage nach demselben Design wie die Hauptseite erstellt. Alle UI-Komponenten (Header,
Footer, Buttons, Typografie, Farbwelt) werden übernommen.
2) Datenmodell Supabase
Tabelle `city_pages` (Slug, Stadt, Keyword, Städtetext, Hero-Bild, Shop-Link, Meta-Daten). RLS an: Public
darf nur veröffentlichte Seiten (`status='published'`) lesen. Admins verwalten CRUD im Dashboard.
3) Admin-Dashboard
Im Admin-Backend gibt es einen Menüpunkt „Städte-Landingpages“. Hier kann der Admin neue Seiten
anlegen, Texte eingeben, Bilder hochladen und Inhalte veröffentlichen. Das UI folgt dem bestehenden
Admin-Design.
4) Rendering
Neue Route: `/[slug]`. Beispiel: `/brennholz-stuttgart`. Seite rendert mit SSR/ISR, nutzt Komponenten aus der
Hauptseite (Hero-Bereich, Karten, Buttons). Design wird vollständig geerbt.
5) SEO & Content
Jede Seite erhält eigene Meta-Tags (Title, Description), Canonical, OpenGraph, und strukturierte Daten
(JSON-LD LocalBusiness). Der Städtetext wird individuell gepflegt, um Duplicate Content zu vermeiden.
6) Inhalte & Template
Die Inhalte basieren auf Template-Blöcken (Hero, USP-Boxen, Textabschnitte, FAQs, Call-to-Action).
Städtetext + Hero-Bild sind variabel. Alle Blöcke nutzen die vorhandenen UI-Komponenten.
7) On-Demand Revalidation
Beim Veröffentlichen triggert das Backend `/api/revalidate-city?slug=...`, damit die Landingpage sofort
aktualisiert wird.
8) Design-Vererbung
Wichtig: Der Assistent muss sicherstellen, dass alle neuen Landingpages automatisch das Design der
Hauptseite erben. Das betrifft: Farbpalette, Typografie, Header/Footer, Buttons, Container, Grid-System. Die
Landingpages unterscheiden sich nur in Content (Text/Bilder), nicht in Layout.
9) Akzeptanzkriterien
• Admin kann in <2 Minuten eine Seite erstellen und publizieren. • Landingpage nutzt exakt das
Hauptseiten-Design. • Lighthouse SEO 􂉥 90. • Sitemap wird aktualisiert. • Texte sind unique je Stadt