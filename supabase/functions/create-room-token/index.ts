import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roomId, expiresInHours = 24, permissions = { query_only: true } } = await req.json();
    
    if (!roomId) {
      return new Response(
        JSON.stringify({ error: 'Room ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user ID from the request context
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;

    // Verify user owns the room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .eq('owner_id', userId)
      .single();

    if (roomError || !room) {
      return new Response(
        JSON.stringify({ error: 'Room not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a secure token
    const shareToken = crypto.randomUUID();
    const tokenHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(shareToken)
    );
    const hashArray = Array.from(new Uint8Array(tokenHash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Store the token
    const { data: tokenData, error: tokenError } = await supabase
      .from('room_tokens')
      .insert({
        room_id: roomId,
        token_hash: hashHex,
        expires_at: expiresAt.toISOString(),
        permissions,
        created_by: userId
      })
      .select()
      .single();

    if (tokenError) {
      console.error('Failed to create room token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to create share token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate shareable URL
    const baseUrl = req.headers.get('origin') || `https://${req.headers.get('host')}`;
    const shareUrl = `${baseUrl}/search?token=${shareToken}&room=${roomId}`;

    return new Response(
      JSON.stringify({
        success: true,
        token: shareToken,
        shareUrl,
        expiresAt: expiresAt.toISOString(),
        permissions,
        roomName: room.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-room-token function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});