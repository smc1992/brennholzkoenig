-- =====================================================
-- Push-Benachrichtigungen Datenbank-Migration
-- Brennholzkönig Push Notification System
-- =====================================================

-- Diese Migration erstellt alle notwendigen Tabellen und
-- Konfigurationen für das Push-Benachrichtigungssystem

-- ANLEITUNG:
-- 1. Öffnen Sie das Supabase Dashboard
-- 2. Gehen Sie zu "SQL Editor"
-- 3. Kopieren Sie diesen gesamten Code
-- 4. Führen Sie die Migration aus

-- =====================================================
-- 1. PUSH SUBSCRIPTIONS TABELLE
-- =====================================================

-- Speichert alle Browser-Push-Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. PUSH NOTIFICATIONS TABELLE
-- =====================================================

-- Speichert alle gesendeten und geplanten Benachrichtigungen
CREATE TABLE IF NOT EXISTS push_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT DEFAULT 'general',
  target_audience TEXT DEFAULT 'all', -- 'all', 'active', 'specific'
  target_subscriptions UUID[], -- Array von Subscription IDs für 'specific'
  schedule_type TEXT DEFAULT 'immediate', -- 'immediate', 'scheduled'
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  image_url TEXT,
  action_url TEXT,
  actions JSONB, -- Array von Action-Objekten
  payload JSONB, -- Zusätzliche Daten
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. PERFORMANCE-INDIZES
-- =====================================================

-- Indizes für push_subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active 
  ON push_subscriptions(is_active);
  
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint 
  ON push_subscriptions(endpoint);
  
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created_at 
  ON push_subscriptions(created_at);

-- Indizes für push_notifications
CREATE INDEX IF NOT EXISTS idx_push_notifications_sent_at 
  ON push_notifications(sent_at);
  
CREATE INDEX IF NOT EXISTS idx_push_notifications_scheduled_at 
  ON push_notifications(scheduled_at);
  
CREATE INDEX IF NOT EXISTS idx_push_notifications_type 
  ON push_notifications(notification_type);
  
CREATE INDEX IF NOT EXISTS idx_push_notifications_created_at 
  ON push_notifications(created_at);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Aktiviere RLS für beide Tabellen
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;

-- Policy für push_subscriptions
-- Erlaubt allen authentifizierten Benutzern Zugriff
CREATE POLICY "Allow authenticated users to manage push subscriptions" 
  ON push_subscriptions
  FOR ALL 
  USING (auth.role() = 'authenticated');

-- Policy für push_notifications
-- Erlaubt allen authentifizierten Benutzern Zugriff
CREATE POLICY "Allow authenticated users to manage push notifications" 
  ON push_notifications
  FOR ALL 
  USING (auth.role() = 'authenticated');

-- =====================================================
-- 5. TRIGGER FÜR UPDATED_AT
-- =====================================================

-- Funktion für automatische updated_at Aktualisierung
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger für push_subscriptions
CREATE TRIGGER update_push_subscriptions_updated_at 
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger für push_notifications
CREATE TRIGGER update_push_notifications_updated_at 
  BEFORE UPDATE ON push_notifications
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. KOMMENTARE FÜR DOKUMENTATION
-- =====================================================

COMMENT ON TABLE push_subscriptions IS 'Speichert Web Push Subscriptions von Benutzern';
COMMENT ON TABLE push_notifications IS 'Speichert gesendete und geplante Push-Benachrichtigungen';

COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push-Service-Endpoint URL';
COMMENT ON COLUMN push_subscriptions.p256dh_key IS 'P256DH Public Key für Verschlüsselung';
COMMENT ON COLUMN push_subscriptions.auth_key IS 'Auth Secret für Authentifizierung';
COMMENT ON COLUMN push_subscriptions.is_active IS 'Ob die Subscription noch aktiv ist';

COMMENT ON COLUMN push_notifications.target_audience IS 'Zielgruppe: all, active, specific';
COMMENT ON COLUMN push_notifications.schedule_type IS 'Versandtyp: immediate, scheduled';
COMMENT ON COLUMN push_notifications.actions IS 'JSON Array von Notification Actions';
COMMENT ON COLUMN push_notifications.payload IS 'Zusätzliche Daten für die Benachrichtigung';

-- =====================================================
-- 7. INITIAL PUSH CONFIG IN APP_SETTINGS
-- =====================================================

-- Füge Push-Konfiguration zu app_settings hinzu (falls Tabelle existiert)
INSERT INTO app_settings (setting_type, setting_key, setting_value, created_at, updated_at)
VALUES (
  'push_config',
  'main',
  '{
    "enabled": false,
    "vapidPublicKey": "",
    "vapidPrivateKey": "",
    "maxSubscriptions": 10000,
    "retryAttempts": 3,
    "ttl": 86400
  }',
  NOW(),
  NOW()
)
ON CONFLICT (setting_type, setting_key) DO NOTHING;

-- =====================================================
-- MIGRATION ABGESCHLOSSEN
-- =====================================================

-- Überprüfe ob alle Tabellen erstellt wurden
SELECT 
  'push_subscriptions' as table_name,
  COUNT(*) as row_count
FROM push_subscriptions
UNION ALL
SELECT 
  'push_notifications' as table_name,
  COUNT(*) as row_count
FROM push_notifications;

-- Zeige alle Indizes an
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('push_subscriptions', 'push_notifications')
ORDER BY tablename, indexname;

-- =====================================================
-- ERFOLGSMELDUNG
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Push-Benachrichtigungen Migration erfolgreich abgeschlossen!';
  RAISE NOTICE '📋 Erstellt:';
  RAISE NOTICE '   - push_subscriptions Tabelle';
  RAISE NOTICE '   - push_notifications Tabelle';
  RAISE NOTICE '   - Performance-Indizes';
  RAISE NOTICE '   - RLS-Policies';
  RAISE NOTICE '   - Updated-At Trigger';
  RAISE NOTICE '🚀 Push-Benachrichtigungssystem ist bereit!';
END $$;