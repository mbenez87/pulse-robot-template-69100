import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ObligationRequest {
  contractExtractionId: string;
  action?: 'extract' | 'check_due' | 'generate_reminders';
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

    const { contractExtractionId, action = 'extract' }: ObligationRequest = await req.json();

    if (!contractExtractionId) {
      throw new Error('Contract extraction ID is required');
    }

    if (action === 'extract') {
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

      // Use GPT-4o to extract obligations from the contract data
      const obligationsPrompt = `
Based on the following contract analysis, extract all specific obligations, deadlines, and actionable items. Return as JSON array:

Contract Analysis:
${JSON.stringify(contractExtraction, null, 2)}

Return a JSON array of obligations in this format:
[
  {
    "obligation_type": "payment|delivery|review|renewal_notice|termination|reporting",
    "description": "Clear description of the obligation",
    "due_date": "YYYY-MM-DD (calculate based on contract terms)",
    "threshold_amount": number_or_null,
    "threshold_metric": "revenue|usage|time|units|null",
    "responsible_party": "party responsible for this obligation",
    "priority": "low|medium|high|critical"
  }
]

Focus on:
1. Payment due dates and amounts
2. Renewal notice requirements
3. Termination notice periods
4. Delivery deadlines
5. Review milestones
6. Reporting requirements
7. Performance thresholds

Calculate specific due dates where possible based on contract start date and term details.
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
              content: 'You are a contract management expert. Extract specific, actionable obligations with accurate due dates.'
            },
            {
              role: 'user',
              content: obligationsPrompt
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
      const obligationsResult = openaiData.choices[0].message.content;
      
      // Parse the JSON response
      const jsonMatch = obligationsResult.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in GPT-4o response');
      }
      
      const obligations = JSON.parse(jsonMatch[0]);

      // Save obligations to database
      const obligationInserts = obligations.map((obligation: any) => ({
        contract_extraction_id: contractExtractionId,
        user_id: user.id,
        obligation_type: obligation.obligation_type,
        description: obligation.description,
        due_date: obligation.due_date,
        threshold_amount: obligation.threshold_amount,
        threshold_metric: obligation.threshold_metric,
        responsible_party: obligation.responsible_party,
        priority: obligation.priority
      }));

      const { data: savedObligations, error: insertError } = await supabaseClient
        .from('contract_obligations')
        .insert(obligationInserts)
        .select();

      if (insertError) {
        throw new Error(`Failed to save obligations: ${insertError.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        obligations: savedObligations,
        count: savedObligations.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'check_due') {
      // Check for obligations due soon and generate reminders
      const currentDate = new Date();
      const reminderDate = new Date();
      reminderDate.setDate(currentDate.getDate() + 7); // 7 days ahead

      const { data: dueSoonObligations, error: fetchError } = await supabaseClient
        .from('contract_obligations')
        .select(`
          *,
          contract_extractions!inner (
            id,
            parties,
            term_details
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .lte('due_date', reminderDate.toISOString().split('T')[0])
        .eq('notification_sent', false);

      if (fetchError) {
        throw new Error(`Failed to fetch due obligations: ${fetchError.message}`);
      }

      if (!dueSoonObligations.length) {
        return new Response(JSON.stringify({
          success: true,
          message: 'No upcoming obligations found',
          count: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate email drafts for each due obligation
      const workQueueItems = [];

      for (const obligation of dueSoonObligations) {
        const emailPrompt = `
Generate a professional email reminder for this contract obligation:

Obligation: ${obligation.description}
Due Date: ${obligation.due_date}
Priority: ${obligation.priority}
Responsible Party: ${obligation.responsible_party}
Contract Parties: ${JSON.stringify(obligation.contract_extractions.parties)}

Create a concise, professional email that:
1. Clearly states the upcoming obligation
2. Includes the due date
3. Mentions any relevant amounts or thresholds
4. Provides a call to action
5. Maintains a professional tone

Return only the email content (subject and body):
`;

        const emailResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: 'You are a professional contract manager. Write clear, actionable email reminders.'
              },
              {
                role: 'user',
                content: emailPrompt
              }
            ],
            max_tokens: 500,
            temperature: 0.3
          })
        });

        if (emailResponse.ok) {
          const emailData = await emailResponse.json();
          const emailDraft = emailData.choices[0].message.content;

          workQueueItems.push({
            user_id: user.id,
            obligation_id: obligation.id,
            task_type: 'obligation_reminder',
            title: `Upcoming: ${obligation.description}`,
            description: `Contract obligation due ${obligation.due_date}`,
            priority: obligation.priority,
            due_date: obligation.due_date,
            email_draft: emailDraft
          });
        }
      }

      // Save to work queue
      const { data: workItems, error: workQueueError } = await supabaseClient
        .from('work_queue')
        .insert(workQueueItems)
        .select();

      if (workQueueError) {
        throw new Error(`Failed to save work queue items: ${workQueueError.message}`);
      }

      // Mark obligations as notified
      const obligationIds = dueSoonObligations.map(o => o.id);
      await supabaseClient
        .from('contract_obligations')
        .update({ 
          notification_sent: true, 
          notification_date: new Date().toISOString() 
        })
        .in('id', obligationIds);

      return new Response(JSON.stringify({
        success: true,
        reminders_created: workItems.length,
        work_items: workItems
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in obligation-copilot function:', error);
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