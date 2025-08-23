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

async function detectPII(text: string, documentId: string): Promise<any[]> {
  const detections = [];
  
  // Enhanced regex patterns for PII/PHI detection
  const patterns = {
    ssn: /\b(?:\d{3}-\d{2}-\d{4}|\d{9})\b/g,
    phone: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    credit_card: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    date_of_birth: /\b(?:0[1-9]|1[0-2])[-/.](?:0[1-9]|[12][0-9]|3[01])[-/.](?:19|20)\d{2}\b/g,
    address: /\b\d+\s+[A-Za-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/gi
  };

  for (const [entityType, pattern] of Object.entries(patterns)) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      detections.push({
        document_id: documentId,
        detection_type: 'pii',
        entity_type: entityType,
        text_content: match[0],
        confidence: 0.9,
        status: 'detected'
      });
    }
  }

  return detections;
}

async function detectPIIWithAI(text: string, documentId: string): Promise<any[]> {
  if (!anthropicApiKey) {
    console.log('No Anthropic API key, skipping AI PII detection');
    return [];
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anthropicApiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `Analyze the following text for PII, PHI, and sensitive information. Return a JSON array of findings with this format:
[{
  "entity_type": "ssn|phone|email|credit_card|medical_record|patient_name|etc",
  "text_content": "the actual sensitive text found",
  "confidence": 0.0-1.0,
  "detection_type": "pii|phi|secrets"
}]

Text to analyze:
${text.substring(0, 4000)}`
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.content[0].text;
    
    // Try to parse JSON response
    try {
      const detections = JSON.parse(aiResponse);
      return detections.map((detection: any) => ({
        document_id: documentId,
        detection_type: detection.detection_type || 'pii',
        entity_type: detection.entity_type,
        text_content: detection.text_content,
        confidence: detection.confidence || 0.8,
        status: 'detected'
      }));
    } catch (parseError) {
      console.error('Failed to parse AI PII detection response:', parseError);
      return [];
    }
  } catch (error) {
    console.error('AI PII detection failed:', error);
    return [];
  }
}

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

async function performEnhancedSearch(
  query: string,
  embedding: number[],
  roomId?: string,
  orgId?: string,
  userId?: string,
  answerOnlyMode: boolean = false,
  topK: number = 10
) {
  console.log('Performing enhanced search:', { query, roomId, orgId, userId, answerOnlyMode, topK });

  // Build search filters based on context
  const searchFilters = {
    filter_org_id: orgId || '',
    filter_room_ids: roomId ? [roomId] : [],
    filter_owner_id: userId || null
  };

  // Perform vector similarity search
  const { data: vectorResults, error: vectorError } = await supabase.rpc(
    'search_document_chunks',
    {
      query_embedding: JSON.stringify(embedding),
      match_threshold: 0.3,
      match_count: topK,
      ...searchFilters
    }
  );

  if (vectorError) {
    console.error('Vector search error:', vectorError);
    throw new Error('Vector search failed');
  }

  // Enhanced full-text search with better ranking
  const { data: textResults, error: textError } = await supabase
    .from('document_chunks')
    .select(`
      *,
      documents!inner(id, file_name, file_type, user_id, room_id)
    `)
    .textSearch('text_content', query, { type: 'websearch' })
    .eq('org_id', orgId || '')
    .limit(topK);

  if (textError) {
    console.error('Text search error:', textError);
  }

  // Combine and deduplicate results with better scoring
  const combinedResults = [
    ...(vectorResults || []).map((r: any) => ({ ...r, score_type: 'vector', final_score: r.similarity })),
    ...(textResults || []).filter((tr: any) => 
      !(vectorResults || []).some((vr: any) => vr.id === tr.id)
    ).map((r: any) => ({ ...r, score_type: 'text', final_score: 0.7 }))
  ].sort((a, b) => b.final_score - a.final_score).slice(0, topK);

  // Apply answer-only mode restrictions
  if (answerOnlyMode) {
    return combinedResults.map(result => ({
      ...result,
      text_content: result.text_content.substring(0, 1000), // Limit snippet length
      // Remove sensitive metadata in answer-only mode
      documents: {
        id: result.documents?.id,
        file_name: result.documents?.file_name,
        file_type: result.documents?.file_type
      }
    }));
  }

  return combinedResults;
}

