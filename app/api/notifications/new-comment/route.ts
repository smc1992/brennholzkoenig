import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { comment, blogPostTitle, type } = await request.json();

    // Speichere Benachrichtigung in der Datenbank
    const notification = {
      type: 'new_comment',
      title: 'Neuer Blog-Kommentar',
      message: `Neuer Kommentar von ${comment.author_name} zu "${blogPostTitle}"`,
      data: {
        comment_id: comment.id,
        blog_post_id: comment.blog_post_id,
        author_name: comment.author_name,
        author_email: comment.author_email,
        content: comment.content.substring(0, 200) + (comment.content.length > 200 ? '...' : ''),
        blog_post_title: blogPostTitle
      },
      status: 'unread',
      created_at: new Date().toISOString()
    };

    const { error: notificationError } = await supabase
      .from('admin_notifications')
      .insert([notification]);

    if (notificationError) {
      console.error('Fehler beim Speichern der Benachrichtigung:', notificationError);
    }

    // Optional: E-Mail-Benachrichtigung an Admin senden
    try {
      await sendEmailNotification(comment, blogPostTitle);
    } catch (emailError) {
      console.error('Fehler beim Senden der E-Mail-Benachrichtigung:', emailError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Benachrichtigung erfolgreich gesendet' 
    });

  } catch (error) {
    console.error('Fehler bei der Kommentar-Benachrichtigung:', error);
    return NextResponse.json(
      { error: 'Fehler beim Senden der Benachrichtigung' },
      { status: 500 }
    );
  }
}

async function sendEmailNotification(comment: any, blogPostTitle: string) {
  // Lade Admin-E-Mail-Einstellungen
  const { data: settings } = await supabase
    .from('app_settings')
    .select('setting_key, setting_value')
    .in('setting_key', ['admin_email', 'smtp_enabled']);

  const adminEmail = settings?.find((s: any) => s.setting_key === 'admin_email')?.setting_value;
  const smtpEnabled = settings?.find((s: any) => s.setting_key === 'smtp_enabled')?.setting_value === 'true';

  if (!adminEmail || !smtpEnabled) {
    console.log('E-Mail-Benachrichtigung übersprungen: Kein Admin-E-Mail oder SMTP deaktiviert');
    return;
  }

  // E-Mail-Inhalt
  const emailContent = {
    to: adminEmail,
    subject: `Neuer Blog-Kommentar: ${blogPostTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #C04020;">Neuer Blog-Kommentar</h2>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Blog-Artikel: ${blogPostTitle}</h3>
          
          <div style="margin: 15px 0;">
            <strong>Von:</strong> ${comment.author_name}<br>
            <strong>E-Mail:</strong> ${comment.author_email}<br>
            <strong>Datum:</strong> ${new Date(comment.created_at).toLocaleString('de-DE')}
          </div>
          
          <div style="margin: 15px 0;">
            <strong>Kommentar:</strong><br>
            <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
              ${comment.content.replace(/\n/g, '<br>')}
            </div>
          </div>
        </div>
        
        <div style="margin: 20px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3005'}/admin?tab=blog-comments" 
             style="background: #C04020; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Kommentar moderieren
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
        </p>
      </div>
    `
  };

  // Sende E-Mail über bestehende E-Mail-API
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3005'}/api/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailContent),
  });
}