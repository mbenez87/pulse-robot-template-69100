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
    const { 
      query_embedding, 
      match_threshold = 0.5, 
      match_count = 10, 
      filter_org_id = '', 
      filter_room_ids = [], 
      filter_owner_id = null 
    } = await req.json();

    if (!query_embedding) {
      return new Response(
        JSON.stringify({ error: 'query_embedding is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the database function to search document chunks
    const { data, error } = await supabase.rpc('search_document_chunks', {
      query_embedding,
      match_threshold,
      match_count,
      filter_org_id,
      filter_room_ids,
      filter_owner_id
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ results: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search_document_chunks function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});