export interface ModelConfig {
  id: string;
  name: string;
  provider: 'vertex' | 'anthropic' | 'ollama' | 'azure' | 'custom';
  model: string;
  enabled: boolean;
  description?: string;
}

export const MODELS: ModelConfig[] = [
  {
    id: 'gemini-pro',
    name: 'Gemini Pro (Vertex AI)',
    provider: 'vertex',
    model: 'gemini-pro',
    enabled: true,
    description: 'Google Gemini Pro via Vertex AI',
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus (Anthropic)',
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    enabled: true,
    description: 'Anthropic Claude 3 Opus model',
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet (Anthropic)',
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    enabled: true,
    description: 'Anthropic Claude 3 Sonnet model',
  },
  {
    id: 'ollama-llama3',
    name: 'Llama 3.1 (Ollama)',
    provider: 'ollama',
    model: 'llama3.1:8b',
    enabled: true,
    description: 'Llama 3.1 via Ollama',
  },
  {
    id: 'ollama-mistral',
    name: 'Mistral (Ollama)',
    provider: 'ollama',
    model: 'mistral:7b-instruct',
    enabled: true,
    description: 'Mistral via Ollama',
  },
  {
    id: 'azure-gpt4',
    name: 'GPT-4 (Azure)',
    provider: 'azure',
    model: 'gpt-4',
    enabled: true,
    description: 'Azure OpenAI GPT-4',
  },
  {
    id: 'mock-llm',
    name: 'Mock LLM (Demo)',
    provider: 'custom',
    model: 'mock',
    enabled: true,
    description: 'Mock LLM for testing without API keys',
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
