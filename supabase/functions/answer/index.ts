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
      question, 
      model, 
      mode, 
      docCitations = [], 
      webResults = [], 
      verifier = false 
    } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing answer fusion for mode:', mode);

    let systemPrompt = '';
    let citations = [];
    let finalWebResults = [];

    switch (mode) {
      case 'docs':
        systemPrompt = `Answer the user's question strictly based on the provided document passages. Cite each claim with the source number [1], [2], etc. If the information is insufficient, state that clearly.

Document passages:
${docCitations.map((c: any, i: number) => `[${i + 1}] ${c.snippet} (Source: ${c.title}, Page: ${c.page || 'N/A'})`).join('\n\n')}`;
        citations = docCitations;
        break;

      case 'web':
        systemPrompt = `Answer the user's question based on the provided web sources. Cite each claim with the URL reference [1], [2], etc.

Web sources:
${webResults.map((r: any, i: number) => `[${i + 1}] ${r.snippet} (Source: ${r.title} - ${r.url})`).join('\n\n')}`;
        finalWebResults = webResults;
        break;

      case 'hybrid':
        systemPrompt = `Answer the user's question using both document and web sources. Prefer document evidence when available; supplement with web sources when documents are insufficient. 
        
Tag citations as (Doc: [N]) for documents and (Web: [N]) for web sources.

Document sources:
${docCitations.map((c: any, i: number) => `Doc [${i + 1}] ${c.snippet} (Source: ${c.title}, Page: ${c.page || 'N/A'})`).join('\n\n')}

Web sources:
${webResults.map((r: any, i: number) => `Web [${i + 1}] ${r.snippet} (Source: ${r.title} - ${r.url})`).join('\n\n')}`;
        citations = docCitations;
        finalWebResults = webResults;
        break;

      default:
        throw new Error(`Unsupported mode: ${mode}`);
    }

    // Get response from selected model
    let answer = '';

    switch (model) {
      case 'anthropic':
        const anthResponse = await callAnthropicAPI(question, systemPrompt);
        answer = anthResponse.content[0]?.text || 'No response from Claude';
        break;
      
      case 'openai':
        const openaiResponse = await callOpenAIAPI(question, systemPrompt);
        answer = openaiResponse.choices[0]?.message?.content || 'No response from GPT';
        break;
      
      case 'google':
        const geminiResponse = await callGeminiAPI(question, systemPrompt);
        answer = geminiResponse.candidates[0]?.content?.parts[0]?.text || 'No response from Gemini';
        break;
      
      case 'perplexity':
        // For web mode with Perplexity, just return the Sonar answer
        if (mode === 'web') {
          const perplexityResponse = await callPerplexityAPI(question);
          answer = perplexityResponse.choices[0]?.message?.content || 'No response from Perplexity';
        } else {
          throw new Error('Perplexity model only supports web mode');
        }
        break;
      
      default:
        throw new Error(`Unsupported model: ${model}`);
    }

    let verification = null;

    // If verifier is enabled, run cross-model verification
    if (verifier && (citations.length > 0 || finalWebResults.length > 0)) {
      const verificationModel = getAlternativeModel(model);
      const allSources = [
        ...citations.map((c: any) => `Doc: ${c.snippet}`),
        ...finalWebResults.map((r: any) => `Web: ${r.snippet}`)
      ];
      
      const verificationPrompt = `Validate the following answer strictly against the provided sources. Flag any unsupported claims and provide a verification summary.

Answer to verify: ${answer}

Sources: ${allSources.join('\n')}

Respond with: SUPPORTED/UNSUPPORTED and brief notes.`;

      try {
        const verificationResponse = await callModelAPI(verificationModel, question, verificationPrompt);
        verification = {
          model: verificationModel,
          supported: verificationResponse.includes('SUPPORTED'),
          notes: verificationResponse
        };
      } catch (error) {
        console.error('Verification failed:', error);
        verification = {
          model: verificationModel,
          supported: null,
          notes: 'Verification failed: ' + error.message
        };
      }
    }

    return new Response(
      JSON.stringify({ 
        answer,
        citations,
        webResults: finalWebResults,
        verification,
        search_results_count: citations.length + finalWebResults.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in answer function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getAlternativeModel(currentModel: string): string {
  const alternatives = {
    'anthropic': 'openai',
    'openai': 'anthropic', 
    'google': 'anthropic',
    'perplexity': 'anthropic'
  };
  return alternatives[currentModel] || 'anthropic';
}

async function callModelAPI(model: string, question: string, systemPrompt: string): Promise<string> {
  switch (model) {
    case 'anthropic':
      const anthResponse = await callAnthropicAPI(question, systemPrompt);
      return anthResponse.content[0]?.text || '';
    case 'openai':
      const openaiResponse = await callOpenAIAPI(question, systemPrompt);
      return openaiResponse.choices[0]?.message?.content || '';
    case 'google':
      const geminiResponse = await callGeminiAPI(question, systemPrompt);
      return geminiResponse.candidates[0]?.content?.parts[0]?.text || '';
    default:
      throw new Error(`Unsupported model: ${model}`);
  }
}

async function callAnthropicAPI(question: string, systemPrompt?: string) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: systemPrompt || 'You are a helpful assistant.',
      messages: [
        {
          role: 'user',
          content: question
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  return await response.json();
}

async function callOpenAIAPI(question: string, systemPrompt?: string) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  let model = 'gpt-5-2025-08-07';
  let requestBody = {
    model,
    messages: systemPrompt ? [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: question
      }
    ] : [
      {
        role: 'user',
        content: question
      }
    ],
    max_completion_tokens: 2000
  };

  let response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    console.log('GPT-5 failed, falling back to GPT-4o');
    model = 'gpt-4o';
    requestBody = {
      model,
      messages: systemPrompt ? [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: question
        }
      ] : [
        {
          role: 'user',
          content: question
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    };

    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
  }

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  return await response.json();
}

async function callGeminiAPI(question: string, systemPrompt?: string) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: systemPrompt ? `${systemPrompt}\n\nQuestion: ${question}` : question
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.7
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  return await response.json();
}

async function callPerplexityAPI(question: string, systemPrompt?: string) {
  const apiKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!apiKey) {
    throw new Error('Perplexity API key not configured');
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: systemPrompt ? [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: question
        }
      ] : [
        {
          role: 'user',
          content: question
        }
      ],
      max_tokens: 2000,
      temperature: 0.2,
      top_p: 0.9,
      return_images: false,
      return_related_questions: false
    })
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`);
  }

  return await response.json();
}