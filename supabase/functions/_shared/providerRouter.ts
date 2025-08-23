interface ModelCall {
  model: string;
  messages: Array<{ role: string; content: string }>;
  tools?: any[];
  temperature?: number;
}

interface ModelResponse {
  answer: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  citations?: any[];
  error?: boolean;
  provider?: string;
  status?: number;
  message?: string;
}

export async function callModel({ model, messages, tools, temperature = 0.7 }: ModelCall): Promise<ModelResponse> {
  console.log(`Calling model: ${model}`);
  
  try {
    switch (model) {
      case 'openai:gpt-5':
        return await callOpenAI('gpt-5-2025-08-07', messages, tools, temperature);
      
      case 'anthropic:claude-3-5-sonnet':
        return await callAnthropic('claude-3-5-sonnet-20241022', messages, tools, temperature);
      
      case 'google:gemini-1.5-pro':
        return await callGemini('gemini-1.5-pro', messages, tools, temperature);
      
      case 'perplexity:sonar-pro':
        return await callPerplexity('sonar-pro', messages, tools, temperature);
      
      default:
        return {
          error: true,
          provider: 'unknown',
          status: 400,
          message: `Unsupported model: ${model}`,
          answer: ''
        };
    }
  } catch (error) {
    console.error(`Provider error for ${model}:`, error);
    return {
      error: true,
      provider: model.split(':')[0],
      status: 500,
      message: error.message,
      answer: ''
    };
  }
}

async function callOpenAI(model: string, messages: any[], tools?: any[], temperature?: number): Promise<ModelResponse> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Try GPT-5 first, fallback to GPT-4o if it fails
  let actualModel = model;
  let requestBody: any = {
    model: actualModel,
    messages,
    max_completion_tokens: 2000
  };

  if (tools) {
    requestBody.tools = tools;
  }

  let response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  // If GPT-5 fails, fallback to GPT-4o
  if (!response.ok && model === 'gpt-5-2025-08-07') {
    console.log('GPT-5 failed, falling back to GPT-4o');
    actualModel = 'gpt-4o';
    requestBody = {
      model: actualModel,
      messages,
      max_tokens: 2000,
      temperature: temperature || 0.7
    };

    if (tools) {
      requestBody.tools = tools;
    }

    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  return {
    answer: data.choices[0]?.message?.content || 'No response from OpenAI',
    usage: data.usage,
    provider: 'openai'
  };
}

async function callAnthropic(model: string, messages: any[], tools?: any[], temperature?: number): Promise<ModelResponse> {
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
      model,
      max_tokens: 2000,
      messages: messages.filter(m => m.role !== 'system'),
      system: messages.find(m => m.role === 'system')?.content || undefined,
      tools,
      temperature
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  return {
    answer: data.content[0]?.text || 'No response from Claude',
    usage: data.usage,
    provider: 'anthropic'
  };
}

async function callGemini(model: string, messages: any[], tools?: any[], temperature?: number): Promise<ModelResponse> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const systemMessage = messages.find(m => m.role === 'system');
  const userMessages = messages.filter(m => m.role !== 'system');
  
  const content = systemMessage 
    ? `${systemMessage.content}\n\n${userMessages.map(m => m.content).join('\n')}`
    : userMessages.map(m => m.content).join('\n');

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: content }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 2000,
        temperature
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  return {
    answer: data.candidates[0]?.content?.parts[0]?.text || 'No response from Gemini',
    usage: data.usageMetadata,
    provider: 'google'
  };
}

async function callPerplexity(model: string, messages: any[], tools?: any[], temperature?: number): Promise<ModelResponse> {
  const apiKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!apiKey) {
    throw new Error('Perplexity API key not configured');
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  return {
    answer: data.choices[0]?.message?.content || 'No response from Perplexity',
    usage: data.usage,
    provider: 'perplexity'
  };
}