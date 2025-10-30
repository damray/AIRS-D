export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'ollama' | 'azure' | 'custom';
  apiUrl: string;
  apiKey?: string;
  model: string;
  enabled: boolean;
  description?: string;
  headers?: Record<string, string>;
  requestFormat?: 'openai' | 'anthropic' | 'ollama' | 'custom';
}

export const MODELS: ModelConfig[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4 (OpenAI)',
    provider: 'openai',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: 'gpt-4',
    enabled: !!import.meta.env.VITE_OPENAI_API_KEY,
    description: 'OpenAI GPT-4 model',
    requestFormat: 'openai'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo (OpenAI)',
    provider: 'openai',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: 'gpt-3.5-turbo',
    enabled: !!import.meta.env.VITE_OPENAI_API_KEY,
    description: 'OpenAI GPT-3.5 Turbo model',
    requestFormat: 'openai'
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
