import type { ModelConfig } from '../config/models.config';

interface LLMResponse {
  response: string;
  error?: string;
}

export const callLLM = async (prompt: string, model: ModelConfig): Promise<LLMResponse> => {
  if (model.provider === 'custom' && model.model === 'mock') {
    return mockLLMResponse(prompt);
  }

  try {
    switch (model.requestFormat) {
      case 'vertex':
        return await callVertexAI(prompt, model);
      case 'openai':
        return await callOpenAI(prompt, model);
      case 'anthropic':
        return await callAnthropic(prompt, model);
      case 'ollama':
        return await callOllama(prompt, model);
      default:
        return mockLLMResponse(prompt);
    }
  } catch (error) {
    console.error('LLM error:', error);
    return {
      response: `Error connecting to ${model.name}. Using mock response instead.`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

const callVertexAI = async (prompt: string, model: ModelConfig): Promise<LLMResponse> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${model.apiKey}`
  };

  const response = await fetch(model.apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are Shop Assist, a helpful shopping assistant. Help customers find products, answer questions, and provide excellent service.\n\nUser: ${prompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
        topP: 0.8,
        topK: 40
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Vertex AI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return {
      response: data.candidates[0].content.parts[0].text
    };
  }

  return {
    response: 'No response from Vertex AI model'
  };
};

const callOpenAI = async (prompt: string, model: ModelConfig): Promise<LLMResponse> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(model.headers || {})
  };

  if (model.provider === 'azure') {
    headers['api-key'] = model.apiKey || '';
  } else {
    headers['Authorization'] = `Bearer ${model.apiKey}`;
  }

  const url = model.provider === 'azure'
    ? `${model.apiUrl}/openai/deployments/${model.model}/chat/completions?api-version=2024-02-15-preview`
    : model.apiUrl;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model.model,
      messages: [
        {
          role: 'system',
          content: 'You are Shop Assist, a helpful shopping assistant. Help customers find products, answer questions, and provide excellent service.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    response: data.choices[0]?.message?.content || 'No response from model'
  };
};

const callAnthropic = async (prompt: string, model: ModelConfig): Promise<LLMResponse> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': model.apiKey || '',
    ...(model.headers || {})
  };

  const response = await fetch(model.apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model.model,
      max_tokens: 500,
      system: 'You are Shop Assist, a helpful shopping assistant. Help customers find products, answer questions, and provide excellent service.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    response: data.content[0]?.text || 'No response from model'
  };
};

const callOllama = async (prompt: string, model: ModelConfig): Promise<LLMResponse> => {
  const response = await fetch(model.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model.model,
      messages: [
        {
          role: 'system',
          content: 'You are Shop Assist, a helpful shopping assistant. Help customers find products, answer questions, and provide excellent service.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    response: data.message?.content || 'No response from model'
  };
};

const mockLLMResponse = (prompt: string): LLMResponse => {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('product') || lowerPrompt.includes('catalog')) {
    return {
      response: 'We have a great selection of products! Check out our catalog page to browse our latest items including t-shirts, hoodies, and accessories.'
    };
  }

  if (lowerPrompt.includes('price') || lowerPrompt.includes('cost')) {
    return {
      response: 'Our products range from $20 to $80. Would you like to see specific items in your price range?'
    };
  }

  if (lowerPrompt.includes('shipping') || lowerPrompt.includes('delivery')) {
    return {
      response: 'We offer free shipping on orders over $50. Standard delivery takes 3-5 business days.'
    };
  }

  if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
    return {
      response: 'Hello! How can I help you with your shopping today?'
    };
  }

  return {
    response: 'I\'m here to help! Feel free to ask about our products, prices, or shipping options. This is a demo response since no LLM is configured.'
  };
};
