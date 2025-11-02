import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import { registerUser, loginUser, authMiddleware } from './auth.js';
import { callWithRetry, getRateLimitConfig, getAllRateLimits, clearRateLimits } from './rateLimiter.js';
import { checkAvailableModels, getModelCapabilities, isProviderConfigured } from './modelChecker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

const ALLOWED = [process.env.FRONTEND_URL, 'http://localhost', 'http://localhost:80', 'http://127.0.0.1', 'http://localhost:5173'].filter(Boolean);
app.use(cors({origin: (o,cb)=>!o||ALLOWED.some(a=>o.startsWith(a))?cb(null,true):cb(new Error('CORS'),false), credentials:true }));

/*
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
})); 
*/

app.use(express.json({ limit: '10mb' }));

const PORT = process.env.BACKEND_PORT || 3001;

//const systemPrompt = fs.readFileSync(path.join(__dirname, '..', 'SYSTEM_PROMPT.txt'), 'utf-8');
const systemPromptPath = path.resolve(__dirname, 'SYSTEM_PROMPT.txt');
const systemPrompt = fs.readFileSync(systemPromptPath, 'utf-8');

async function callVertexAI(prompt, model = 'gemini-pro') {
  const projectId = process.env.VERTEX_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION || 'us-central1';
  const apiKey = process.env.VERTEX_API_KEY;

  if (!projectId || !apiKey) {
    throw new Error('Vertex AI credentials not configured');
  }

  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

  return callWithRetry(async () => {
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
      const errorText = await response.text();
      const error = new Error(`Vertex AI error: ${response.status} ${errorText}`);
      error.status = response.status;
      error.retryAfter = response.headers.get('retry-after');
      throw error;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
  }, 'vertex');
}

async function callAnthropic(prompt, model = 'claude-3-sonnet-20240229') {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  return callWithRetry(async () => {
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
      const errorText = await response.text();
      const error = new Error(`Anthropic error: ${response.status} ${errorText}`);
      error.status = response.status;
      error.retryAfter = response.headers.get('retry-after');
      throw error;
    }

    const data = await response.json();
    return data.content?.[0]?.text || 'No response generated';
  }, 'anthropic');
}

async function callAzureOpenAI(prompt) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';

  if (!endpoint || !apiKey) {
    throw new Error('Azure OpenAI credentials not configured');
  }

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`;

  return callWithRetry(async () => {
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
      const errorText = await response.text();
      const error = new Error(`Azure OpenAI error: ${response.status} ${errorText}`);
      error.status = response.status;
      error.retryAfter = response.headers.get('retry-after');
      throw error;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated';
  }, 'azure');
}

async function callOllama(prompt, model = process.env.OLLAMA_MODEL || 'mistral') {
  const apiUrl = process.env.OLLAMA_API_URL || 'http://ollama:11434/api/chat';

  return callWithRetry(async () => {
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
      const errorText = await response.text();
      const error = new Error(`Ollama error: ${response.status} ${errorText}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data.message?.content || 'No response generated';
  }, 'ollama');
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
    const { prompt, provider, model, scanResponse = false } = req.body;

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
        return res.status(400).json({ error: 'OpenAI provider not implemented, use azure/ollama/anthropic/vertex' });
      case 'azure':
        response = await callAzureOpenAI(prompt);
        break;
      case 'ollama':
        response = await callOllama(prompt, model);
        break;
      default:
        return res.status(400).json({ error: 'Invalid provider' });
    }

    if (scanResponse && response) {
      console.log('Scanning LLM response with AIRS...');
      const scanResult = await scanWithAIRS(response);

      if (scanResult.verdict === 'block') {
        console.warn('⚠️ LLM response blocked by AIRS:', scanResult.reason);
        return res.json({
          response: '[Response blocked by AIRS security]',
          blocked: true,
          scanResult
        });
      }

      if (scanResult.verdict === 'sanitize' && scanResult.sanitized_prompt) {
        console.log('🔧 LLM response sanitized by AIRS');
        return res.json({
          response: scanResult.sanitized_prompt,
          sanitized: true,
          scanResult
        });
      }

      return res.json({
        response,
        scanResult
      });
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

app.get('/api/models/available', (req, res) => {
  try {
    const models = checkAvailableModels();
    const capabilities = getModelCapabilities();
    const rateLimitConfig = getRateLimitConfig();
    const currentRateLimits = getAllRateLimits();

    res.json({
      models,
      capabilities,
      rateLimitConfig,
      currentRateLimits
    });
  } catch (error) {
    console.error('Models check error:', error);
    res.status(500).json({ error: 'Failed to check available models' });
  }
});

app.post('/api/rate-limits/clear', (req, res) => {
  try {
    clearRateLimits();
    res.json({ message: 'All rate limits cleared successfully' });
  } catch (error) {
    console.error('Clear rate limits error:', error);
    res.status(500).json({ error: 'Failed to clear rate limits' });
  }
});

app.get('/api/rate-limits', (req, res) => {
  try {
    const rateLimits = getAllRateLimits();
    const config = getRateLimitConfig();
    res.json({ rateLimits, config });
  } catch (error) {
    console.error('Get rate limits error:', error);
    res.status(500).json({ error: 'Failed to get rate limits' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await registerUser(email, password);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await loginUser(email, password);
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, price, image_url, stock, category FROM products ORDER BY id'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, name, description, price, image_url, stock, category FROM products WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.get('/api/cart', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.quantity, c.added_at,
              p.id as product_id, p.name, p.description, p.price, p.image_url, p.stock
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1
       ORDER BY c.added_at DESC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

app.post('/api/cart/add', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const result = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + $3
       RETURNING id`,
      [req.user.userId, productId, quantity]
    );

    res.json({ message: 'Product added to cart', cartItemId: result.rows[0].id });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

app.put('/api/cart/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING id',
      [quantity, id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Cart updated successfully' });
  } catch (error) {
    console.error('Cart update error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

app.delete('/api/cart/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Cart delete error:', error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

app.delete('/api/cart', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.userId]);
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Cart clear error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📝 System prompt loaded (${systemPrompt.length} chars)`);
  console.log(`🔐 AIRS configured: ${!!(process.env.AIRS_API_TOKEN)}`);
  console.log(`🤖 Vertex AI configured: ${!!(process.env.VERTEX_API_KEY)}`);
  console.log(`🤖 Anthropic configured: ${!!(process.env.ANTHROPIC_API_KEY)}`);
  console.log(`🤖 Azure OpenAI configured: ${!!(process.env.AZURE_OPENAI_API_KEY)}`);
  console.log(`🤖 Ollama configured: ${!!(process.env.OLLAMA_API_URL)}`);

  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
});
