// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

interface AnalyticsEvent {
  id: number;
  event_type: string;
  properties: Record<string, unknown>;
  created_at: string;
  user_id?: string;
  session_id?: string;
}

interface CleanupResult {
  deleted_count: number;
  error?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    // Delete old analytics events
    const { data, error } = await supabaseClient
      .from('analytics_events')
      .delete()
      .lt('created_at', cutoffDate)
      .select('id');

    if (error) {
      console.error('Error cleaning up analytics:', error);
      return new Response(
        JSON.stringify({ error: error.message } as CleanupResult),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    const deletedCount = data?.length || 0;

    console.log(`Cleaned up ${deletedCount} analytics events older than ${cutoffDate}`);

    const result: CleanupResult = {
      deleted_count: deletedCount
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ error: errorMessage } as CleanupResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});