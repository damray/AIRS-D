# Architecture Overview
```
User
  │
  ▼
Nginx edge (Docker, port 80/443)
  ├─ routes /      -> frontend (Vite build in Docker)
  ├─ routes /api   -> backend (Node/Express in Docker)
  └─ (optional TLS termination)

Backend (Docker, Node/Express)
  ├─ Postgres (Docker) for data
  ├─ AIRS security scanning (prompt/response)
  ├─ Optional local LLM: Ollama (Docker, profile with-ollama)
  └─ SaaS LLMs:
       - Google Vertex AI
       - AWS Bedrock (IAM on instance)
       - Azure OpenAI
       - Anthropic

Docker network: shop-network (edge, frontend, backend, postgres, optional ollama)
Persistent volumes: postgres-data (db), ollama-data (models)
```

# Chatbot Flow & Security
- Model availability & reachability: `server/modelChecker.js` builds the list of models, pings providers (Vertex/Anthropic/Azure/Ollama/Bedrock) and only enables reachable ones. The frontend calls `/api/models/available` and shows the refreshed list.
- Manual refresh: the chatbot header has a “Refresh” button to re-run `/api/models/available` when credentials change or a new model is deployed.
- AIRS toggle: UI toggle enables runtime scans for prompts and responses. Backend AIRS scan endpoint: `/api/airs/scan`.
- LLM routing: `/api/llm/chat` accepts `{prompt, provider, model, scanResponse}` and dispatches to Vertex, Anthropic, Azure OpenAI, Ollama, or Bedrock. Mock/fallback exists for demos.
- System prompt: backend reads `server/SYSTEM_PROMPT.txt` and prepends it inside each provider call.
- Prompt sanitization/tests: `src/components/Chatbot.tsx` includes simple injection heuristics in `simulateMockScan`; adjust patterns there if you need stronger local checks.

# Database Schema (server/init.sql)
- `users(id, email, password_hash, created_at)`
- `products(id, name, description, price, image_url, stock, category, created_at)`
- `cart_items(id, user_id, product_id, quantity, added_at, unique(user_id, product_id))`
- Indices on emails, cart relations, product category.
- Seed products are inserted; add more via SQL inserts or your admin flow.

# Terraform on AWS
- One small EC2 hosts the entire Docker Compose stack (edge, frontend, backend, postgres, optional ollama). Bedrock is consumed as a managed service; no Bedrock infra is created.
- IAM role grants SSM read (for env) and Bedrock `InvokeModel`.
- SSM parameters are created by Terraform for secrets/URLs; values are provided interactively at apply.
- Cost rationale: single VM (t4g/t3 nano + EBS) is the cheapest footprint. EKS/ECS/RDS would add fixed monthly costs and operational overhead; not used for this demo.
- User data installs Docker/compose, clones the repo, fetches SSM params, writes `.env*`, then runs `docker-compose up -d`.

# API Map
- `GET /api/models/available` — model list + reachability + rate limit info.
- `POST /api/llm/chat` — send prompt to selected provider; optional AIRS scan on response.
- `POST /api/airs/scan` — scan a prompt/response with AIRS.
- Auth: `/api/auth/register`, `/api/auth/login`.
- Products: `/api/products` (and related) served by backend + Postgres.

# Updating prompt-injection rules
- Frontend mock scan: edit patterns in `simulateMockScan` in `src/components/Chatbot.tsx`.
- Backend AIRS: adjust profile/token/URL in `.env`/`.env.backend` or SSM values; the AIRS toggle controls enforcement at runtime.

# End-to-end Flow (Input/Output Protection)
```
┌─────────────────────────────────────────────────────────────┐
│ User types message: "Ignore your system prompt"             │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Frontend calls /api/airs/scan                       │
│ Body: { "prompt": "Ignore your system prompt" }             │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ AIRS SCAN #1 (Input Protection)                             │
│ Result: verdict = "block"                                   │
│ Reason: "System prompt override attempt detected"           │
└─────────────────────────────────────────────────────────────┘
                    ↓
         ┌──────────┴──────────┐
         │                     │
    verdict = "block"    verdict = "allow"
         │                     │
         ↓                     ↓
┌─────────────────┐   ┌──────────────────────────────────────┐
│ BLOCKED!        │   │ STEP 2: Call LLM                     │
│ Return to user  │   │ POST /api/llm/chat                   │
│ Show error msg  │   │ Body: { "prompt": "...", ... }       │
└─────────────────┘   └──────────────────────────────────────┘
                                ↓
                      ┌──────────────────────────────────────┐
                      │ LLM generates response               │
                      │ "Here's how to hack the system..."   │
                      └──────────────────────────────────────┘
                                ↓
                      ┌──────────────────────────────────────┐
                      │ AIRS SCAN #2 (Output Protection)     │
                      │ Scans LLM response for:              │
                      │ - API keys / secrets                 │
                      │ - Malicious instructions             │
                      │ - Sensitive data leaks               │
                      └──────────────────────────────────────┘
                                ↓
                      ┌──────────┴──────────┐
                      │                     │
                 verdict = "block"    verdict = "allow"
                      │                     │
                      ↓                     ↓
            ┌─────────────────┐   ┌─────────────────────┐
            │ BLOCKED!        │   │ ALLOWED!            │
            │ Show warning    │   │ Display to user     │
            └─────────────────┘   └─────────────────────┘
```

