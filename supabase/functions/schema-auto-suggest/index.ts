import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SchemaRequest {
  documentId: string;
  extractedText: string;
  action?: 'suggest' | 'approve' | 'implement';
  schemaHistoryId?: string;
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

    const { documentId, extractedText, action = 'suggest', schemaHistoryId }: SchemaRequest = await req.json();

    if (action === 'suggest') {
      if (!documentId || !extractedText) {
        throw new Error('Document ID and extracted text are required');
      }

      // Prepare the schema suggestion prompt
      const schemaPrompt = `
Analyze the following document and suggest a normalized database schema to store the data it contains:

Document Content:
${extractedText}

Create a database schema that:
1. Normalizes the data into logical tables
2. Defines appropriate column types and constraints
3. Establishes proper relationships between tables
4. Follows database design best practices

Return as JSON in this exact format:
{
  "tables": [
    {
      "name": "table_name",
      "description": "Purpose of this table",
      "columns": [
        {
          "name": "column_name",
          "type": "TEXT|INTEGER|DECIMAL|DATE|TIMESTAMP|BOOLEAN|UUID|JSONB",
          "nullable": true/false,
          "primary_key": true/false,
          "default": "default_value_or_null",
          "constraints": ["UNIQUE", "CHECK (condition)", "REFERENCES other_table(column)"]
        }
      ]
    }
  ],
  "description": "Overall description of the schema and its purpose",
  "confidence": 0.95
}

Focus on:
- Identifying entities and relationships in the document
- Proper data types for each field
- Primary keys and foreign key relationships
- Constraints that ensure data integrity
- Normalized structure to avoid redundancy
`;

      let suggestedSchema: any;
      let aiModel = 'gpt-4o';

      try {
        // Try GPT-4o first
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
                content: 'You are a database design expert. Create well-normalized, practical database schemas.'
              },
              {
                role: 'user',
                content: schemaPrompt
              }
            ],
            max_tokens: 4000,
            temperature: 0.1
          })
        });

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }

        const openaiData = await openaiResponse.json();
        const schemaResult = openaiData.choices[0].message.content;
        
        // Parse the JSON response
        const jsonMatch = schemaResult.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in GPT-4o response');
        }
        
        suggestedSchema = JSON.parse(jsonMatch[0]);
        console.log('Successfully generated schema with GPT-4o');

      } catch (gptError) {
        console.log('GPT-4o failed, falling back to Gemini 1.5 Pro:', gptError);
        
        // Fallback to Gemini 1.5 Pro
        aiModel = 'gemini-1.5-pro';
        
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: schemaPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4000
            }
          })
        });

        if (!geminiResponse.ok) {
          const errorData = await geminiResponse.json();
          throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorData.error?.message}`);
        }

        const geminiData = await geminiResponse.json();
        const schemaResult = geminiData.candidates[0].content.parts[0].text;
        
        // Parse the JSON response
        const jsonMatch = schemaResult.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in Gemini response');
        }
        
        suggestedSchema = JSON.parse(jsonMatch[0]);
        console.log('Successfully generated schema with Gemini 1.5 Pro fallback');
      }

      // Generate SQL migration for the suggested schema
      let migrationSql = `-- Auto-generated schema migration\n-- Generated from document analysis\n\n`;
      const tableNames: string[] = [];

      for (const table of suggestedSchema.tables) {
        tableNames.push(table.name);
        
        migrationSql += `-- Create ${table.name} table\n`;
        migrationSql += `-- ${table.description}\n`;
        migrationSql += `CREATE TABLE public.${table.name} (\n`;
        
        const columnDefinitions = table.columns.map((col: any) => {
          let definition = `  ${col.name} ${col.type}`;
          
          if (!col.nullable) {
            definition += ' NOT NULL';
          }
          
          if (col.default) {
            definition += ` DEFAULT ${col.default}`;
          }
          
          if (col.primary_key) {
            definition += ' PRIMARY KEY';
          }
          
          return definition;
        });
        
        migrationSql += columnDefinitions.join(',\n');
        migrationSql += '\n);\n\n';
        
        // Add constraints
        for (const column of table.columns) {
          if (column.constraints) {
            for (const constraint of column.constraints) {
              if (constraint.startsWith('REFERENCES')) {
                migrationSql += `ALTER TABLE public.${table.name} ADD CONSTRAINT fk_${table.name}_${column.name} FOREIGN KEY (${column.name}) ${constraint};\n`;
              } else if (constraint.startsWith('UNIQUE')) {
                migrationSql += `ALTER TABLE public.${table.name} ADD CONSTRAINT uc_${table.name}_${column.name} UNIQUE (${column.name});\n`;
              } else if (constraint.startsWith('CHECK')) {
                migrationSql += `ALTER TABLE public.${table.name} ADD CONSTRAINT chk_${table.name}_${column.name} ${constraint};\n`;
              }
            }
          }
        }
        
        // Enable RLS
        migrationSql += `ALTER TABLE public.${table.name} ENABLE ROW LEVEL SECURITY;\n`;
        migrationSql += `CREATE POLICY "Users can manage their own ${table.name}" ON public.${table.name} FOR ALL USING (auth.uid() = user_id);\n\n`;
      }

      // Save the schema suggestion to database
      const { data: schemaHistory, error: insertError } = await supabaseClient
        .from('schema_history')
        .insert({
          document_id: documentId,
          user_id: user.id,
          suggested_schema: suggestedSchema,
          schema_description: suggestedSchema.description,
          ai_model: aiModel,
          confidence_score: suggestedSchema.confidence || 0.8,
          migration_sql: migrationSql,
          table_names: tableNames,
          status: 'suggested'
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to save schema suggestion: ${insertError.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        schema_history: schemaHistory,
        suggested_schema: suggestedSchema,
        migration_sql: migrationSql,
        model_used: aiModel
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'approve') {
      if (!schemaHistoryId) {
        throw new Error('Schema history ID is required for approval');
      }

      // Update schema status to approved
      const { data: approvedSchema, error: updateError } = await supabaseClient
        .from('schema_history')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', schemaHistoryId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to approve schema: ${updateError.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Schema approved successfully',
        schema_history: approvedSchema
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'implement') {
      if (!schemaHistoryId) {
        throw new Error('Schema history ID is required for implementation');
      }

      // Get the approved schema
      const { data: schemaHistory, error: fetchError } = await supabaseClient
        .from('schema_history')
        .select('*')
        .eq('id', schemaHistoryId)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single();

      if (fetchError || !schemaHistory) {
        throw new Error('Approved schema not found');
      }

      // Use service role to execute the migration
      const serviceRoleClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      try {
        // Execute the migration SQL
        const { error: migrationError } = await serviceRoleClient
          .rpc('exec_sql', { sql: schemaHistory.migration_sql });

        if (migrationError) {
          throw new Error(`Migration failed: ${migrationError.message}`);
        }

        // Update schema status to implemented
        await supabaseClient
          .from('schema_history')
          .update({
            status: 'implemented',
            implemented_at: new Date().toISOString()
          })
          .eq('id', schemaHistoryId);

        return new Response(JSON.stringify({
          success: true,
          message: 'Schema implemented successfully',
          tables_created: schemaHistory.table_names
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (implementError) {
        // Mark as failed
        await supabaseClient
          .from('schema_history')
          .update({
            status: 'rejected',
            rejected_reason: `Implementation failed: ${implementError}`
          })
          .eq('id', schemaHistoryId);

        throw implementError;
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in schema-auto-suggest function:', error);
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