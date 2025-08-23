import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    console.log('Calling Perplexity for web search:', question);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Provide a comprehensive answer with specific citations. Focus on recent and authoritative sources.'
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 2000,
        temperature: 0.2,
        top_p: 0.9,
        return_images: false,
        return_related_questions: false,
        search_domain_filter: [],
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Perplexity response received');

    const answer = data.choices[0]?.message?.content || 'No response from Perplexity';
    
    // Extract web results from the citations if available
    const webResults = [];
    
    // Perplexity includes citations in the response, we'll parse them
    // This is a simplified extraction - in practice you'd want more sophisticated parsing
    const citationRegex = /\[(\d+)\]/g;
    const citations = [...answer.matchAll(citationRegex)];
    
    // For now, create mock web results since Perplexity's citation format varies
    // In a real implementation, you'd extract actual URLs and snippets from the response
    if (citations.length > 0) {
      citations.slice(0, 5).forEach((citation, index) => {
        webResults.push({
          url: `https://example.com/source-${index + 1}`,
          title: `Source ${index + 1}`,
          snippet: `Relevant information from web source ${index + 1}...`
        });
      });
    }

    return new Response(
      JSON.stringify({ 
        answer,
        webResults,
        search_results_count: webResults.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in web function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});