async function generateEnhancedAnswer(query: string, searchResults: any[], answerOnlyMode: boolean = false): Promise<{ answer: string, sources: any[] }> {
  const context = searchResults.map((result, index) => 
    `[${index + 1}] ${result.documents?.file_name || 'Unknown'} (confidence: ${result.confidence || 'N/A'}): ${result.text_content}`
  ).join('\n\n');

  const systemPrompt = answerOnlyMode 
    ? "You are a helpful assistant providing answers based only on provided document excerpts. Include inline citations using [1], [2], etc. Keep responses concise and only reference information explicitly found in the sources."
    : "You are a helpful assistant that answers questions based on provided document sources. Include inline citations using [1], [2], etc. format referencing the numbered sources. Be comprehensive but accurate.";

  const prompt = `${systemPrompt}

Question: ${query}

Sources:
${context}

Provide a comprehensive answer with specific citations. If the sources don't contain enough information to answer the question fully, say so clearly and indicate what information is missing.`;

  let answer = '';

  // Try different AI models in fallback order
  try {
    // Try Claude first (best for analysis)
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
          max_tokens: answerOnlyMode ? 800 : 2000,
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

  // Fallback to GPT-4o
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
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: answerOnlyMode ? 800 : 2000,
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

  // Final fallback to Gemini
  if (!answer) {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + Deno.env.get('GOOGLE_API_KEY'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: answerOnlyMode ? 800 : 2000
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        answer = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
    } catch (error) {
      console.error('Gemini API failed:', error);
    }
  }

  if (!answer) {
    answer = "I'm sorry, I couldn't generate an answer at this time. The AI services are temporarily unavailable.";
  }

  const sources = searchResults.map((result, index) => ({
    id: result.id,
    title: result.documents?.file_name || 'Unknown Document',
    snippet: answerOnlyMode 
      ? result.text_content.substring(0, 200) + '...'  // Shorter snippets in answer-only mode
      : result.text_content.substring(0, 300) + '...',
    page: result.source_page || result.chunk_index + 1,
    documentId: result.document_id,
    citationNumber: index + 1,
    confidence: result.confidence || result.final_score,
    processingMethod: result.processing_method
  }));

  return { answer, sources };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      query, 
      sessionId, 
      roomId, 
      orgId, 
      userId, 
      answerOnlyMode = false,
      token,
      action = 'query' // 'query' or 'detect_pii'
    } = await req.json();
    
    if (!query || !userId) {
      return new Response(
        JSON.stringify({ error: 'Query and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle token-based access for shared rooms
    let effectiveRoomId = roomId;
    let effectiveAnswerOnlyMode = answerOnlyMode;
    
    if (token) {
      const { data: tokenData, error: tokenError } = await supabase
        .from('room_tokens')
        .select('room_id, permissions, expires_at')
        .eq('token_hash', token)
        .single();
      
      if (tokenError || !tokenData || new Date(tokenData.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      effectiveRoomId = tokenData.room_id;
      effectiveAnswerOnlyMode = tokenData.permissions?.query_only || false;
      
      // Update token last used time
      await supabase
        .from('room_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('token_hash', token);
    }

    console.log('Processing enhanced query:', { 
      query, sessionId, roomId: effectiveRoomId, orgId, userId, 
      answerOnlyMode: effectiveAnswerOnlyMode, action 
    });

    if (action === 'detect_pii') {
      // PII Detection mode
      const regexDetections = await detectPII(query, 'temp-doc-id');
      const aiDetections = await detectPIIWithAI(query, 'temp-doc-id');
      
      return new Response(
        JSON.stringify({ 
          detections: [...regexDetections, ...aiDetections],
          summary: {
            total: regexDetections.length + aiDetections.length,
            byType: {}
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(query);

    // Perform enhanced search
    const searchResults = await performEnhancedSearch(
      query, 
      queryEmbedding, 
      effectiveRoomId,
      orgId, 
      userId,
      effectiveAnswerOnlyMode
    );

    console.log(`Enhanced search found ${searchResults.length} relevant chunks`);

    // Generate answer with citations
    const { answer, sources } = await generateEnhancedAnswer(query, searchResults, effectiveAnswerOnlyMode);

    // Save search session and message (only if not using token)
    if (sessionId && !token) {
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
          search_query: query,
          answer_only_mode: effectiveAnswerOnlyMode,
          room_id: effectiveRoomId
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        answer,
        sources,
        chunksFound: searchResults.length,
        sessionId,
        answerOnlyMode: effectiveAnswerOnlyMode,
        searchMetadata: {
          roomId: effectiveRoomId,
          hasToken: !!token,
          processingMethods: [...new Set(searchResults.map(r => r.processing_method).filter(Boolean))]
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enhanced-query function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});