-- SMTP-Einstellungen für app_settings Tabelle
INSERT INTO app_settings (setting_type, setting_key, setting_value, created_at, updated_at) VALUES
('smtp', 'smtp_host', 'smtp.gmail.com', NOW(), NOW()),
('smtp', 'smtp_port', '587', NOW(), NOW()),
('smtp', 'smtp_secure', 'false', NOW(), NOW()),
('smtp', 'smtp_username', 'test@gmail.com', NOW(), NOW()),
('smtp', 'smtp_password', 'test-app-password', NOW(), NOW()),
('smtp', 'smtp_from_email', 'noreply@brennholzkoenig.de', NOW(), NOW()),
('smtp', 'smtp_from_name', 'Brennholzkönig', NOW(), NOW()),
('smtp', 'smtp_provider', 'gmail', NOW(), NOW())
ON CONFLICT (setting_type, setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();