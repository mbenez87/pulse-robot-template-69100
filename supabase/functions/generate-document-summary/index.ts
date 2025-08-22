import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return new Response(JSON.stringify({ error: 'Document ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('Error fetching document:', docError);
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Skip folders and non-text files for now
    if (document.is_folder || !isTextBasedFile(document.file_type)) {
      return new Response(JSON.stringify({ summary: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let fileContent = '';
    
    // For supported file types, extract text content
    if (document.file_type.includes('text') || document.file_type.includes('pdf')) {
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('docs')
          .download(document.storage_path);

        if (downloadError) {
          console.error('Error downloading file:', downloadError);
          throw downloadError;
        }

        // For text files, read directly
        if (document.file_type.includes('text')) {
          fileContent = await fileData.text();
        } else if (document.file_type.includes('pdf')) {
          // For PDFs, we'll generate a basic summary based on filename for now
          fileContent = `PDF document: ${document.file_name}`;
        }
      } catch (error) {
        console.error('Error reading file content:', error);
        fileContent = `Document: ${document.file_name}`;
      }
    } else {
      // For other file types, use filename and type
      fileContent = `${getFileTypeDescription(document.file_type)}: ${document.file_name}`;
    }

    // Generate AI summary using OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return generateFallbackSummary(document);
    }

    const summary = await generateAISummary(fileContent, document, openAIApiKey);

    // Update document with AI summary
    const { error: updateError } = await supabase
      .from('documents')
      .update({ ai_summary: summary })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document summary:', updateError);
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-document-summary function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function isTextBasedFile(fileType: string): boolean {
  const textTypes = [
    'text/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/json',
    'application/xml'
  ];
  return textTypes.some(type => fileType.includes(type));
}

function getFileTypeDescription(fileType: string): string {
  if (fileType.startsWith('image/')) return 'Image file';
  if (fileType.startsWith('video/')) return 'Video file';
  if (fileType.startsWith('audio/')) return 'Audio file';
  if (fileType.includes('zip') || fileType.includes('rar')) return 'Archive';
  if (fileType.includes('pdf')) return 'PDF document';
  if (fileType.includes('word')) return 'Word document';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'Spreadsheet';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'Presentation';
  return 'Document';
}

async function generateAISummary(content: string, document: any, apiKey: string): Promise<string> {
  try {
    const truncatedContent = content.length > 4000 ? content.substring(0, 4000) + '...' : content;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate a concise, 1-2 sentence summary of the document content. Focus on the main topic and purpose. Keep it under 100 characters when possible.'
          },
          {
            role: 'user',
            content: `File: ${document.file_name}\nType: ${document.file_type}\nContent: ${truncatedContent}`
          }
        ],
        max_tokens: 100,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const summary = data.choices[0].message.content.trim();
    
    return summary;
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return generateFallbackSummary(document).summary;
  }
}

function generateFallbackSummary(document: any): { summary: string } {
  const fileType = getFileTypeDescription(document.file_type);
  const size = formatFileSize(document.file_size);
  return {
    summary: `${fileType} (${size})`
  };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}