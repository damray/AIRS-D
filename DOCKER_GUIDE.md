# Docker Deployment Guide

## Architecture

This application is fully containerized with 4 services:

edge — Nginx (or OpenResty/Traefik)
      Serves React build at /
      Proxies /api/* to backend:3001
      Optional TLS on 443

backend — Node.js/Express (port 3001)
         Implements /api/* (auth, products, cart, LLM, AIRS, health)
         Holds secrets (DB creds, API tokens, AIRS token)

postgres — PostgreSQL 16 (port 5432)
         users, products, cart_items (+ seed data)

(optional) ollama — local LLM endpoint (if enabled)

```
┌──────────────────────────────────────────────────────────┐
│ Browser (80/443)                                         │
│   GET /                      → React static (via Edge)    │
│   POST /api/llm/chat         → proxy → Backend:3001       │
│   GET  /api/products         → proxy → Backend:3001       │
└──────────────────────────────────────────────────────────┘
                         │
              (reverse proxy: /api → 3001)
                         │
┌──────────────────────────────────────────────────────────┐
│ Edge (Nginx)                                              │
│  - Serves: / (React build)                                │
│  - Proxies: /api/* → http://backend:3001/api/*            │
└──────────────────────────────────────────────────────────┘
                         │
                         │ REST / DB client
                         ↓
┌──────────────────────────────────────────────────────────┐
│ Backend (Node/Express:3001)                               │
│  - Routes: /api/auth, /api/products, /api/cart,           │
│           /api/llm/chat, /api/airs/scan, /health          │
│  - Secrets: JWT, DB, AIRS, providers                      │
└──────────────────────────────────────────────────────────┘
                         │
                         │ SQL
                         ↓
┌──────────────────────────────────────────────────────────┐
│ PostgreSQL (5432)                                         │
│  - users, products, cart_items                            │
└──────────────────────────────────────────────────────────┘

```

## Security Model

### Frontend (Browser)
- **Receives:** Static HTML/CSS/JS files from nginx
- **Contains:** `VITE_BACKEND_URL` (public URL - safe)
- **Cannot access:** API keys, database, backend code

### Backend (Server Container)
- **Runs in:** Docker container (isolated)
- **Has access to:** All API keys, database credentials
- **Exposed to browser:** Only HTTP endpoints (JSON responses)
- **Source code:** Never downloaded by browser

## Setup Instructions

### 1. Configure Environment Variables

Copy the example file:
```bash
cp .env.example .env
```

Edit `.env` and fill in your secrets:
```env
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
ANTHROPIC_API_KEY=sk-ant-...
VERTEX_API_KEY=...
# etc.
```

### 2. Start Services

Start all services:
```bash
docker-compose up -d
```

With Ollama (optional):
```bash
docker-compose --profile with-ollama up -d
```

### 3. Verify Services

Check health:
```bash
docker-compose ps
docker-compose logs backend
```

Access:
- Frontend: http://localhost:80
- Backend API: http://localhost:3001/health
- Database: localhost:5432 (PostgreSQL client only)

## Database Schema

The PostgreSQL database is automatically initialized with:

### Tables
- `users` - User accounts (email + password hash)
- `products` - Product catalog (10 sample products included)
- `cart_items` - Shopping cart (linked to users)

### Sample Data
10 electronics products are pre-loaded on startup.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Get JWT token

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product

### Cart (Requires JWT)
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/:id` - Update quantity
- `DELETE /api/cart/:id` - Remove item
- `DELETE /api/cart` - Clear cart

### LLM & AIRS
- `POST /api/llm/chat` - Call LLM providers
- `POST /api/airs/scan` - Scan prompt for threats

## Stopping Services

Stop all:
```bash
docker-compose down
```

Stop and remove volumes (deletes database):
```bash
docker-compose down -v
```

## Troubleshooting

### Backend can't connect to database
```bash
docker-compose logs postgres
docker-compose restart backend
```

### Frontend shows connection error
Check `VITE_BACKEND_URL` in browser:
- Should be: `http://localhost:3001`
- Check `.env` file was copied to root directory

### Database reset needed
```bash
docker-compose down -v
docker-compose up -d
```

## Development Mode

For local development without Docker:

1. Start PostgreSQL locally
2. Run backend:
   ```bash
   cd server
   cp .env.example .env
   npm install
   npm run dev
   ```
3. Run frontend:
   ```bash
   npm install
   npm run dev
   ```

## Production Notes

### Security
- Change all default passwords
- Use strong JWT_SECRET (32+ chars)
- Enable HTTPS (add reverse proxy)
- Restrict database port (remove port mapping)

### Environment Variables
All secrets are in `.env` (root directory) which:
- Is NOT committed to git (`.gitignore`)
- Is NOT built into Docker images
- Is passed at runtime via `docker-compose.yml`

### Scaling
- Frontend: Can scale horizontally (stateless)
- Backend: Can scale with load balancer
- Database: Use connection pooling (already configured)
