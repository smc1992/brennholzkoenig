import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Automatische Bereinigung: Lösche Daten älter als 6 Monate
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Prüfe zuerst, wie viele Records gelöscht werden
    const { count: recordsToDelete } = await supabaseClient
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .lt('timestamp', sixMonthsAgo.toISOString());

    if (recordsToDelete === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Keine alten Daten zum Löschen gefunden',
          deleted_records: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Lösche die alten Daten
    const { error } = await supabaseClient
      .from('analytics_events')
      .delete()
      .lt('timestamp', sixMonthsAgo.toISOString());

    if (error) throw error;

    // Log der Bereinigung
    console.log(`Auto-Cleanup: ${recordsToDelete} alte Analytics-Records gelöscht`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Automatische Bereinigung abgeschlossen`,
        deleted_records: recordsToDelete,
        cleanup_date: sixMonthsAgo.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Auto-Cleanup Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Fehler bei automatischer Bereinigung'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});