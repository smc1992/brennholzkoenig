-- Push Subscriptions Tabelle
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

-- Push Notifications Tabelle
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

-- Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created_at ON push_subscriptions(created_at);

CREATE INDEX IF NOT EXISTS idx_push_notifications_sent_at ON push_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_push_notifications_scheduled_at ON push_notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_push_notifications_type ON push_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_push_notifications_created_at ON push_notifications(created_at);

-- RLS (Row Level Security) Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;

-- Policy für push_subscriptions (nur für authentifizierte Benutzer)
CREATE POLICY "Allow authenticated users to manage push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.role() = 'authenticated');

-- Policy für push_notifications (nur für authentifizierte Benutzer)
CREATE POLICY "Allow authenticated users to manage push notifications" ON push_notifications
  FOR ALL USING (auth.role() = 'authenticated');

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_notifications_updated_at BEFORE UPDATE ON push_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Kommentare für Dokumentation
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