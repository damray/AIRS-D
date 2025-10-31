import type { ModelConfig } from '../config/models.config';
import { getSystemPromptWithContext } from './productContext';
import { estimateTokens, type TokenUsage } from '../utils/tokenCounter';

interface LLMResponse {
  response: string;
  error?: string;
  tokenUsage?: TokenUsage;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const callLLM = async (prompt: string, model: ModelConfig): Promise<LLMResponse> => {
  if (model.provider === 'custom' && model.model === 'mock') {
    return mockLLMResponse(prompt);
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/llm/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        provider: model.provider,
        model: model.model
      })
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();

    const tokenUsage: TokenUsage = {
      promptTokens: estimateTokens(prompt),
      completionTokens: estimateTokens(data.response),
      totalTokens: estimateTokens(prompt + data.response)
    };

    return {
      response: data.response,
      tokenUsage
    };
  } catch (error) {
    console.error('LLM error:', error);
    return {
      response: `Error connecting to ${model.name}. Using mock response instead.`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

const _callVertexAI = async (prompt: string, model: ModelConfig): Promise<LLMResponse> => {
  const systemPrompt = getSystemPromptWithContext();
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
              text: `${systemPrompt}\n\nUser: ${prompt}`
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
    const responseText = data.candidates[0].content.parts[0].text;
    const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;

    const tokenUsage: TokenUsage = {
      promptTokens: data.usageMetadata?.promptTokenCount || estimateTokens(fullPrompt),
      completionTokens: data.usageMetadata?.candidatesTokenCount || estimateTokens(responseText),
      totalTokens: data.usageMetadata?.totalTokenCount || estimateTokens(fullPrompt + responseText)
    };

    return {
      response: responseText,
      tokenUsage
    };
  }

  return {
    response: 'No response from Vertex AI model'
  };
};

const _callOpenAI = async (prompt: string, model: ModelConfig): Promise<LLMResponse> => {
  const systemPrompt = getSystemPromptWithContext();
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
          content: systemPrompt
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

  const tokenUsage: TokenUsage = {
    promptTokens: data.usage?.prompt_tokens || estimateTokens(systemPrompt + prompt),
    completionTokens: data.usage?.completion_tokens || estimateTokens(data.choices[0]?.message?.content || ''),
    totalTokens: data.usage?.total_tokens || 0
  };

  return {
    response: data.choices[0]?.message?.content || 'No response from model',
    tokenUsage
  };
};

const _callAnthropic = async (prompt: string, model: ModelConfig): Promise<LLMResponse> => {
  const systemPrompt = getSystemPromptWithContext();
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
      system: systemPrompt,
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

  const tokenUsage: TokenUsage = {
    promptTokens: data.usage?.input_tokens || estimateTokens(systemPrompt + prompt),
    completionTokens: data.usage?.output_tokens || estimateTokens(data.content[0]?.text || ''),
    totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
  };

  return {
    response: data.content[0]?.text || 'No response from model',
    tokenUsage
  };
};

const _callOllama = async (prompt: string, model: ModelConfig): Promise<LLMResponse> => {
  const systemPrompt = getSystemPromptWithContext();
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
          content: systemPrompt
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

  const responseText = data.message?.content || '';
  const tokenUsage: TokenUsage = {
    promptTokens: estimateTokens(systemPrompt + prompt),
    completionTokens: estimateTokens(responseText),
    totalTokens: estimateTokens(systemPrompt + prompt + responseText)
  };

  return {
    response: responseText || 'No response from model',
    tokenUsage
  };
};

const mockLLMResponse = (prompt: string): LLMResponse => {
  const lowerPrompt = prompt.toLowerCase();
  let responseText = '';

  if (lowerPrompt.includes('hoodie')) {
    responseText = 'Our Minimal Hoodie ($49.99) is a customer favorite! It\'s a lightweight cotton blend, perfect for everyday wear. Available in sizes S, M, and L.';
  } else if (lowerPrompt.includes('sneaker') || lowerPrompt.includes('shoe')) {
    responseText = 'Check out our Everyday Sneakers ($79.99)! They feature a breathable mesh upper and cushioned insole for all-day comfort. Available in sizes 40-43.';
  } else if (lowerPrompt.includes('jeans') || lowerPrompt.includes('pants')) {
    responseText = 'Our Slim Jeans ($59.99) are made with stretch denim for comfort and mobility. Available in sizes 30, 32, and 34 in both dark and light wash.';
  } else if (lowerPrompt.includes('shirt')) {
    responseText = 'The Casual Shirt ($39.99) is 100% cotton with a relaxed fit. Perfect for work or weekend wear. Available in sizes S, M, and L.';
  } else if (lowerPrompt.includes('bag') || lowerPrompt.includes('tote')) {
    responseText = 'Our Eco Tote ($19.99) is made from 100% recycled fabric with a spacious interior and water-resistant lining. Great for shopping or daily use!';
  } else if (lowerPrompt.includes('beanie') || lowerPrompt.includes('hat')) {
    responseText = 'The Beanie ($14.99) is a cozy knit made from soft acrylic blend. One size fits all, available in black, gray, and burgundy.';
  } else if (lowerPrompt.includes('product') || lowerPrompt.includes('catalog') || lowerPrompt.includes('have')) {
    responseText = 'We have 6 products: Minimal Hoodie ($49.99), Everyday Sneakers ($79.99), Slim Jeans ($59.99), Casual Shirt ($39.99), Eco Tote ($19.99), and Beanie ($14.99). What are you interested in?';
  }

  else if (lowerPrompt.includes('price') || lowerPrompt.includes('cost') || lowerPrompt.includes('cheap')) {
    responseText = 'Our products range from $14.99 (Beanie) to $79.99 (Sneakers). Most items are between $40-60. Plus, free shipping on orders over $50!';
  } else if (lowerPrompt.includes('shipping') || lowerPrompt.includes('delivery')) {
    responseText = 'We offer free shipping on orders over $50! Standard delivery takes 3-5 business days. All items are in stock and ready to ship.';
  } else if (lowerPrompt.includes('return')) {
    responseText = 'We have a 30-day return policy on all items. Just contact support@shopsite.com or use our live chat during business hours.';
  } else if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
    responseText = 'Hello! Welcome to Shop Site. I can help you find products, answer questions about sizes and availability, or explain our shipping and return policies. What can I help you with?';
  } else {
    responseText = 'I\'m Shop Assist, your shopping assistant! I can help you find products from our catalog (hoodies, sneakers, jeans, shirts, totes, beanies), answer questions about pricing, shipping, and returns. What would you like to know?';
  }

  const tokenUsage: TokenUsage = {
    promptTokens: estimateTokens(prompt),
    completionTokens: estimateTokens(responseText),
    totalTokens: estimateTokens(prompt + responseText)
  };

  return {
    response: responseText,
    tokenUsage
  };
};
