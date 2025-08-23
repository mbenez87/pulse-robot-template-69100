import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ForecastRequest {
  contractExtractionId: string;
  action?: 'extract_revenue' | 'generate_forecast' | 'export_csv';
  forecastMonths?: number;
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

    const { contractExtractionId, action = 'extract_revenue', forecastMonths = 12 }: ForecastRequest = await req.json();

    if (!contractExtractionId) {
      throw new Error('Contract extraction ID is required');
    }

    if (action === 'extract_revenue') {
      // Get the contract extraction data
      const { data: contractExtraction, error: fetchError } = await supabaseClient
        .from('contract_extractions')
        .select('*')
        .eq('id', contractExtractionId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !contractExtraction) {
        throw new Error('Contract extraction not found');
      }

      // Use GPT-4o to extract revenue terms
      const revenuePrompt = `
Extract all revenue-related terms from this contract analysis and convert to structured revenue terms:

Contract Analysis:
${JSON.stringify(contractExtraction, null, 2)}

Return a JSON array of revenue terms in this format:
[
  {
    "sku": "product/service identifier",
    "product_name": "descriptive name",
    "quantity": number,
    "unit_price": number,
    "currency": "USD|EUR|GBP etc",
    "billing_frequency": "monthly|quarterly|annually|one-time",
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD or null",
    "term_months": number_or_null,
    "usage_based": boolean,
    "usage_tiers": {tier_1: {min: 0, max: 1000, rate: 10}} or null,
    "ramp_schedule": {month_1: 0.5, month_2: 0.75, month_3: 1.0} or null,
    "escalation_rate": 0.03 or 0,
    "minimum_commitment": number_or_null
  }
]

Extract from pricing information, payment terms, and any usage-based or tiered pricing structures mentioned in the contract.
`;

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
              content: 'You are a financial analyst expert in contract revenue recognition. Extract precise revenue terms.'
            },
            {
              role: 'user',
              content: revenuePrompt
            }
          ],
          max_tokens: 3000,
          temperature: 0.1
        })
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorData.error?.message}`);
      }

      const openaiData = await openaiResponse.json();
      const revenueResult = openaiData.choices[0].message.content;
      
      // Parse the JSON response
      const jsonMatch = revenueResult.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in GPT-4o response');
      }
      
      const revenueTerms = JSON.parse(jsonMatch[0]);

      // Save revenue terms to database
      const revenueInserts = revenueTerms.map((term: any) => ({
        contract_extraction_id: contractExtractionId,
        user_id: user.id,
        sku: term.sku,
        product_name: term.product_name,
        quantity: term.quantity,
        unit_price: term.unit_price,
        currency: term.currency,
        billing_frequency: term.billing_frequency,
        start_date: term.start_date,
        end_date: term.end_date,
        term_months: term.term_months,
        usage_based: term.usage_based,
        usage_tiers: term.usage_tiers,
        ramp_schedule: term.ramp_schedule,
        escalation_rate: term.escalation_rate,
        minimum_commitment: term.minimum_commitment
      }));

      const { data: savedTerms, error: insertError } = await supabaseClient
        .from('revenue_terms')
        .insert(revenueInserts)
        .select();

      if (insertError) {
        throw new Error(`Failed to save revenue terms: ${insertError.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        revenue_terms: savedTerms,
        count: savedTerms.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'generate_forecast') {
      // Generate revenue forecast using the Postgres function
      const { error: forecastError } = await supabaseClient
        .rpc('compute_revenue_forecast', {
          p_contract_extraction_id: contractExtractionId,
          p_forecast_months: forecastMonths
        });

      if (forecastError) {
        throw new Error(`Failed to generate forecast: ${forecastError.message}`);
      }

      // Get the generated forecasts
      const { data: forecasts, error: fetchError } = await supabaseClient
        .from('revenue_forecasts')
        .select('*')
        .eq('contract_extraction_id', contractExtractionId)
        .order('forecast_month');

      if (fetchError) {
        throw new Error(`Failed to fetch forecasts: ${fetchError.message}`);
      }

      // Calculate variances
      for (let i = 1; i < forecasts.length; i++) {
        const current = forecasts[i];
        const previous = forecasts[i - 1];
        const variance = current.projected_revenue - previous.projected_revenue;
        const variancePercentage = previous.projected_revenue > 0 
          ? (variance / previous.projected_revenue) * 100 
          : 0;

        await supabaseClient
          .from('revenue_forecasts')
          .update({
            variance_from_previous: variance,
            variance_percentage: variancePercentage
          })
          .eq('id', current.id);
      }

      // Generate AI narrative summary
      const narrativePrompt = `
Analyze this revenue forecast data and provide a concise executive summary:

Forecast Data:
${JSON.stringify(forecasts, null, 2)}

Provide a 2-3 paragraph summary covering:
1. Total projected revenue and growth trends
2. Key observations about seasonality or patterns
3. Risk factors and confidence level
4. Recommendations for revenue optimization

Keep it executive-level and actionable.
`;

      const narrativeResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: 'You are a financial analyst. Provide clear, executive-level revenue forecast analysis.'
            },
            {
              role: 'user',
              content: narrativePrompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        })
      });

      let aiNarrative = '';
      if (narrativeResponse.ok) {
        const narrativeData = await narrativeResponse.json();
        aiNarrative = narrativeData.choices[0].message.content;

        // Update forecasts with AI narrative
        await supabaseClient
          .from('revenue_forecasts')
          .update({ ai_narrative: aiNarrative })
          .eq('contract_extraction_id', contractExtractionId);
      }

      return new Response(JSON.stringify({
        success: true,
        forecasts: forecasts,
        ai_narrative: aiNarrative,
        total_projected: forecasts.reduce((sum: number, f: any) => sum + parseFloat(f.projected_revenue), 0)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'export_csv') {
      // Get forecast data and export as CSV
      const { data: forecasts, error: fetchError } = await supabaseClient
        .from('revenue_forecasts')
        .select(`
          *,
          contract_extractions!inner (
            parties
          )
        `)
        .eq('contract_extraction_id', contractExtractionId)
        .order('forecast_month');

      if (fetchError) {
        throw new Error(`Failed to fetch forecasts: ${fetchError.message}`);
      }

      // Generate CSV content
      const csvHeaders = [
        'Month',
        'Projected Revenue',
        'ARR',
        'ACV',
        'Variance from Previous',
        'Variance %',
        'Confidence Score',
        'Contract Parties'
      ];

      const csvRows = forecasts.map((forecast: any) => [
        forecast.forecast_month,
        forecast.projected_revenue,
        forecast.arr,
        forecast.acv,
        forecast.variance_from_previous || 0,
        forecast.variance_percentage || 0,
        forecast.confidence_score,
        `"${JSON.stringify(forecast.contract_extractions.parties)}"`
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map((row: any[]) => row.join(','))
      ].join('\n');

      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="revenue_forecast_${contractExtractionId}.csv"`
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in contract-forecast function:', error);
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