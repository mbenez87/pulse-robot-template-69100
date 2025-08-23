import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateQueryEmbedding(query: string): Promise<number[]> {
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-large',
      input: query,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function performHybridSearch(
  query: string, 
  embedding: number[], 
  orgId: string, 
  roomIds: string[], 
  userId: string,
  topK: number = 10
) {
  console.log('Performing hybrid search:', { query, orgId, roomIds, userId, topK });

  // Perform vector similarity search with RLS enforcement
  const { data: vectorResults, error: vectorError } = await supabase.rpc(
    'search_document_chunks', 
    {
      query_embedding: JSON.stringify(embedding),
      match_threshold: 0.5,
      match_count: topK,
      filter_org_id: orgId,
      filter_room_ids: roomIds,
      filter_owner_id: userId
    }
  );

  if (vectorError) {
    console.error('Vector search error:', vectorError);
    throw new Error('Vector search failed');
  }

  // Perform full-text search (simplified - in production you'd use postgres full-text search)
  const { data: textResults, error: textError } = await supabase
    .from('document_chunks')
    .select(`
      *,
      documents!inner(id, file_name, file_type, user_id)
    `)
    .or(`text_content.ilike.%${query}%`)
    .eq('org_id', orgId)
    .in('room_id', roomIds)
    .eq('owner_id', userId)
    .limit(topK);

  if (textError) {
    console.error('Text search error:', textError);
    // Don't throw here, vector search might still work
  }

  // Combine and deduplicate results
  const allResults = [
    ...(vectorResults || []),
    ...(textResults || []).filter(tr => 
      !(vectorResults || []).some(vr => vr.id === tr.id)
    )
  ].slice(0, topK);

  return allResults;
}

async function generateAnswer(query: string, searchResults: any[]): Promise<{ answer: string, sources: any[] }> {
  const context = searchResults.map((result, index) => 
    `[${index + 1}] ${result.documents?.file_name || 'Unknown'}: ${result.text_content}`
  ).join('\n\n');

  const prompt = `Based on the following document excerpts, answer the user's question. Include inline citations using [1], [2], etc. format referencing the numbered sources below.

Question: ${query}

Sources:
${context}

Provide a comprehensive answer with specific citations. If the sources don't contain enough information to answer the question, say so clearly.`;

  let answer = '';

  try {
    // Try Claude first
    if (anthropicApiKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anthropicApiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [
            { role: 'user', content: prompt }
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        answer = data.content[0].text;
      }
    }
  } catch (error) {
    console.error('Claude API failed:', error);
  }

  // Fallback to GPT-4o if Claude failed
  if (!answer && openaiApiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that answers questions based on provided document sources. Always include inline citations.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        answer = data.choices[0].message.content;
      }
    } catch (error) {
      console.error('OpenAI API failed:', error);
    }
  }

  if (!answer) {
    answer = "I'm sorry, I couldn't generate an answer at this time. Please try again later.";
  }

  const sources = searchResults.map((result, index) => ({
    id: result.id,
    title: result.documents?.file_name || 'Unknown Document',
    snippet: result.text_content.substring(0, 200) + '...',
    page: result.chunk_index + 1,
    documentId: result.document_id,
    citationNumber: index + 1
  }));

  return { answer, sources };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, sessionId, orgId, roomIds, userId } = await req.json();
    
    if (!query || !userId) {
      return new Response(
        JSON.stringify({ error: 'Query and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing query:', { query, sessionId, orgId, roomIds, userId });

    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(query);

    // Perform hybrid search
    const searchResults = await performHybridSearch(
      query, 
      queryEmbedding, 
      orgId || '', 
      roomIds || [], 
      userId
    );

    console.log(`Found ${searchResults.length} relevant chunks`);

    // Generate answer with citations
    const { answer, sources } = await generateAnswer(query, searchResults);

    // Save the search session and message
    if (sessionId) {
      await supabase.from('search_messages').insert({
        session_id: sessionId,
        user_id: userId,
        message_type: 'user',
        content: query
      });

      await supabase.from('search_messages').insert({
        session_id: sessionId,
        user_id: userId,
        message_type: 'assistant',
        content: answer,
        sources: sources,
        metadata: {
          chunks_found: searchResults.length,
          search_query: query
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        answer,
        sources,
        chunksFound: searchResults.length,
        sessionId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in query function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});