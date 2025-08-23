import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContractAnalysisRequest {
  documentId: string;
  extractedText: string;
}

interface ContractExtraction {
  parties: {
    primary_party: string;
    counterparty: string;
    other_parties?: string[];
  };
  term_details: {
    start_date?: string;
    end_date?: string;
    term_length?: string;
    auto_renewal?: boolean;
  };
  pricing: {
    amount?: number;
    currency?: string;
    payment_terms?: string;
    escalations?: string;
  };
  renewal_terms?: {
    notice_period?: string;
    renewal_conditions?: string;
    auto_renewal?: boolean;
  };
  termination_clauses?: {
    termination_rights?: string;
    notice_periods?: string;
    penalties?: string;
  };
  ip_provisions?: {
    ownership?: string;
    licensing?: string;
    restrictions?: string;
  };
  indemnity_clauses?: {
    scope?: string;
    limitations?: string;
    carve_outs?: string;
  };
  liability_cap?: {
    cap_amount?: number;
    exceptions?: string;
    mutual_caps?: boolean;
  };
  governing_law?: {
    jurisdiction?: string;
    dispute_resolution?: string;
    venue?: string;
  };
  unusual_clauses?: {
    description?: string;
    risk_level?: string;
    notes?: string;
  };
  risk_score: number;
  risk_rationale: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from request
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { documentId, extractedText }: ContractAnalysisRequest = await req.json();

    if (!documentId || !extractedText) {
      throw new Error('Document ID and extracted text are required');
    }

    // Prepare the analysis prompt
    const analysisPrompt = `
Analyze the following contract text and extract structured information according to this exact JSON schema:

{
  "parties": {
    "primary_party": "string",
    "counterparty": "string", 
    "other_parties": ["string"]
  },
  "term_details": {
    "start_date": "YYYY-MM-DD or null",
    "end_date": "YYYY-MM-DD or null",
    "term_length": "string description",
    "auto_renewal": boolean
  },
  "pricing": {
    "amount": number,
    "currency": "string",
    "payment_terms": "string",
    "escalations": "string"
  },
  "renewal_terms": {
    "notice_period": "string",
    "renewal_conditions": "string",
    "auto_renewal": boolean
  },
  "termination_clauses": {
    "termination_rights": "string",
    "notice_periods": "string", 
    "penalties": "string"
  },
  "ip_provisions": {
    "ownership": "string",
    "licensing": "string",
    "restrictions": "string"
  },
  "indemnity_clauses": {
    "scope": "string",
    "limitations": "string",
    "carve_outs": "string"
  },
  "liability_cap": {
    "cap_amount": number,
    "exceptions": "string",
    "mutual_caps": boolean
  },
  "governing_law": {
    "jurisdiction": "string", 
    "dispute_resolution": "string",
    "venue": "string"
  },
  "unusual_clauses": {
    "description": "string",
    "risk_level": "low|medium|high|critical",
    "notes": "string"
  },
  "risk_score": "integer from 0-100",
  "risk_rationale": "detailed explanation of risk score"
}

Contract Text:
${extractedText}

Return only valid JSON that matches the schema exactly. For missing fields, use null values. The risk_score should reflect overall contract risk considering terms, penalties, limitations, and unusual provisions.
`;

    let extractedData: ContractExtraction;
    let extractionModel = 'claude-3-5-sonnet';

    try {
      // Try Claude 3.5 Sonnet first
      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: analysisPrompt
            }
          ]
        })
      });

      if (!claudeResponse.ok) {
        throw new Error(`Claude API error: ${claudeResponse.status}`);
      }

      const claudeData = await claudeResponse.json();
      const analysisResult = claudeData.content[0].text;
      
      // Parse the JSON response
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }
      
      extractedData = JSON.parse(jsonMatch[0]);
      console.log('Successfully analyzed contract with Claude 3.5 Sonnet');

    } catch (claudeError) {
      console.log('Claude failed, falling back to GPT-4o:', claudeError);
      
      // Fallback to GPT-4o
      extractionModel = 'gpt-4o';
      
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a contract analysis expert. Return only valid JSON that matches the requested schema exactly.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.1
        })
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorData.error?.message}`);
      }

      const openaiData = await openaiResponse.json();
      const analysisResult = openaiData.choices[0].message.content;
      
      // Parse the JSON response
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in GPT-4o response');
      }
      
      extractedData = JSON.parse(jsonMatch[0]);
      console.log('Successfully analyzed contract with GPT-4o fallback');
    }

    // Save the extraction to the database
    const { data: contractExtraction, error: insertError } = await supabaseClient
      .from('contract_extractions')
      .insert({
        document_id: documentId,
        user_id: user.id,
        parties: extractedData.parties,
        term_details: extractedData.term_details,
        pricing: extractedData.pricing,
        renewal_terms: extractedData.renewal_terms,
        termination_clauses: extractedData.termination_clauses,
        ip_provisions: extractedData.ip_provisions,
        indemnity_clauses: extractedData.indemnity_clauses,
        liability_cap: extractedData.liability_cap,
        governing_law: extractedData.governing_law,
        unusual_clauses: extractedData.unusual_clauses,
        risk_score: extractedData.risk_score,
        risk_rationale: extractedData.risk_rationale,
        extraction_model: extractionModel,
        extraction_confidence: 0.9
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save contract extraction: ${insertError.message}`);
    }

    console.log('Contract analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      extraction: contractExtraction,
      model_used: extractionModel
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in analyze-contract function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);