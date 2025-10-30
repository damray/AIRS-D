export interface ModelConfig {
  id: string;
  name: string;
  provider: 'vertex' | 'anthropic' | 'ollama' | 'azure' | 'custom';
  apiUrl: string;
  apiKey?: string;
  model: string;
  enabled: boolean;
  description?: string;
  headers?: Record<string, string>;
  requestFormat?: 'vertex' | 'anthropic' | 'ollama' | 'openai' | 'custom';
  projectId?: string;
  location?: string;
}

export const MODELS: ModelConfig[] = [
  {
    id: 'gemini-pro',
    name: 'Gemini Pro (Vertex AI)',
    provider: 'vertex',
    apiUrl: `https://${import.meta.env.VITE_VERTEX_LOCATION || 'us-central1'}-aiplatform.googleapis.com/v1/projects/${import.meta.env.VITE_VERTEX_PROJECT_ID}/locations/${import.meta.env.VITE_VERTEX_LOCATION || 'us-central1'}/publishers/google/models/gemini-pro:streamGenerateContent`,
    apiKey: import.meta.env.VITE_VERTEX_API_KEY || '',
    model: 'gemini-pro',
    enabled: !!(import.meta.env.VITE_VERTEX_PROJECT_ID && import.meta.env.VITE_VERTEX_API_KEY),
    description: 'Google Gemini Pro via Vertex AI',
    requestFormat: 'vertex',
    projectId: import.meta.env.VITE_VERTEX_PROJECT_ID || '',
    location: import.meta.env.VITE_VERTEX_LOCATION || 'us-central1'
  },
  {
    id: 'gemini-pro-vision',
    name: 'Gemini Pro Vision (Vertex AI)',
    provider: 'vertex',
    apiUrl: `https://${import.meta.env.VITE_VERTEX_LOCATION || 'us-central1'}-aiplatform.googleapis.com/v1/projects/${import.meta.env.VITE_VERTEX_PROJECT_ID}/locations/${import.meta.env.VITE_VERTEX_LOCATION || 'us-central1'}/publishers/google/models/gemini-pro-vision:streamGenerateContent`,
    apiKey: import.meta.env.VITE_VERTEX_API_KEY || '',
    model: 'gemini-pro-vision',
    enabled: !!(import.meta.env.VITE_VERTEX_PROJECT_ID && import.meta.env.VITE_VERTEX_API_KEY),
    description: 'Google Gemini Pro Vision via Vertex AI',
    requestFormat: 'vertex',
    projectId: import.meta.env.VITE_VERTEX_PROJECT_ID || '',
    location: import.meta.env.VITE_VERTEX_LOCATION || 'us-central1'
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus (Anthropic)',
    provider: 'anthropic',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    model: 'claude-3-opus-20240229',
    enabled: !!import.meta.env.VITE_ANTHROPIC_API_KEY,
    description: 'Anthropic Claude 3 Opus model',
    requestFormat: 'anthropic',
    headers: {
      'anthropic-version': '2023-06-01'
    }
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet (Anthropic)',
    provider: 'anthropic',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    model: 'claude-3-sonnet-20240229',
    enabled: !!import.meta.env.VITE_ANTHROPIC_API_KEY,
    description: 'Anthropic Claude 3 Sonnet model',
    requestFormat: 'anthropic',
    headers: {
      'anthropic-version': '2023-06-01'
    }
  },
  {
    id: 'ollama-llama2',
    name: 'Llama 2 (Ollama)',
    provider: 'ollama',
    apiUrl: import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434/api/chat',
    model: 'llama2',
    enabled: !!import.meta.env.VITE_OLLAMA_API_URL,
    description: 'Llama 2 via Ollama',
    requestFormat: 'ollama'
  },
  {
    id: 'ollama-mistral',
    name: 'Mistral (Ollama)',
    provider: 'ollama',
    apiUrl: import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434/api/chat',
    model: 'mistral',
    enabled: !!import.meta.env.VITE_OLLAMA_API_URL,
    description: 'Mistral via Ollama',
    requestFormat: 'ollama'
  },
  {
    id: 'ollama-codellama',
    name: 'Code Llama (Ollama)',
    provider: 'ollama',
    apiUrl: import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434/api/chat',
    model: 'codellama',
    enabled: !!import.meta.env.VITE_OLLAMA_API_URL,
    description: 'Code Llama via Ollama',
    requestFormat: 'ollama'
  },
  {
    id: 'azure-gpt4',
    name: 'GPT-4 (Azure)',
    provider: 'azure',
    apiUrl: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || '',
    apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY || '',
    model: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
    enabled: !!(import.meta.env.VITE_AZURE_OPENAI_ENDPOINT && import.meta.env.VITE_AZURE_OPENAI_API_KEY),
    description: 'Azure OpenAI GPT-4',
    requestFormat: 'openai',
    headers: {
      'api-key': import.meta.env.VITE_AZURE_OPENAI_API_KEY || ''
    }
  },
  {
    id: 'mock-llm',
    name: 'Mock LLM (Demo)',
    provider: 'custom',
    apiUrl: '',
    model: 'mock',
    enabled: true,
    description: 'Mock LLM for testing without API keys',
    requestFormat: 'custom'
  }
];

export const getAvailableModels = (): ModelConfig[] => {
  return MODELS.filter(model => model.enabled);
};

export const getModelById = (id: string): ModelConfig | undefined => {
  return MODELS.find(model => model.id === id);
};

export const getDefaultModel = (): ModelConfig => {
  const availableModels = getAvailableModels();
  return availableModels[0] || MODELS[MODELS.length - 1];
};
