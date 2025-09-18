-- SMTP-Einstellungen für lokale Entwicklung hinzufügen
INSERT INTO smtp_settings (
  name,
  host,
  port,
  secure,
  auth_user,
  auth_pass,
  from_name,
  from_email,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Local Development SMTP',
  'smtp.gmail.com',
  587,
  false,
  'test@gmail.com',
  'test-password',
  'Brennholzkönig',
  'noreply@brennholzkoenig.de',
  true,
  NOW(),
  NOW()
) ON CONFLICT (name) DO UPDATE SET
  host = EXCLUDED.host,
  port = EXCLUDED.port,
  secure = EXCLUDED.secure,
  auth_user = EXCLUDED.auth_user,
  auth_pass = EXCLUDED.auth_pass,
  from_name = EXCLUDED.from_name,
  from_email = EXCLUDED.from_email,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();