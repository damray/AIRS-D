# Docker Deployment Guide

## Architecture

This application is fully containerized with 3 services:

1. **PostgreSQL 16** - Database container
2. **Node.js Express Backend** - API server (not downloadable by browser)
3. **Nginx Frontend** - Serves static React build

```
┌─────────────────────────────────────────────────┐
│  Browser (Port 80)                              │
│  ↓ Downloads: HTML, JS, CSS (Static files)     │
└─────────────────────────────────────────────────┘
                    │
                    │ HTTP Requests
                    ↓
┌─────────────────────────────────────────────────┐
│  Backend (Port 3001) - Node.js Express          │
│  ↓ Has access to: API keys, JWT secrets        │
│  ↓ Never sent to browser                       │
└─────────────────────────────────────────────────┘
                    │
                    │ SQL Queries
                    ↓
┌─────────────────────────────────────────────────┐
│  PostgreSQL (Port 5432)                         │
│  ↓ Tables: users, products, cart_items          │
└─────────────────────────────────────────────────┘
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
