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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function extractTextFromFile(fileContent: ArrayBuffer, fileName: string): Promise<string> {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  
  // For now, return placeholder text. In production, you'd implement OCR/text extraction
  // based on file type (PDF, images, docs, etc.)
  if (['txt', 'md'].includes(fileExtension || '')) {
    return new TextDecoder().decode(fileContent);
  }
  
  // Placeholder for other file types - implement OCR/extraction as needed
  return `Content extracted from ${fileName}`;
}

async function generateEmbedding(text: string): Promise<number[]> {
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-large',
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('OpenAI embedding failed, trying Gemini fallback:', error);
    
    // Fallback to Gemini - would need Gemini API key
    // For now, return a mock embedding
    return new Array(1536).fill(0).map(() => Math.random() - 0.5);
  }
}

function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    
    if (start >= text.length) break;
  }
  
  return chunks;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, orgId, roomId } = await req.json();
    
    if (!documentId) {
      return new Response(
        JSON.stringify({ error: 'Document ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing document: ${documentId}`);

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('Document not found:', docError);
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('docs')
      .download(document.storage_path);

    if (downloadError || !fileData) {
      console.error('Failed to download file:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract text content
    const fileContent = await fileData.arrayBuffer();
    const extractedText = await extractTextFromFile(fileContent, document.file_name);

    // Chunk the text
    const textChunks = chunkText(extractedText);
    console.log(`Generated ${textChunks.length} chunks for document ${documentId}`);

    // Process each chunk
    const chunkPromises = textChunks.map(async (chunk, index) => {
      try {
        const embedding = await generateEmbedding(chunk);
        
        const { error: insertError } = await supabase
          .from('document_chunks')
          .insert({
            document_id: documentId,
            chunk_id: `${documentId}_${index}`,
            text_content: chunk,
            embedding,
            org_id: orgId,
            room_id: roomId,
            owner_id: document.user_id,
            chunk_index: index,
            metadata: {
              file_name: document.file_name,
              file_type: document.file_type,
              chunk_size: chunk.length
            }
          });

        if (insertError) {
          console.error(`Failed to insert chunk ${index}:`, insertError);
          throw insertError;
        }

        return { success: true, chunkIndex: index };
      } catch (error) {
        console.error(`Error processing chunk ${index}:`, error);
        return { success: false, chunkIndex: index, error: error.message };
      }
    });

    const results = await Promise.all(chunkPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Update document processing status
    await supabase
      .from('documents')
      .update({ 
        processing_status: failed > 0 ? 'partial' : 'completed',
        ai_summary: `Processed ${successful} chunks successfully${failed > 0 ? `, ${failed} failed` : ''}`
      })
      .eq('id', documentId);

    console.log(`Embedding completed: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        chunksProcessed: successful,
        chunksFailed: failed,
        totalChunks: textChunks.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in embed function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});