import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

const PORT = process.env.BACKEND_PORT || 3001;

const systemPrompt = fs.readFileSync(path.join(__dirname, '..', 'SYSTEM_PROMPT.txt'), 'utf-8');

async function callVertexAI(prompt, model = 'gemini-pro') {
  const projectId = process.env.VERTEX_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION || 'us-central1';
  const apiKey = process.env.VERTEX_API_KEY;

  if (!projectId || !apiKey) {
    throw new Error('Vertex AI credentials not configured');
  }

  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nUser: ${prompt}` }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Vertex AI error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
}

async function callAnthropic(prompt, model = 'claude-3-sonnet-20240229') {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || 'No response generated';
}

async function callAzureOpenAI(prompt) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';

  if (!endpoint || !apiKey) {
    throw new Error('Azure OpenAI credentials not configured');
  }

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    throw new Error(`Azure OpenAI error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response generated';
}

async function callOllama(prompt, model = 'llama2') {
  const apiUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/chat';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.message?.content || 'No response generated';
}

async function scanWithAIRS(prompt) {
  const apiUrl = process.env.AIRS_API_URL;
  const apiToken = process.env.AIRS_API_TOKEN;
  const profileName = process.env.AIRS_PROFILE_NAME;

  if (!apiUrl || !apiToken || !profileName) {
    return mockAIRSScan(prompt);
  }

  const transactionId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const response = await fetch(`${apiUrl}/v1/scan/sync/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-pan-token': apiToken
      },
      body: JSON.stringify({
        tr_id: transactionId,
        ai_profile: { profile_name: profileName },
        metadata: {
          app_user: 'shop-assist-backend',
          app_name: 'Shop Assist Chatbot',
          ai_model: 'Multi-Provider LLM'
        },
        contents: [{ prompt }]
      })
    });

    if (!response.ok) {
      console.error('AIRS API error:', response.status);
      return mockAIRSScan(prompt);
    }

    const data = await response.json();

    return {
      verdict: data.action === 'block' ? 'block' : 'allow',
      reason: data.category || 'Unknown',
      scanId: data.scan_id,
      reportId: data.report_id,
      details: data.prompt_detected
    };
  } catch (error) {
    console.error('AIRS scan failed:', error);
    return mockAIRSScan(prompt);
  }
}

function mockAIRSScan(prompt) {
  const lowerPrompt = prompt.toLowerCase();

  const systemOverride = /(ignore|forget|bypass|override).*(system prompt|previous instructions|rules|directives)/i;
  const secretExtraction = /(api key|secret|password|credential|database|token)/i;
  const roleManipulation = /(you are now|act as|pretend to be).*(hacker|malware|virus|criminal)/i;

  if (systemOverride.test(lowerPrompt)) {
    return {
      verdict: 'block',
      reason: 'System prompt override attempt detected',
      scanId: 'mock-' + Date.now(),
      reportId: null,
      details: { injection: true }
    };
  }

  if (secretExtraction.test(lowerPrompt)) {
    return {
      verdict: 'block',
      reason: 'Sensitive data extraction attempt detected',
      scanId: 'mock-' + Date.now(),
      reportId: null,
      details: { dlp: true }
    };
  }

  if (roleManipulation.test(lowerPrompt)) {
    return {
      verdict: 'block',
      reason: 'Malicious role manipulation detected',
      scanId: 'mock-' + Date.now(),
      reportId: null,
      details: { injection: true }
    };
  }

  return {
    verdict: 'allow',
    reason: 'No threats detected',
    scanId: 'mock-' + Date.now(),
    reportId: null,
    details: { injection: false, dlp: false, toxic_content: false }
  };
}

app.post('/api/airs/scan', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await scanWithAIRS(prompt);
    res.json(result);
  } catch (error) {
    console.error('AIRS scan error:', error);
    res.status(500).json({
      error: 'AIRS scan failed',
      verdict: 'allow',
      reason: 'Scan unavailable, allowing by default'
    });
  }
});

app.post('/api/llm/chat', async (req, res) => {
  try {
    const { prompt, provider, model } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let response;

    switch (provider) {
      case 'vertex':
        response = await callVertexAI(prompt, model);
        break;
      case 'anthropic':
        response = await callAnthropic(prompt, model);
        break;
      case 'openai':
      case 'azure':
        response = await callAzureOpenAI(prompt);
        break;
      case 'ollama':
        response = await callOllama(prompt, model);
        break;
      default:
        return res.status(400).json({ error: 'Invalid provider' });
    }

    res.json({ response });
  } catch (error) {
    console.error('LLM error:', error);
    res.status(500).json({
      error: 'LLM request failed',
      message: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📝 System prompt loaded (${systemPrompt.length} chars)`);
  console.log(`🔐 AIRS configured: ${!!(process.env.AIRS_API_TOKEN)}`);
  console.log(`🤖 Vertex AI configured: ${!!(process.env.VERTEX_API_KEY)}`);
  console.log(`🤖 Anthropic configured: ${!!(process.env.ANTHROPIC_API_KEY)}`);
  console.log(`🤖 Azure OpenAI configured: ${!!(process.env.AZURE_OPENAI_API_KEY)}`);
  console.log(`🤖 Ollama configured: ${!!(process.env.OLLAMA_API_URL)}`);
});
