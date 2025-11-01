# Environment Configuration Guide

This application uses **separate environment files** for each service to improve security and maintainability.

## 📁 Environment Files Structure

```
project/
├── .env.database          # PostgreSQL configuration
├── .env.backend           # Backend API configuration
├── .env.frontend          # Frontend build configuration
├── .env.database.example  # Template for database config
├── .env.backend.example   # Template for backend config
└── .env.frontend.example  # Template for frontend config
```

**Important:** Never commit `.env.*` files (except `.example` files) to git!

---

## 🚀 Quick Setup

### Step 1: Copy Example Files

```bash
# Copy all example files at once
cp .env.database.example .env.database
cp .env.backend.example .env.backend
cp .env.frontend.example .env.frontend
```

### Step 2: Configure Each File

Edit each file with your specific values:

```bash
nano .env.database   # Database credentials
nano .env.backend    # API keys and secrets
nano .env.frontend   # Frontend build settings
```

### Step 3: Start Services

```bash
docker compose up -d
```

---

## 📋 File Descriptions

### .env.database

**Purpose:** PostgreSQL database configuration

**Required Variables:**
- `POSTGRES_DB` - Database name (default: `shop_assist`)
- `POSTGRES_USER` - Database user (default: `admin`)
- `POSTGRES_PASSWORD` - **IMPORTANT:** Use a strong password!

**Example:**
```env
POSTGRES_DB=shop_assist
POSTGRES_USER=admin
POSTGRES_PASSWORD=MySecureDBPassword123!
```

**Security Notes:**
- Use a password with 16+ characters
- Include uppercase, lowercase, numbers, and symbols
- Generate strong password: `openssl rand -base64 24`

---

### .env.backend

**Purpose:** Backend Node.js API configuration

**Required Variables:**

#### Server Settings
```env
BACKEND_PORT=3001
FRONTEND_URL=http://localhost:80
```

#### Database Connection
```env
DATABASE_URL=postgresql://admin:MySecureDBPassword123!@postgres:5432/shop_assist
```
**Important:** Must match password from `.env.database`

#### JWT Secret
```env
JWT_SECRET=your_jwt_secret_key_here
```
Generate with: `openssl rand -base64 32`

#### LLM Providers (at least one required)

**Google Vertex AI:**
```env
VERTEX_PROJECT_ID=your-gcp-project-id
VERTEX_LOCATION=us-central1
VERTEX_API_KEY=ya29.xxxxx
```

**Anthropic Claude:**
```env
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

**Azure OpenAI:**
```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=xxxxx
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

**Ollama (local):**
```env
OLLAMA_API_URL=http://ollama:11434/api/chat
```

#### AIRS Security (optional)
```env
AIRS_API_URL=https://service.api.aisecurity.paloaltonetworks.com
AIRS_API_TOKEN=your-token
AIRS_PROFILE_NAME=your-profile
```

#### Rate Limiting (optional)
```env
RATE_LIMIT_MAX_RETRIES=3
RATE_LIMIT_INITIAL_DELAY=1000
RATE_LIMIT_MAX_DELAY=60000
RATE_LIMIT_BACKOFF_MULTIPLIER=2
```

---

### .env.frontend

**Purpose:** Frontend React build configuration

**Required Variables:**
```env
VITE_BACKEND_URL=http://localhost:3001
```

**Production Example:**
```env
VITE_BACKEND_URL=https://api.yourdomain.com
```

**Important Notes:**
- This URL is embedded in the frontend build
- For production, use your actual backend URL
- Must be accessible from users' browsers

---

## 🔒 Security Best Practices

### 1. Password Generation

```bash
# Strong database password
openssl rand -base64 24

# JWT secret
openssl rand -base64 32
```

### 2. File Permissions

```bash
# Set restrictive permissions
chmod 600 .env.database
chmod 600 .env.backend
chmod 600 .env.frontend
```

### 3. Never Commit Secrets

The `.gitignore` file already excludes:
```
.env
.env.database
.env.backend
.env.frontend
```

### 4. Separate Environments

For production, use different values:
```bash
# Development
.env.database
.env.backend
.env.frontend

# Production
.env.database.prod
.env.backend.prod
.env.frontend.prod
```

---

## 🐳 Docker Compose Integration

The `docker-compose.yml` file uses the `env_file` directive:

```yaml
services:
  postgres:
    env_file:
      - .env.database

  backend:
    env_file:
      - .env.backend

  frontend:
    # Reads .env.frontend during build
```

**Advantages:**
- ✅ No hardcoded values in docker-compose.yml
- ✅ Easy to manage secrets
- ✅ Different configs for dev/staging/prod
- ✅ Works with Docker secrets in Swarm mode

---

## 🧪 Verification

### Check Files Exist

```bash
ls -la .env.*

# Expected output:
# .env.database
# .env.database.example
# .env.backend
# .env.backend.example
# .env.frontend
# .env.frontend.example
```

### Validate Configuration

```bash
# Check database config
grep POSTGRES_PASSWORD .env.database

# Check backend config
grep JWT_SECRET .env.backend
grep ANTHROPIC_API_KEY .env.backend

# Check frontend config
grep VITE_BACKEND_URL .env.frontend
```

