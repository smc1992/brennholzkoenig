-- Bulk-Funktionen für Loyalty-Programm Admin

-- Funktion: Punkte für alle Mitglieder hinzufügen
CREATE OR REPLACE FUNCTION bulk_add_points(points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Punkte zu allen aktiven Mitgliedern hinzufügen
  UPDATE loyalty_members 
  SET 
    points_balance = points_balance + points_to_add,
    total_points_earned = total_points_earned + points_to_add,
    updated_at = NOW()
  WHERE points_balance >= 0; -- Nur aktive Mitglieder
  
  -- Transaktionen für alle Mitglieder erstellen
  INSERT INTO loyalty_transactions (member_id, points_change, transaction_type, reason, created_at)
  SELECT 
    id,
    points_to_add,
    'earned',
    'Bulk-Aktion: Admin-Bonus',
    NOW()
  FROM loyalty_members
  WHERE points_balance >= 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: Abgelaufene Punkte bereinigen
CREATE OR REPLACE FUNCTION cleanup_expired_points()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Abgelaufene Transaktionen löschen (älter als 2 Jahre)
  DELETE FROM loyalty_transactions 
  WHERE created_at < NOW() - INTERVAL '2 years'
  AND transaction_type = 'earned';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Punktestand für alle Mitglieder neu berechnen
  UPDATE loyalty_members 
  SET points_balance = (
    SELECT COALESCE(SUM(
      CASE 
        WHEN lt.transaction_type = 'earned' THEN lt.points_change
        WHEN lt.transaction_type = 'redeemed' THEN -lt.points_change
        ELSE 0
      END
    ), 0)
    FROM loyalty_transactions lt
    WHERE lt.member_id = loyalty_members.id
    AND lt.created_at >= NOW() - INTERVAL '2 years'
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: Tier für alle Mitglieder aktualisieren
CREATE OR REPLACE FUNCTION bulk_update_tier(new_tier TEXT)
RETURNS VOID AS $$
BEGIN
  -- Tier für alle Mitglieder aktualisieren
  UPDATE loyalty_members 
  SET 
    tier = new_tier,
    updated_at = NOW()
  WHERE tier IS DISTINCT FROM new_tier;
  
  -- Transaktionen für Tier-Änderung erstellen
  INSERT INTO loyalty_transactions (member_id, points_change, transaction_type, reason, created_at)
  SELECT 
    id,
    0,
    'tier_change',
    'Bulk-Aktion: Tier auf ' || new_tier || ' geändert',
    NOW()
  FROM loyalty_members
  WHERE tier = new_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: Loyalty-Statistiken abrufen
CREATE OR REPLACE FUNCTION get_loyalty_statistics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_members', (SELECT COUNT(*) FROM loyalty_members),
    'total_points_earned', (SELECT COALESCE(SUM(total_points_earned), 0) FROM loyalty_members),
    'total_points_redeemed', (SELECT COALESCE(SUM(total_points_redeemed), 0) FROM loyalty_members),
    'bronze_members', (SELECT COUNT(*) FROM loyalty_members WHERE tier = 'Bronze' OR tier IS NULL),
    'silver_members', (SELECT COUNT(*) FROM loyalty_members WHERE tier = 'Silber'),
    'gold_members', (SELECT COUNT(*) FROM loyalty_members WHERE tier = 'Gold'),
    'platinum_members', (SELECT COUNT(*) FROM loyalty_members WHERE tier = 'Platin'),
    'avg_points_per_member', (
      SELECT CASE 
        WHEN COUNT(*) > 0 THEN ROUND(AVG(points_balance))
        ELSE 0 
      END 
      FROM loyalty_members
    ),
    'recent_transactions', (
      SELECT COUNT(*) 
      FROM loyalty_transactions 
      WHERE created_at >= NOW() - INTERVAL '30 days'
    ),
    'top_earners', (
      SELECT json_agg(
        json_build_object(
          'member_id', lm.id,
          'customer_name', c.first_name || ' ' || c.last_name,
          'points_balance', lm.points_balance,
          'tier', lm.tier
        )
      )
      FROM loyalty_members lm
      LEFT JOIN customers c ON lm.customer_id = c.id
      ORDER BY lm.points_balance DESC
      LIMIT 5
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: Mitglied-Details mit Transaktionshistorie
CREATE OR REPLACE FUNCTION get_member_details(member_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'member', (
      SELECT json_build_object(
        'id', lm.id,
        'customer_id', lm.customer_id,
        'points_balance', lm.points_balance,
        'total_points_earned', lm.total_points_earned,
        'total_points_redeemed', lm.total_points_redeemed,
        'tier', lm.tier,
        'created_at', lm.created_at,
        'customer_name', c.first_name || ' ' || c.last_name,
        'customer_email', c.email
      )
      FROM loyalty_members lm
      LEFT JOIN customers c ON lm.customer_id = c.id
      WHERE lm.id = member_uuid
    ),
    'recent_transactions', (
      SELECT json_agg(
        json_build_object(
          'id', lt.id,
          'points_change', lt.points_change,
          'transaction_type', lt.transaction_type,
          'reason', lt.reason,
          'created_at', lt.created_at
        )
        ORDER BY lt.created_at DESC
      )
      FROM loyalty_transactions lt
      WHERE lt.member_id = member_uuid
      ORDER BY lt.created_at DESC
      LIMIT 20
    ),
    'monthly_activity', (
      SELECT json_agg(
        json_build_object(
          'month', date_trunc('month', lt.created_at),
          'earned', COALESCE(SUM(CASE WHEN lt.transaction_type = 'earned' THEN lt.points_change ELSE 0 END), 0),
          'redeemed', COALESCE(SUM(CASE WHEN lt.transaction_type = 'redeemed' THEN lt.points_change ELSE 0 END), 0)
        )
      )
      FROM loyalty_transactions lt
      WHERE lt.member_id = member_uuid
      AND lt.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY date_trunc('month', lt.created_at)
      ORDER BY date_trunc('month', lt.created_at) DESC
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Berechtigungen setzen
GRANT EXECUTE ON FUNCTION bulk_add_points(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_points() TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_tier(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_loyalty_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_member_details(UUID) TO authenticated;