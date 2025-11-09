# AI Agent Instructions for AIRS-D

This is a secure AI shopping assistant demonstrating real-time prompt injection protection using AIRS Runtime Security. Follow these guidelines when working with the codebase.

## 🏗️ Architecture Overview

- **Frontend**: React/Vite SPA in `src/` with TypeScript
- **Backend**: Express/Node.js server in `server/` handling LLM APIs
- **Security Layer**: AIRS runtime protection between Backend and LLMs
- **Flow**: Browser → Frontend → Backend → AIRS Scanner → LLM APIs

## 🔑 Key Design Patterns

1. **Multi-LLM Support**
   - LLM providers configured in `src/config/models.config.ts`
   - Provider-specific implementations in `src/services/llmService.ts`
   - Each provider follows common interface pattern with provider-specific headers/auth

2. **Security-First Architecture**
   - All API keys and secrets MUST stay in `server/.env`
   - Frontend uses only `VITE_*` public variables
   - NEVER expose API keys in frontend code or `VITE_*` variables
   - All LLM requests pass through AIRS security scanning

3. **System Prompt Management**
   - Core bot personality in `server/SYSTEM_PROMPT.txt`
   - Product context injected via `services/productContext.ts`
   - Security rules enforced by both prompt and AIRS

## 💻 Development Workflow

1. **Setup**
   ```bash
   npm install          # Frontend deps
   cd server && npm install && cd ..  # Backend deps
   ```

2. **Local Development**
   ```bash
   # Terminal 1: Backend
   cd server && npm start

   # Terminal 2: Frontend
   npm run dev
   ```

3. **Testing**
   - Security testing via Attack Demo Lab in UI
   - Review `TEST_CASES.md` for test scenarios
   - Monitor AIRS verdicts in server logs

## 🔄 Common Tasks

1. **Adding New LLM Provider**
   - Add config in `src/config/models.config.ts`
   - Implement provider in `src/services/llmService.ts`
   - Add environment variables in `server/.env`

2. **Modifying Bot Behavior**
   - Update core personality in `SYSTEM_PROMPT.txt`
   - Add product data in `services/productContext.ts`
   - Test against security rules in Attack Demo

3. **Docker Deployment**
   ```bash
   # Production
   docker-compose up -d

   # Development with hot reload
   docker-compose -f docker-compose.dev.yml up -d
   ```

## ⚠️ Common Pitfalls

1. **Security**
   - Don't bypass AIRS scanner
   - Keep all API keys in `server/.env`
   - Never use `VITE_*` for secrets

2. **Architecture**
   - Don't call LLM APIs directly from frontend
   - Always route through backend security layer
   - Use proper error handling patterns

3. **Development**
   - Check `server/.env` exists before starting
   - Verify backend health at http://localhost:3001/health
   - Use mock LLM if no provider keys configured

## 📁 Key Files

- `server/index.js` - Express API server
- `src/components/Chatbot.tsx` - Main chatbot UI
- `src/services/llmService.ts` - LLM API client
- `SYSTEM_PROMPT.txt` - Core bot personality
- `docker-compose.yml` - Production setup

## 🎯 Project Goals

1. Demonstrate secure LLM integration patterns
2. Showcase real-time prompt injection protection
3. Provide enterprise-grade security example
4. Support multiple LLM providers cleanly

Remember: Security and proper API key handling are top priorities in this project.