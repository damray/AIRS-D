const DEFAULT_TIMEOUT_MS = 5000;

async function safeFetch(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function checkVertexConnectivity(model) {
  const projectId = process.env.VERTEX_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION || 'us-central1';
  const apiKey = process.env.VERTEX_API_KEY;
  if (!projectId || !apiKey) return false;

  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}`;
  try {
    const res = await safeFetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }, 4000);
    return res.ok;
  } catch (err) {
    console.warn(`[ModelChecker] Vertex model ${model} unreachable: ${err?.message || err}`);
    return false;
  }
}

async function checkAnthropicConnectivity() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return false;
  try {
    const res = await safeFetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    }, 4000);
    return res.ok;
  } catch (err) {
    console.warn(`[ModelChecker] Anthropic connectivity failed: ${err?.message || err}`);
    return false;
  }
}

async function checkAzureConnectivity() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  if (!endpoint || !apiKey) return false;
  const url = `${endpoint}/openai/deployments?api-version=2024-02-15-preview`;
  try {
    const res = await safeFetch(url, {
      headers: { 'api-key': apiKey }
    }, 4000);
    return res.ok;
  } catch (err) {
    console.warn(`[ModelChecker] Azure OpenAI connectivity failed: ${err?.message || err}`);
    return false;
  }
}

async function checkOllamaConnectivity() {
  // Normalize to a tags endpoint even if OLLAMA_API_URL points to /api/chat
  const raw = process.env.OLLAMA_API_URL || 'http://ollama:11434';
  const base = raw.replace(/\/api\/?.*$/, ''); // strip any /api/ path
  const apiUrl = `${base}/api/tags`;
  try {
    const res = await safeFetch(apiUrl, {}, 3000);
    if (!res.ok) {
      console.warn(`[ModelChecker] Ollama connectivity failed: HTTP ${res.status}`);
    }
    return res.ok;
  } catch (err) {
    console.warn(`[ModelChecker] Ollama connectivity failed: ${err?.message || err}`);
    return false;
  }
}

export async function checkAvailableModels() {
  const models = [];
  const checks = [];

  if (process.env.VERTEX_API_KEY && process.env.VERTEX_PROJECT_ID) {
    const geminiPro = {
      id: 'gemini-pro',
      name: 'Gemini Pro (Vertex AI)',
      provider: 'vertex',
      model: process.env.VERTEX_GEMINI_PRO_MODEL || 'gemini-pro',
      enabled: true,
      description: 'Google Gemini Pro via Vertex AI',
      configured: true,
      reachable: false
    };
    const gemini15Pro = {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro (Vertex AI)',
      provider: 'vertex',
      model: process.env.VERTEX_GEMINI_1_5_PRO_MODEL || 'gemini-1.5-pro',
      enabled: true,
      description: 'Google Gemini 1.5 Pro via Vertex AI',
      configured: true,
      reachable: false
    };
    models.push(geminiPro, gemini15Pro);
    checks.push(
      checkVertexConnectivity(geminiPro.model).then(ok => {
        geminiPro.reachable = ok; geminiPro.enabled = ok;
        if (!ok) console.warn(`[ModelChecker] Gemini Pro (${geminiPro.model}) disabled (unreachable)`);
      }),
      checkVertexConnectivity(gemini15Pro.model).then(ok => {
        gemini15Pro.reachable = ok; gemini15Pro.enabled = ok;
        if (!ok) console.warn(`[ModelChecker] Gemini 1.5 Pro (${gemini15Pro.model}) disabled (unreachable)`);
      })
    );
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const opus = {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus (Anthropic)',
      provider: 'anthropic',
      model: process.env.ANTHROPIC_CLAUDE_3_OPUS_MODEL || 'claude-3-opus-20240229',
      enabled: true,
      description: 'Anthropic Claude 3 Opus model',
      configured: true,
      reachable: false
    };
    const sonnet = {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet (Anthropic)',
      provider: 'anthropic',
      model: process.env.ANTHROPIC_CLAUDE_3_SONNET_MODEL || 'claude-3-sonnet-20240229',
      enabled: true,
      description: 'Anthropic Claude 3 Sonnet model',
      configured: true,
      reachable: false
    };
    const haiku = {
      id: 'claude-3-haiku',
      name: 'Claude 3 Haiku (Anthropic)',
      provider: 'anthropic',
      model: process.env.ANTHROPIC_CLAUDE_3_HAIKU_MODEL || 'claude-3-haiku-20240307',
      enabled: true,
      description: 'Anthropic Claude 3 Haiku model (fastest)',
      configured: true,
      reachable: false
    };
    models.push(opus, sonnet, haiku);
    checks.push(
      checkAnthropicConnectivity().then(ok => {
        opus.reachable = sonnet.reachable = haiku.reachable = ok;
        opus.enabled = sonnet.enabled = haiku.enabled = ok;
        if (!ok) console.warn('[ModelChecker] Anthropic models disabled (unreachable)');
      })
    );
  }

  if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';
    const azure = {
      id: 'azure-gpt4',
      name: `GPT-4 (Azure)`,
      provider: 'azure',
      model: deployment,
      enabled: true,
      description: 'Azure OpenAI GPT-4',
      configured: true,
      reachable: false
    };
    models.push(azure);
    checks.push(
      checkAzureConnectivity().then(ok => {
        azure.reachable = ok; azure.enabled = ok;
        if (!ok) console.warn('[ModelChecker] Azure OpenAI disabled (unreachable)');
      })
    );
  }

  if (process.env.OLLAMA_API_URL || true) {
    const llama = {
      id: 'ollama-llama3',
      name: 'Llama 3.1 (Ollama)',
      provider: 'ollama',
      model: 'llama3.1:8b',
      enabled: true,
      description: 'Llama 3.1 via Ollama (requires Ollama running)',
      configured: true,
      reachable: false
    };
    const mistral = {
      id: 'ollama-mistral',
      name: 'Mistral (Ollama)',
      provider: 'ollama',
      model: process.env.OLLAMA_MODEL || 'mistral', // ⬅️ use env or fallback
      enabled: true,
      description: 'Mistral via Ollama (requires Ollama running)',
      configured: true,
      reachable: false
    };
    models.push(llama, mistral);
    checks.push(
      checkOllamaConnectivity().then(ok => {
        llama.reachable = mistral.reachable = ok;
        llama.enabled = mistral.enabled = ok;
        if (!ok) console.warn('[ModelChecker] Ollama disabled (unreachable)');
      })
    );
  }

  const mock = {
    id: 'mock-llm',
    name: 'Mock LLM (Demo)',
    provider: 'custom',
    model: 'mock',
    enabled: true,
    description: 'Mock LLM for testing without API keys',
    configured: true,
    reachable: true
  };
  models.push(mock);

  await Promise.all(checks);

  return models.filter(m => m.enabled);
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
