# Coolify Setup für Dockerfile-basiertes Deployment

## 🚀 Schritt-für-Schritt Anleitung

### ✅ 1. Deployment-Methode auf Dockerfile umstellen

1. **Gehen Sie zu Ihrem Coolify-Projekt**
2. **Öffnen Sie die Projekt-Einstellungen**
3. **Suchen Sie nach "Build Pack" oder "Deployment Method"**
4. **Wählen Sie "Dockerfile" statt "Nixpacks"**
5. **Speichern Sie die Änderungen**

### ✅ 2. Build Arguments konfigurieren

**In Coolify müssen Sie die Umgebungsvariablen als Build-Args übergeben:**

1. **Suchen Sie nach "Build Arguments" oder "Build Args"**
2. **Fügen Sie folgende Build-Args hinzu:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tmxhamdyrjuxwnskgfka.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteGhhbWR5cmp1eHduc2tnZmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTgyMjksImV4cCI6MjA3MDQ5NDIyOX0.Nj4plTbNMvPF1fqEXffWXnS6TBJUpHETM1JE6BK7odk
NEXT_PUBLIC_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteGhhbWR5cmp1eHduc2tnZmthIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODIyOSwiZXhwIjoyMDcwNDk0MjI5fQ.FCMhRj9GPlXGsnZBfwLdCbFF79uTVDHTf-SOAnoP72Y
NEXT_PUBLIC_SITE_URL=https://brennholz-koenig.de
```

### ✅ 3. Environment Variables (Runtime) beibehalten

**Lassen Sie die bestehenden Environment Variables für Runtime:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tmxhamdyrjuxwnskgfka.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteGhhbWR5cmp1eHduc2tnZmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTgyMjksImV4cCI6MjA3MDQ5NDIyOX0.Nj4plTbNMvPF1fqEXffWXnS6TBJUpHETM1JE6BK7odk
NEXT_PUBLIC_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteGhhbWR5cmp1eHduc2tnZmthIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODIyOSwiZXhwIjoyMDcwNDk0MjI5fQ.FCMhRj9GPlXGsnZBfwLdCbFF79uTVDHTf-SOAnoP72Y
NEXT_PUBLIC_SITE_URL=https://brennholz-koenig.de
```

### ✅ 4. Deployment starten

1. **Speichern Sie alle Änderungen**
2. **Starten Sie ein neues Deployment**
3. **Beobachten Sie die Build-Logs**

## 🎯 Erwartetes Ergebnis

### ✅ Erfolgreicher Build:
```bash
# Build-Logs sollten zeigen:
✅ Supabase environment variables loaded
✅ npm run build successful
✅ All pages generated
✅ Deployment successful
```

### ❌ Falls Build fehlschlägt:
```bash
# Prüfen Sie:
1. Sind Build-Args korrekt konfiguriert?
2. Ist Dockerfile als Deployment-Methode ausgewählt?
3. Sind die Umgebungsvariablen-Werte korrekt?
```

## 📋 Troubleshooting

### Problem: "Build Args not found"
- **Lösung:** Prüfen Sie, ob Coolify Build-Args unterstützt
- **Alternative:** Kontaktieren Sie Coolify-Support

### Problem: "Dockerfile not found"
- **Lösung:** Stellen Sie sicher, dass Dockerfile im Root-Verzeichnis liegt
- **Prüfen:** Git-Repository enthält das aktualisierte Dockerfile

### Problem: "Environment variables still missing"
- **Lösung:** Sowohl Build-Args ALS AUCH Environment Variables müssen gesetzt sein
- **Build-Args:** Für Build-Zeit (npm run build)
- **Environment Variables:** Für Runtime

## 🚀 Nach erfolgreichem Deployment

**Testen Sie:**
1. ✅ Homepage lädt ohne Fehler
2. ✅ Admin-Login funktioniert
3. ✅ API-Routen antworten
4. ✅ Keine Mock-Client-Warnungen in Console

**Die Anwendung sollte jetzt vollständig funktionsfähig sein!** 🎉