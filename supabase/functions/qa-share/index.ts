import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { org_id, room_id, expires_in_hours = 24 } = await req.json();

    if (!org_id) {
      return new Response(
        JSON.stringify({ error: 'Organization ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .rpc('generate_share_token');

    if (tokenError || !tokenData) {
      throw new Error('Failed to generate token');
    }

    const token = tokenData;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expires_in_hours);

    // Store token in database
    const { error: insertError } = await supabaseClient
      .from('share_tokens')
      .insert({
        token,
        org_id,
        room_id: room_id || null,
        scope: 'qa_only',
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('Token insert error:', insertError);
      throw new Error('Failed to create share token');
    }

    return new Response(
      JSON.stringify({ 
        token,
        expires_at: expiresAt.toISOString(),
        share_url: `${req.headers.get('origin') || 'https://your-domain.com'}/shared/${token}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in qa-share function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});