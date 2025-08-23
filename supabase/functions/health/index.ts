import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callModel } from "../_shared/providerRouter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const models = [
      'openai:gpt-5',
      'anthropic:claude-3-5-sonnet', 
      'google:gemini-1.5-pro',
      'perplexity:sonar-pro'
    ];

    const healthChecks = await Promise.allSettled(
      models.map(async (model) => {
        const start = Date.now();
        const result = await callModel({
          model,
          messages: [
            { role: 'user', content: 'Hello' }
          ]
        });
        const latency = Date.now() - start;

        return {
          model,
          provider: model.split(':')[0],
          status: result.error ? 'error' : 'healthy',
          latency,
          error: result.error ? result.message : null
        };
      })
    );

    const results = healthChecks.map((check, index) => {
      if (check.status === 'fulfilled') {
        return check.value;
      } else {
        return {
          model: models[index],
          provider: models[index].split(':')[0],
          status: 'error',
          latency: null,
          error: check.reason?.message || 'Unknown error'
        };
      }
    });

    return new Response(
      JSON.stringify({ 
        timestamp: new Date().toISOString(),
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});