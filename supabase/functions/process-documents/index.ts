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

async function generateEmbedding(text: string): Promise<number[]> {
  if (!openaiApiKey) {
    console.log('OpenAI API key not configured, using mock embedding');
    return new Array(1536).fill(0).map(() => Math.random() - 0.5);
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
    console.error('OpenAI embedding failed:', error);
    // Return mock embedding as fallback
    return new Array(1536).fill(0).map(() => Math.random() - 0.5);
  }
}

function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  for (let start = 0; start < text.length; start += chunkSize - overlap) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    if (end >= text.length) break;
  }
  return chunks.length > 0 ? chunks : [text];
}

async function processDocumentForSearch(document: any): Promise<void> {
  console.log(`Processing document: ${document.title} (${document.id})`);
  
  // Create a searchable text representation based on metadata
  let searchableText = `Document: ${document.title || document.file_name}\n`;
  searchableText += `Type: ${document.mime_type || document.file_type}\n`;
  searchableText += `Category: ${document.category || 'general'}\n`;
  
  if (document.mime_type?.startsWith('image/')) {
    searchableText += `This is an image file. `;
    if (document.width && document.height) {
      searchableText += `Dimensions: ${document.width}x${document.height} pixels. `;
    }
    if (document.camera_make) {
      searchableText += `Captured with: ${document.camera_make} ${document.camera_model || ''}. `;
    }
    if (document.gps_lat && document.gps_lon) {
      searchableText += `Location: ${document.gps_lat}, ${document.gps_lon}. `;
    }
  }
  
  if (document.tags && document.tags.length > 0) {
    searchableText += `Tags: ${document.tags.join(', ')}. `;
  }
  
  searchableText += `Created: ${new Date(document.created_at).toLocaleDateString()}`;

  // Chunk the text
  const textChunks = chunkText(searchableText, 500, 50);
  console.log(`Generated ${textChunks.length} chunks for document ${document.id}`);

  // Process each chunk
  const chunkPromises = textChunks.map(async (chunk, index) => {
    try {
      const embedding = await generateEmbedding(chunk);
      
      const { error: insertError } = await supabase
        .from('document_chunks')
        .insert({
          document_id: document.id,
          chunk_id: `${document.id}_${index}`,
          text_content: chunk,
          embedding,
          org_id: document.org_id || '',
          room_id: document.room_id || null,
          owner_id: document.user_id,
          chunk_index: index,
          source_page: 1,
          metadata: {
            chunk_size: chunk.length,
            document_type: document.mime_type,
            category: document.category
          }
        });

      if (insertError) {
        console.error(`Failed to insert chunk ${index}:`, insertError);
        return { success: false, chunkIndex: index, error: insertError.message };
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
  
  console.log(`Document ${document.id} processed: ${successful} successful, ${failed} failed chunks`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing documents for user: ${user_id}`);

    // Get all user documents that don't have chunks yet
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_folder', false);

    if (docError) {
      throw docError;
    }

    console.log(`Found ${documents?.length || 0} documents to process`);

    // Check which documents already have chunks
    const { data: existingChunks, error: chunkError } = await supabase
      .from('document_chunks')
      .select('document_id')
      .eq('owner_id', user_id);

    if (chunkError) {
      throw chunkError;
    }

    const processedDocIds = new Set(existingChunks?.map(c => c.document_id) || []);
    const documentsToProcess = documents?.filter(doc => !processedDocIds.has(doc.id)) || [];

    console.log(`Processing ${documentsToProcess.length} new documents`);

    // Process documents in batches to avoid timeout
    const batchSize = 5;
    let totalProcessed = 0;
    
    for (let i = 0; i < documentsToProcess.length; i += batchSize) {
      const batch = documentsToProcess.slice(i, i + batchSize);
      await Promise.all(batch.map(doc => processDocumentForSearch(doc)));
      totalProcessed += batch.length;
      console.log(`Processed batch: ${totalProcessed}/${documentsToProcess.length}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalDocuments: documents?.length || 0,
        processedDocuments: documentsToProcess.length,
        skippedDocuments: documents?.length - documentsToProcess.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-documents function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});