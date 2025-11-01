# Security Architecture

## Critical Security Rule: VITE_* Variables

### ⚠️ WARNING: VITE_* Variables Are PUBLIC

**All environment variables prefixed with `VITE_` are embedded directly into the JavaScript bundle at build time.**

This means:
- They are **VISIBLE** in the browser DevTools
- They are **READABLE** by anyone who views the page source
- They are **STORED** permanently in the compiled `dist/assets/*.js` files

### ❌ NEVER Put Secrets in VITE_* Variables

**DO NOT:**
```env
# ❌ BAD - These are exposed in the browser!
VITE_ANTHROPIC_API_KEY=sk-ant-secret
VITE_VERTEX_API_KEY=ya29.secret-token
VITE_AIRS_API_TOKEN=secret-airs-token
VITE_AZURE_OPENAI_API_KEY=secret-key
```

### ✅ Safe VITE_* Variables

Only use `VITE_*` for **PUBLIC** information:

```env
# ✅ GOOD - Public information only
VITE_BACKEND_URL=http://localhost:3001
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...  # Designed to be public
```

## Secure Architecture: Backend Server

### How Secrets Are Protected

```
Browser (Public)              Backend Server (Private)
─────────────────            ────────────────────────
Frontend Code                server/.env
├─ VITE_BACKEND_URL ✅       ├─ VERTEX_API_KEY 🔒
├─ VITE_SUPABASE_URL ✅      ├─ ANTHROPIC_API_KEY 🔒
└─ (No API keys!)            ├─ AZURE_OPENAI_API_KEY 🔒
                             └─ AIRS_API_TOKEN 🔒
```

### Request Flow

```
1. User types message in browser
2. Frontend sends to backend: POST /api/llm/chat
3. Backend uses API key from server/.env (never exposed)
4. Backend calls LLM API
5. Backend returns response to frontend
```

## File Security Checklist

### Frontend Files (Public)

**`.env` (Frontend)**
```env
# Only public URLs and backend endpoint
VITE_BACKEND_URL=http://localhost:3001
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Backend Files (Private)

**`server/.env` (Backend)**
```env
# All API keys and secrets here
BACKEND_PORT=3001
VERTEX_API_KEY=ya29.real-secret-key
ANTHROPIC_API_KEY=sk-ant-real-key
AZURE_OPENAI_API_KEY=real-azure-key
AIRS_API_TOKEN=real-airs-token
```

## Verification: Check Your Bundle

### Test if secrets are exposed:

1. **Build your app:**
   ```bash
   npm run build
   ```

2. **Search for secrets in bundle:**
   ```bash
   # Search for API keys in the built files
   grep -r "sk-ant" dist/
   grep -r "ya29" dist/
   grep -r "your-api-key" dist/
   ```

3. **Expected result:** No matches! All secrets should be in `server/.env` only.

### Browser DevTools Check

1. Open your app in browser
2. Open DevTools → Console
3. Type: `import.meta.env`
4. **Expected:** Only see `VITE_BACKEND_URL` and public Supabase values

## Production Deployment Security

### Frontend (Vercel, Netlify, Cloudflare)

**Environment Variables:**
```env
VITE_BACKEND_URL=https://your-api-backend.com
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Backend (Railway, Render, Heroku)

**Environment Variables:**
```env
VERTEX_API_KEY=production-key
ANTHROPIC_API_KEY=production-key
AZURE_OPENAI_API_KEY=production-key
AIRS_API_TOKEN=production-token
FRONTEND_URL=https://your-frontend.com
```

### Additional Security Measures

1. **CORS Configuration**
   - Backend only accepts requests from your frontend domain
   - Configured in `server/index.js`: `origin: process.env.FRONTEND_URL`

2. **Rate Limiting** (Recommended)
   ```javascript
   // server/index.js
   import rateLimit from 'express-rate-limit';

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });

   app.use('/api/', limiter);
   ```

3. **Request Validation**
   - All prompts limited to 10MB
   - Input sanitization
   - Error handling without exposing internals

4. **Audit Logging**
   - All API calls logged server-side
   - Security events tracked
   - AIRS verdicts recorded

## Azure Best Practices

### Using Azure Key Vault

Instead of environment variables, use Azure Key Vault:

```javascript
// server/azure-config.js
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

const credential = new DefaultAzureCredential();
const client = new SecretClient(
  process.env.KEY_VAULT_URL,
  credential
);

async function getSecret(name) {
  const secret = await client.getSecret(name);
  return secret.value;
}

// Use in server/index.js
const apiKey = await getSecret('ANTHROPIC-API-KEY');
```

### Using Managed Identity for Azure OpenAI

```javascript
import { DefaultAzureCredential } from '@azure/identity';

const credential = new DefaultAzureCredential();
const token = await credential.getToken('https://cognitiveservices.azure.com/.default');

// No API key needed!
const response = await fetch(endpoint, {
  headers: {
    'Authorization': `Bearer ${token.token}`
  }
});
```

## Common Mistakes to Avoid

### ❌ Mistake 1: Using VITE_ for secrets
```env
VITE_API_KEY=secret  # ❌ Exposed in bundle!
```

### ❌ Mistake 2: Committing .env to Git
```bash
# ❌ Never commit secrets
git add .env server/.env
```

**Fix:** Add to `.gitignore`:
```
.env
.env.local
server/.env
server/.env.local
```

### ❌ Mistake 3: Calling APIs directly from frontend
```javascript
// ❌ Exposes API key in browser
fetch('https://api.anthropic.com/v1/messages', {
  headers: {
    'x-api-key': apiKey  // Visible in DevTools!
  }
});
```

**Fix:** Use backend proxy (already implemented)

## Security Audit Checklist

Before deploying to production:

- [ ] No `VITE_*` variables contain API keys or secrets
- [ ] All secrets are in `server/.env` (not frontend `.env`)
- [ ] `.env` files are in `.gitignore`
- [ ] CORS is configured to allow only your frontend domain
- [ ] Rate limiting is enabled
- [ ] Audit logging is enabled
- [ ] Secrets are in Azure Key Vault (recommended)
- [ ] Managed Identity is used for Azure services (recommended)
- [ ] Build artifacts checked for leaked secrets (`grep -r "sk-ant" dist/`)

## Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Azure Key Vault](https://learn.microsoft.com/azure/key-vault/)
- [Azure Managed Identity](https://learn.microsoft.com/azure/active-directory/managed-identities-azure-resources/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
