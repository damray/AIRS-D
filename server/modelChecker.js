export function checkAvailableModels() {
  const models = [];

  if (process.env.VERTEX_API_KEY && process.env.VERTEX_PROJECT_ID) {
    models.push({
      id: 'gemini-pro',
      name: 'Gemini Pro (Vertex AI)',
      provider: 'vertex',
      model: 'gemini-pro',
      enabled: true,
      description: 'Google Gemini Pro via Vertex AI',
      configured: true
    });
    models.push({
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro (Vertex AI)',
      provider: 'vertex',
      model: 'gemini-1.5-pro',
      enabled: true,
      description: 'Google Gemini 1.5 Pro via Vertex AI',
      configured: true
    });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    models.push({
      id: 'claude-3-opus',
      name: 'Claude 3 Opus (Anthropic)',
      provider: 'anthropic',
      model: 'claude-3-opus-20240229',
      enabled: true,
      description: 'Anthropic Claude 3 Opus model',
      configured: true
    });
    models.push({
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet (Anthropic)',
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      enabled: true,
      description: 'Anthropic Claude 3 Sonnet model',
      configured: true
    });
    models.push({
      id: 'claude-3-haiku',
      name: 'Claude 3 Haiku (Anthropic)',
      provider: 'anthropic',
      model: 'claude-3-haiku-20240307',
      enabled: true,
      description: 'Anthropic Claude 3 Haiku model (fastest)',
      configured: true
    });
  }

  if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';
    models.push({
      id: 'azure-gpt4',
      name: `GPT-4 (Azure)`,
      provider: 'azure',
      model: deployment,
      enabled: true,
      description: 'Azure OpenAI GPT-4',
      configured: true
    });
  }

  if (process.env.OLLAMA_API_URL || true) {
    models.push({
      id: 'ollama-llama3',
      name: 'Llama 3.1 (Ollama)',
      provider: 'ollama',
      model: 'llama3.1:8b',
      enabled: true,
      description: 'Llama 3.1 via Ollama (requires Ollama running)',
      configured: true
    });
    models.push({
      id: 'ollama-mistral',
      name: 'Mistral (Ollama)',
      provider: 'ollama',
      model: 'mistral:7b-instruct',
      enabled: true,
      description: 'Mistral via Ollama (requires Ollama running)',
      configured: true
    });
  }

  models.push({
    id: 'mock-llm',
    name: 'Mock LLM (Demo)',
    provider: 'custom',
    model: 'mock',
    enabled: true,
    description: 'Mock LLM for testing without API keys',
    configured: true
  });

  return models;
}

export function getModelCapabilities() {
  return {
    vertex: {
      supportsStreaming: false,
      maxTokens: 8192,
      rateLimitInfo: 'Quota-based, varies by project'
    },
    anthropic: {
      supportsStreaming: true,
      maxTokens: 200000,
      rateLimitInfo: 'Tier-based rate limits'
    },
    azure: {
      supportsStreaming: true,
      maxTokens: 128000,
      rateLimitInfo: 'Deployment-based quotas'
    },
    ollama: {
      supportsStreaming: true,
      maxTokens: 32768,
      rateLimitInfo: 'No rate limits (local)'
    },
    custom: {
      supportsStreaming: false,
      maxTokens: 1000,
      rateLimitInfo: 'N/A (mock)'
    }
  };
}

export function isProviderConfigured(provider) {
  switch (provider) {
    case 'vertex':
      return !!(process.env.VERTEX_API_KEY && process.env.VERTEX_PROJECT_ID);
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    case 'azure':
      return !!(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT);
    case 'ollama':
      return true;
    case 'custom':
      return true;
    default:
      return false;
  }
}