### Test Connection

```bash
# Start services
docker compose up -d

# Check backend reads config
docker compose logs backend | grep "Database connection"

# Check available models (verifies API keys)
curl http://localhost:3001/api/models/available
```

---

## 🔄 Migration from Single .env File

If you have an existing `.env` file:

### Automated Migration Script

```bash
#!/bin/bash

# Create .env.database
cat > .env.database << EOF
POSTGRES_DB=shop_assist
POSTGRES_USER=admin
POSTGRES_PASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2)
EOF

# Create .env.backend
grep -E "JWT_SECRET|ANTHROPIC|VERTEX|AZURE|AIRS|OLLAMA|RATE_LIMIT" .env > .env.backend
echo "BACKEND_PORT=3001" >> .env.backend
echo "FRONTEND_URL=http://localhost:80" >> .env.backend
echo "DATABASE_URL=postgresql://admin:$(grep DB_PASSWORD .env | cut -d '=' -f2)@postgres:5432/shop_assist" >> .env.backend

# Create .env.frontend
grep VITE_BACKEND_URL .env > .env.frontend || echo "VITE_BACKEND_URL=http://localhost:3001" > .env.frontend

echo "Migration complete! Review the new files before starting."
```

### Manual Migration

1. **Extract database password:**
   ```bash
   # From old .env
   DB_PASSWORD=xxxxx

   # To new .env.database
   POSTGRES_PASSWORD=xxxxx
   ```

2. **Move backend variables:**
   ```bash
   # Move all API keys and secrets to .env.backend
   JWT_SECRET=...
   ANTHROPIC_API_KEY=...
   # etc.
   ```

3. **Move frontend variables:**
   ```bash
   # Move to .env.frontend
   VITE_BACKEND_URL=...
   ```

4. **Update DATABASE_URL:**
   ```bash
   # In .env.backend
   DATABASE_URL=postgresql://admin:YOUR_PASSWORD@postgres:5432/shop_assist
   ```

---

## 🌍 Production Deployment

### Google Cloud / Azure / AWS

1. **Upload environment files to VM:**
   ```bash
   # Using scp
   scp .env.database your-vm:~/app/.env.database
   scp .env.backend your-vm:~/app/.env.backend
   scp .env.frontend your-vm:~/app/.env.frontend
   ```

2. **Or create directly on VM:**
   ```bash
   ssh your-vm
   cd ~/app
   nano .env.database
   nano .env.backend
   nano .env.frontend
   ```

3. **Set permissions:**
   ```bash
   chmod 600 .env.*
   ```

4. **Deploy:**
   ```bash
   docker compose up -d
   ```

### Using Secrets Management

For enhanced security, use cloud secret managers:

**Google Cloud Secret Manager:**
```bash
# Store secrets
gcloud secrets create db-password --data-file=<(echo "password")

# Mount in docker-compose
volumes:
  - /run/secrets/db-password:/run/secrets/db-password
```

**AWS Secrets Manager:**
```bash
aws secretsmanager create-secret --name db-password --secret-string "password"
```

**Azure Key Vault:**
```bash
az keyvault secret set --vault-name myKeyVault --name db-password --value "password"
```

---

## 🐛 Troubleshooting

### Issue: Backend can't connect to database

**Check:**
1. Password matches in both files:
   ```bash
   grep POSTGRES_PASSWORD .env.database
   grep DATABASE_URL .env.backend
   ```

2. Database is healthy:
   ```bash
   docker compose ps postgres
   ```

### Issue: Frontend can't reach backend

**Check:**
1. VITE_BACKEND_URL is correct:
   ```bash
   cat .env.frontend
   ```

2. Rebuild frontend after changing URL:
   ```bash
   docker compose build frontend --no-cache
   docker compose up -d frontend
   ```

### Issue: Environment variables not loaded

**Solutions:**
```bash
# Restart services
docker compose restart

# Or rebuild
docker compose up -d --build

# Check env vars in container
docker compose exec backend env | grep ANTHROPIC
```

### Issue: File not found

**Ensure files exist:**
```bash
# All three files must exist
ls -la .env.database .env.backend .env.frontend

# If missing, copy from examples
cp .env.database.example .env.database
```

---

## 📚 Additional Resources

- [Docker Compose env_file documentation](https://docs.docker.com/compose/environment-variables/set-environment-variables/#use-the-env_file-attribute)
- [Environment Variables Best Practices](https://12factor.net/config)
- [Secrets Management Guide](https://docs.docker.com/compose/use-secrets/)

---

## ✅ Checklist

Before deploying, verify:

- [ ] All three `.env.*` files created
- [ ] Strong passwords generated
- [ ] Database password matches in both files
- [ ] At least one LLM provider configured
- [ ] JWT_SECRET is 32+ characters
- [ ] File permissions set to 600
- [ ] Files not committed to git
- [ ] Backend can connect to database
- [ ] Frontend can reach backend
- [ ] All containers start successfully

---

**Security Reminder:** Treat environment files like passwords. Never share them publicly!
