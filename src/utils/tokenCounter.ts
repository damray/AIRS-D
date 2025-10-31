export const estimateTokens = (text: string): number => {
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;

  return Math.ceil((words * 1.3 + chars * 0.25) / 4);
};

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'gemini-pro': {
    inputPer1M: 0.50,
    outputPer1M: 1.50
  },
  'gemini-pro-vision': {
    inputPer1M: 0.50,
    outputPer1M: 1.50
  },
  'gpt-4': {
    inputPer1M: 30.00,
    outputPer1M: 60.00
  },
  'gpt-3.5-turbo': {
    inputPer1M: 0.50,
    outputPer1M: 1.50
  },
  'claude-3-opus-20240229': {
    inputPer1M: 15.00,
    outputPer1M: 75.00
  },
  'claude-3-sonnet-20240229': {
    inputPer1M: 3.00,
    outputPer1M: 15.00
  },
  'gpt-4-azure': {
    inputPer1M: 30.00,
    outputPer1M: 60.00
  },
  'ollama': {
    inputPer1M: 0,
    outputPer1M: 0
  },
  'mock': {
    inputPer1M: 0,
    outputPer1M: 0
  }
};

export const calculateCost = (usage: TokenUsage, modelName: string): number => {
  const pricing = MODEL_PRICING[modelName] || { inputPer1M: 0, outputPer1M: 0 };

  const inputCost = (usage.promptTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (usage.completionTokens / 1_000_000) * pricing.outputPer1M;

  return inputCost + outputCost;
};

export const formatCost = (cost: number): string => {
  if (cost === 0) return '$0.00';
  if (cost < 0.0001) return '<$0.0001';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(4)}`;
};

export const formatTokens = (tokens: number): string => {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
};
