import type { ModelConfig } from '../config/models.config';
import { getSystemPromptWithContext } from './productContext';

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
    return {
      response: data.candidates[0].content.parts[0].text
    };
  }

  return {
    response: 'No response from Vertex AI model'
  };
};

const callOpenAI = async (prompt: string, model: ModelConfig): Promise<LLMResponse> => {
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
  return {
    response: data.choices[0]?.message?.content || 'No response from model'
  };
};

const callAnthropic = async (prompt: string, model: ModelConfig): Promise<LLMResponse> => {
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
  return {
    response: data.content[0]?.text || 'No response from model'
  };
};

const callOllama = async (prompt: string, model: ModelConfig): Promise<LLMResponse> => {
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
  return {
    response: data.message?.content || 'No response from model'
  };
};

const mockLLMResponse = (prompt: string): LLMResponse => {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('hoodie')) {
    return {
      response: 'Our Minimal Hoodie ($49.99) is a customer favorite! It\'s a lightweight cotton blend, perfect for everyday wear. Available in sizes S, M, and L.'
    };
  }

  if (lowerPrompt.includes('sneaker') || lowerPrompt.includes('shoe')) {
    return {
      response: 'Check out our Everyday Sneakers ($79.99)! They feature a breathable mesh upper and cushioned insole for all-day comfort. Available in sizes 40-43.'
    };
  }

  if (lowerPrompt.includes('jeans') || lowerPrompt.includes('pants')) {
    return {
      response: 'Our Slim Jeans ($59.99) are made with stretch denim for comfort and mobility. Available in sizes 30, 32, and 34 in both dark and light wash.'
    };
  }

  if (lowerPrompt.includes('shirt')) {
    return {
      response: 'The Casual Shirt ($39.99) is 100% cotton with a relaxed fit. Perfect for work or weekend wear. Available in sizes S, M, and L.'
    };
  }

  if (lowerPrompt.includes('bag') || lowerPrompt.includes('tote')) {
    return {
      response: 'Our Eco Tote ($19.99) is made from 100% recycled fabric with a spacious interior and water-resistant lining. Great for shopping or daily use!'
    };
  }

  if (lowerPrompt.includes('beanie') || lowerPrompt.includes('hat')) {
    return {
      response: 'The Beanie ($14.99) is a cozy knit made from soft acrylic blend. One size fits all, available in black, gray, and burgundy.'
    };
  }

  if (lowerPrompt.includes('product') || lowerPrompt.includes('catalog') || lowerPrompt.includes('have')) {
    return {
      response: 'We have 6 products: Minimal Hoodie ($49.99), Everyday Sneakers ($79.99), Slim Jeans ($59.99), Casual Shirt ($39.99), Eco Tote ($19.99), and Beanie ($14.99). What are you interested in?'
    };
  }

  if (lowerPrompt.includes('price') || lowerPrompt.includes('cost') || lowerPrompt.includes('cheap')) {
    return {
      response: 'Our products range from $14.99 (Beanie) to $79.99 (Sneakers). Most items are between $40-60. Plus, free shipping on orders over $50!'
    };
  }

  if (lowerPrompt.includes('shipping') || lowerPrompt.includes('delivery')) {
    return {
      response: 'We offer free shipping on orders over $50! Standard delivery takes 3-5 business days. All items are in stock and ready to ship.'
    };
  }

  if (lowerPrompt.includes('return')) {
    return {
      response: 'We have a 30-day return policy on all items. Just contact support@shopsite.com or use our live chat during business hours.'
    };
  }

  if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
    return {
      response: 'Hello! Welcome to Shop Site. I can help you find products, answer questions about sizes and availability, or explain our shipping and return policies. What can I help you with?'
    };
  }

  return {
    response: 'I\'m Shop Assist, your shopping assistant! I can help you find products from our catalog (hoodies, sneakers, jeans, shirts, totes, beanies), answer questions about pricing, shipping, and returns. What would you like to know?'
  };
};