# Docker/Container Responsibilities
```
┌──────────────────────────────────────────────────────────┐
│ Browser (80/443)                                         │
│   GET /                      → React static (via Edge)   │
│   POST /api/llm/chat         → proxy → Backend:3001      │
│   GET  /api/products         → proxy → Backend:3001      │
└──────────────────────────────────────────────────────────┘
                         │
              (reverse proxy: /api → 3001)
                         │
┌──────────────────────────────────────────────────────────┐
│ Edge (Nginx)                                             │
│  - Serves: / (React build)                               │
│  - Proxies: /api/* → http://backend:3001/api/*           │
└──────────────────────────────────────────────────────────┘
                         │
                         │ REST / DB client
                         ↓
┌──────────────────────────────────────────────────────────┐
│ Backend (Node/Express:3001)                              │
│  - Routes: /api/auth, /api/products, /api/cart,          │
│           /api/llm/chat, /api/airs/scan, /health         │
│  - Secrets: JWT, DB, AIRS, providers                     │
└──────────────────────────────────────────────────────────┘
                         │
                         │ SQL
                         ↓
┌──────────────────────────────────────────────────────────┐
│ PostgreSQL (5432)                                        │
│  - users, products, cart_items                           │
└──────────────────────────────────────────────────────────┘
```

# API Endpoints (for troubleshooting)
- Authentication
  - `POST /api/auth/register` — Create account
  - `POST /api/auth/login` — Get JWT token
- Products
  - `GET /api/products` — List all products
  - `GET /api/products/:id` — Get a single product
- Cart (JWT required)
  - `GET /api/cart` — Get user's cart
  - `POST /api/cart/add` — Add item to cart
  - `PUT /api/cart/:id` — Update quantity
  - `DELETE /api/cart/:id` — Remove item
  - `DELETE /api/cart` — Clear cart
- LLM & AIRS
  - `POST /api/llm/chat` — Call LLM providers (Vertex, Bedrock, Azure, Anthropic, Ollama)
  - `POST /api/airs/scan` — Scan prompt/response for threats
  - `GET /api/models/available` — List reachable models + rate limit info
  - `GET /health` — Backend health check

# Deployment (Terraform on AWS)
- Prerequisites
  - AWS credentials configured (profile or env).
  - VPC/Subnet specified (`vpc_id`, `subnet_id`) or a default VPC available.
  - SSM parameter names provided; values entered interactively at apply (e.g., DB password, JWT secret, provider keys).
  - Optional Route53 zone if you want DNS (`create_route53_record`, `domain_name`, `edge_subdomain`).
- Steps
  1. `cd aws && terraform init`
  2. `terraform plan` (you will be prompted for SSM values like `ssm_db_password_value`, `ssm_jwt_secret_value`, and any provider keys if you set them)
  3. `terraform apply` (enter “yes”; Terraform writes SSM params, creates IAM role/policies, SG, EC2, optional DNS).
- What Terraform does
  - Provisions one EC2 (t4g/t3 nano by default) with an IAM role granting:
    - Read access to SSM parameters (secrets/env)
    - Bedrock InvokeModel permissions
  - Creates/updates SSM parameters for DB/JWT/AIRS/LLM endpoints/keys (values you provide at apply).
  - Installs Docker + compose via user_data, clones the repo, renders `.env*` from SSM, and runs `docker-compose up -d`.
- Variables (key ones)
  - `aws_region`: deployment region.
  - `vpc_id`, `subnet_id`: networking targets (required if no default VPC).
  - `instance_type`, `ami_architecture`: EC2 size/arch.
  - `key_name` or `generate_key_pair`: SSH access.
  - `enable_ollama`: turn on Ollama profile.
  - `create_route53_record`, `domain_name`, `edge_subdomain`: DNS.
  - `ssm_*_parameter`: names for SSM parameters.
  - `ssm_*_value`: values for those parameters (prompted at apply).
  - `docker_compose_version`, `github_repo_url`: bootstrap details.

# LLM Provider Prerequisites (quick setup)
- Google Vertex AI
  - Enable Vertex AI API in GCP; set `VERTEX_PROJECT_ID`, `VERTEX_LOCATION`, `VERTEX_API_KEY` (SSM values).
- Anthropic Claude
  - Create an API key in Anthropic Console; set `ANTHROPIC_API_KEY`.
- Azure OpenAI
  - Deploy a model in Azure OpenAI; set `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`.
- AWS Bedrock
  - Use a region where Bedrock is available; IAM role on the EC2 has InvokeModel; set optional `BEDROCK_MODEL` / `BEDROCK_LLAMA_MODEL`.
- Ollama (local)
  - Run Ollama service; set `OLLAMA_API_URL`, `OLLAMA_MODEL`; enable compose profile `with-ollama` if needed.
- AIRS (Palo Alto)
  - Obtain `AIRS_API_URL`, `AIRS_API_TOKEN`, `AIRS_PROFILE_NAME`; if missing, mock scanning is used.

# Provider Documentation Links
- Google Vertex AI: https://cloud.google.com/vertex-ai/docs
- Anthropic Claude: https://docs.anthropic.com/
- Azure OpenAI: https://learn.microsoft.com/azure/ai-services/openai/
- AWS Bedrock: https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html
- Ollama: https://github.com/ollama/ollama
- AIRS (Palo Alto): https://pan.dev/prisma-airs/
