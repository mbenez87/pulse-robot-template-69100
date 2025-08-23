import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { instruction, model = 'anthropic', language, constraints, run } = await req.json();

    if (!instruction) {
      return new Response(
        JSON.stringify({ error: 'Instruction is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating code with model:', model);

    const systemPrompt = `You are an expert programmer. Generate clean, well-documented code based on the user's instruction.

Requirements:
- Provide complete, working code
- Include appropriate comments
- Follow best practices for the specified language${language ? ` (${language})` : ''}
- Return the response in the following JSON format:
{
  "files": [{"path": "filename.ext", "content": "..."}],
  "commands": ["command1", "command2"],
  "tests": "test code if applicable"
}

${constraints ? `Additional constraints: ${constraints}` : ''}`;

    let response;
    let answer = '';

    switch (model) {
      case 'anthropic':
        response = await callAnthropicAPI(instruction, systemPrompt);
        answer = response.content[0]?.text || 'No response from Claude';
        break;
      
      case 'openai':
        response = await callOpenAIAPI(instruction, systemPrompt);
        answer = response.choices[0]?.message?.content || 'No response from GPT';
        break;
      
      case 'google':
        response = await callGeminiAPI(instruction, systemPrompt);
        answer = response.candidates[0]?.content?.parts[0]?.text || 'No response from Gemini';
        break;
      
      default:
        throw new Error(`Unsupported model for code generation: ${model}`);
    }

    // Try to parse the response as JSON, fallback to structured text
    let codeOutput;
    try {
      // Extract JSON from the response if it's wrapped in markdown
      const jsonMatch = answer.match(/```json\n([\s\S]*?)\n```/) || answer.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        codeOutput = JSON.parse(jsonMatch[1]);
      } else {
        // Fallback: create a simple structure
        codeOutput = {
          files: [{ path: 'generated.txt', content: answer }],
          commands: [],
          tests: null
        };
      }
    } catch (error) {
      console.error('Failed to parse code response:', error);
      codeOutput = {
        files: [{ path: 'generated.txt', content: answer }],
        commands: [],
        tests: null
      };
    }

    // Optional: Run code in sandbox if requested and it's JS/TS
    if (run && language && ['javascript', 'typescript', 'js', 'ts'].includes(language.toLowerCase())) {
      try {
        const output = await runCodeInSandbox(codeOutput.files[0]?.content || '');
        codeOutput.output = output;
      } catch (error) {
        codeOutput.output = `Execution error: ${error.message}`;
      }
    }

    return new Response(
      JSON.stringify({ 
        content: answer,
        codeOutput,
        search_results_count: 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in code function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function runCodeInSandbox(code: string): Promise<string> {
  // Create a simple sandbox for JS/TS execution
  // This is a basic implementation - in production you'd want more robust sandboxing
  try {
    const tempFile = await Deno.makeTempFile({ suffix: '.js' });
    await Deno.writeTextFile(tempFile, code);
    
    const command = new Deno.Command('deno', {
      args: ['run', '--no-check', tempFile],
      stdout: 'piped',
      stderr: 'piped',
    });

    const { code: exitCode, stdout, stderr } = await command.output();
    
    await Deno.remove(tempFile);
    
    const output = new TextDecoder().decode(stdout);
    const errors = new TextDecoder().decode(stderr);
    
    if (exitCode !== 0) {
      return `Exit code: ${exitCode}\nErrors: ${errors}`;
    }
    
    return output || 'No output';
  } catch (error) {
    return `Sandbox error: ${error.message}`;
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
      max_tokens: 4000,
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
    max_completion_tokens: 4000
  };

  let response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

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
      max_tokens: 4000,
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
              text: systemPrompt ? `${systemPrompt}\n\nInstruction: ${question}` : question
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 4000,
        temperature: 0.7
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  return await response.json();
}