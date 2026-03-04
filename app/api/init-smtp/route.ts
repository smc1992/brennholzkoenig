import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Supabase Client initialisieren
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY!
    )

    // SMTP-Einstellungen definieren
    const smtpSettings = [
      { setting_type: 'smtp', setting_key: 'smtp_host', setting_value: 'smtp.gmail.com' },
      { setting_type: 'smtp', setting_key: 'smtp_port', setting_value: '587' },
      { setting_type: 'smtp', setting_key: 'smtp_secure', setting_value: 'false' },
      { setting_type: 'smtp', setting_key: 'smtp_username', setting_value: 'test@gmail.com' },
      { setting_type: 'smtp', setting_key: 'smtp_password', setting_value: 'test-app-password' },
      { setting_type: 'smtp', setting_key: 'smtp_from_email', setting_value: 'noreply@brennholzkoenig.de' },
      { setting_type: 'smtp', setting_key: 'smtp_from_name', setting_value: 'Brennholzkönig' },
      { setting_type: 'smtp', setting_key: 'smtp_provider', setting_value: 'gmail' }
    ]

    // Einstellungen in die Datenbank einfügen
    const { data, error } = await supabase
      .from('app_settings')
      .upsert(smtpSettings, { 
        onConflict: 'setting_type,setting_key',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Fehler beim Einfügen der SMTP-Einstellungen:', error)
      return NextResponse.json(
        { success: false, message: 'Fehler beim Speichern der SMTP-Einstellungen', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'SMTP-Einstellungen erfolgreich initialisiert',
      insertedSettings: smtpSettings.length
    })

  } catch (error) {
    console.error('Unerwarteter Fehler:', error)
    return NextResponse.json(
      { success: false, message: 'Unerwarteter Fehler beim Initialisieren der SMTP-Einstellungen' },
      { status: 500 }
    )
  }
}