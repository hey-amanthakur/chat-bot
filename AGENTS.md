# AGENTS.md

## Documentation

- `docs/PRD.md` - Product Requirements Document
- `docs/IMPLEMENTATION_PLAN.md` - Technical architecture, security, feature tickets

## Project Overview

White-labeled AI chatbot service for local businesses (dentists, salons, gyms, etc.). Productized service: build once, customize per client.

## Architecture

Two-service microservices architecture:

| Service | Framework | Port | Purpose |
|---------|-----------|------|---------|
| API Gateway | NestJS | 3000 | Auth, rate limiting, validation, CORS, routing |
| AI Service | FastAPI | 8000 | OpenRouter calls, RAG, prompts, lead detection |

NestJS proxies external requests to FastAPI internally. FastAPI is never exposed publicly.

## Project Structure

```
apps/
├── api-gateway/      # NestJS (TypeScript)
└── ai-service/       # FastAPI (Python)
data/
└── clients/          # Per-client knowledge bases (JSON/Markdown)
widgets/
└── chat-widget/      # Embeddable JS widget
```

## Tech Stack

- **LLM Provider:** OpenRouter (Llama 3.1, Mistral, Qwen)
- **Backend:** NestJS (gateway) + FastAPI (AI)
- **Auth:** JWT with bcrypt password hashes
- **Rate Limiting:** `@nestjs/throttler` (NestJS) + `slowapi` (FastAPI)
- **Input Validation:** `class-validator` (NestJS) + `pydantic` (FastAPI)
- **Notifications:** Resend (email) or Google Sheets API

## Commands

```bash
# NestJS Gateway
cd apps/api-gateway
npm install
npm run start:dev    # Dev server on :3000
npm run build        # Production build
npm run test         # Jest tests

# FastAPI AI Service
cd apps/ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
pytest               # Tests
```

## Environment Variables

Never commit `.env` files. Required vars:

```env
# OpenRouter (server-side only, never exposed to frontend)
OPENROUTER_API_KEY=sk-or-xxxxx

# Admin Auth
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$10$xxxxx  # bcrypt hash
JWT_SECRET=<random-32-byte-hex>

# Services
RESEND_API_KEY=re_xxxxx          # Optional
ALLOWED_ORIGINS=https://...
```

## Security Requirements

1. **Rate limiting:** Auth routes: 5 attempts/15min. Chat: 20/min. Leads: 10/min.
2. **No hardcoded secrets:** All API keys in env vars only.
3. **Input sanitization:** Validate all inputs. Max 2000 chars for messages, 10KB body limit.
4. **CORS:** Restrict to allowed origins per client.
5. **API key isolation:** OpenRouter key never reaches frontend or client widget.

## Key Constraints (from PRD)

- Response time <3 seconds per message
- Cost <$0.02 per conversation
- Widget must embed via single `<script>` tag on any website
- Must work on desktop and mobile
- Per-client knowledge base isolation (no cross-contamination)

## Conventions

- **NestJS modules:** One module per domain (auth, chat, admin, leads)
- **FastAPI routers:** Internal endpoints at `/internal/*` prefix
- **Client data:** Stored in `data/clients/{client-id}/` as JSON + Markdown
- **DTOs:** Always use class-validator (NestJS) or pydantic (FastAPI) for request/response validation
