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
    const { question, model, org_id, room_id, doc_ids, verifier } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate embedding for the question
    const questionEmbedding = await generateEmbedding(question);
    
    // Perform hybrid search for relevant chunks
    const { data: searchResults, error: searchError } = await supabaseClient
      .rpc('hybrid_search_chunks', {
        query_text: question,
        query_embedding: questionEmbedding,
        org_filter: org_id || '',
        room_filter: room_id || null,
        doc_filter: doc_ids || null,
        match_threshold: 0.7,
        match_count: 10
      });

    if (searchError) {
      console.error('Search error:', searchError);
      throw new Error('Failed to search documents');
    }

    let citations = [];
    let systemPrompt = "Answer strictly from provided passages; cite each claim; if insufficient information is available, say so clearly.";
    
    if (searchResults && searchResults.length > 0) {
      // Build context from search results
      const contextPassages = searchResults.map((result, index) => 
        `[${index + 1}] ${result.text_content} (Source: ${result.doc_title || 'Unknown'}, Page: ${result.page_number || 'N/A'})`
      ).join('\n\n');

      systemPrompt = `Answer the user's question strictly based on the provided document passages. Cite each claim with the source number [1], [2], etc. If the information is insufficient, state that clearly.

Document passages:
${contextPassages}`;

      // Build citations array
      citations = searchResults.map((result, index) => ({
        id: index + 1,
        doc_id: result.document_id,
        title: result.doc_title || 'Unknown Document',
        page: result.page_number || null,
        snippet: result.text_content.substring(0, 200) + '...',
        similarity: result.similarity
      }));
    }

    // Get response from selected model
    let response;
    let answer = '';

    switch (model) {
      case 'anthropic':
        response = await callAnthropicAPI(question, systemPrompt);
        answer = response.content[0]?.text || 'No response from Claude';
        break;
      
      case 'openai':
        response = await callOpenAIAPI(question, systemPrompt);
        answer = response.choices[0]?.message?.content || 'No response from GPT';
        break;
      
      case 'google':
        response = await callGeminiAPI(question, systemPrompt);
        answer = response.candidates[0]?.content?.parts[0]?.text || 'No response from Gemini';
        break;
      
      case 'perplexity':
        response = await callPerplexityAPI(question, systemPrompt);
        answer = response.choices[0]?.message?.content || 'No response from Perplexity';
        break;
      
      default:
        throw new Error(`Unsupported model: ${model}`);
    }

    let verification = null;

    // If verifier is enabled, run cross-model verification
    if (verifier && citations.length > 0) {
      const verificationModel = getAlternativeModel(model);
      const verificationPrompt = `Validate the following answer strictly against the provided citations. Flag any unsupported claims and provide a verification summary.

Answer to verify: ${answer}

Citations: ${citations.map(c => `[${c.id}] ${c.snippet}`).join('\n')}

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
        verification,
        search_results_count: searchResults?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in query function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateEmbedding(text: string): Promise<number[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (openaiApiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-3-large',
          input: text
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.data[0].embedding;
      }
    } catch (error) {
      console.error('OpenAI embedding failed:', error);
    }
  }

  // Fallback to Gemini
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (geminiApiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: {
            parts: [{ text: text }]
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.embedding.values;
      }
    } catch (error) {
      console.error('Gemini embedding failed:', error);
    }
  }

  // Mock embedding as final fallback
  return new Array(1536).fill(0).map(() => Math.random() - 0.5);
}

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
    case 'perplexity':
      const perplexityResponse = await callPerplexityAPI(question, systemPrompt);
      return perplexityResponse.choices[0]?.message?.content || '';
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

  // Try GPT-5 first, fallback to GPT-4o
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

  // If GPT-5 fails, fallback to GPT-4o
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
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`);
  }

  return await response.json();
}