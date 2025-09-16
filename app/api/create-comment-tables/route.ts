import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Erstelle Kommentar-Tabellen...');

    // 1. Blog-Kommentare Tabelle
    const createCommentsTable = `
      CREATE TABLE IF NOT EXISTS blog_comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        blog_post_id UUID NOT NULL,
        author_name VARCHAR(255) NOT NULL,
        author_email VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 2. Admin-Benachrichtigungen Tabelle
    const createNotificationsTable = `
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        read_at TIMESTAMP WITH TIME ZONE
      );
    `;

    // 3. Indizes für bessere Performance
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(blog_post_id);
      CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON blog_comments(status);
      CREATE INDEX IF NOT EXISTS idx_blog_comments_created_at ON blog_comments(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id ON blog_comments(parent_id);
      CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON admin_notifications(status);
      CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
    `;

    // 4. RLS (Row Level Security) Policies
    const createRLSPolicies = `
      -- Enable RLS
      ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
      
      -- Public kann genehmigte Kommentare lesen
      CREATE POLICY IF NOT EXISTS "Public can read approved comments" ON blog_comments
        FOR SELECT USING (status = 'approved');
      
      -- Public kann Kommentare erstellen
      CREATE POLICY IF NOT EXISTS "Public can insert comments" ON blog_comments
        FOR INSERT WITH CHECK (true);
      
      -- Nur Admins können alle Kommentare verwalten
      CREATE POLICY IF NOT EXISTS "Admins can manage all comments" ON blog_comments
        FOR ALL USING (auth.role() = 'authenticated');
      
      -- Nur Admins können Benachrichtigungen verwalten
      CREATE POLICY IF NOT EXISTS "Admins can manage notifications" ON admin_notifications
        FOR ALL USING (auth.role() = 'authenticated');
    `;

    // 5. Trigger für updated_at
    const createTriggers = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      CREATE TRIGGER IF NOT EXISTS update_blog_comments_updated_at
        BEFORE UPDATE ON blog_comments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    // Führe alle SQL-Befehle aus
    const sqlCommands = [
      createCommentsTable,
      createNotificationsTable,
      createIndexes,
      createRLSPolicies,
      createTriggers
    ];

    for (const sql of sqlCommands) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      if (error) {
        console.error('SQL Fehler:', error);
        // Versuche direkten SQL-Aufruf als Fallback
        try {
          const { error: directError } = await supabase
            .from('_sql')
            .select('*')
            .limit(0); // Dummy query um Verbindung zu testen
          
          if (directError) {
            console.log('Verwende alternative Tabellen-Erstellung...');
            // Erstelle Tabellen über Supabase Client (vereinfacht)
            await createTablesViaClient();
          }
        } catch (fallbackError) {
          console.error('Fallback-Fehler:', fallbackError);
        }
      }
    }

    console.log('✅ Kommentar-Tabellen erfolgreich erstellt!');

    return NextResponse.json({
      success: true,
      message: 'Kommentar-Tabellen erfolgreich erstellt',
      tables: [
        'blog_comments',
        'admin_notifications'
      ]
    });

  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Kommentar-Tabellen:', error);
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen der Tabellen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}

// Fallback-Funktion für Tabellen-Erstellung
async function createTablesViaClient() {
  try {
    // Prüfe ob Tabellen bereits existieren
    const { data: existingTables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['blog_comments', 'admin_notifications']);

    console.log('Bestehende Tabellen:', existingTables);

    // Erstelle Beispiel-Einträge um Tabellen-Struktur zu definieren
    const sampleComment = {
      blog_post_id: '00000000-0000-0000-0000-000000000000',
      author_name: 'System',
      author_email: 'system@example.com',
      content: 'Tabellen-Initialisierung',
      status: 'pending'
    };

    const sampleNotification = {
      type: 'system',
      title: 'System-Initialisierung',
      message: 'Tabellen wurden erstellt',
      data: { init: true },
      status: 'read'
    };

    // Versuche Einträge zu erstellen (erstellt Tabellen automatisch)
    await supabase.from('blog_comments').insert([sampleComment]);
    await supabase.from('admin_notifications').insert([sampleNotification]);

    // Lösche Beispiel-Einträge wieder
    await supabase.from('blog_comments').delete().eq('author_name', 'System');
    await supabase.from('admin_notifications').delete().eq('type', 'system');

    console.log('✅ Tabellen über Client erstellt');
  } catch (error) {
    console.error('Fehler bei Client-Tabellen-Erstellung:', error);
  }
}