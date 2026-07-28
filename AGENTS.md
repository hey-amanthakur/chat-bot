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
├── clients/          # Per-client knowledge bases (JSON/Markdown)
└── leads/            # Captured leads per client
widgets/
└── chat-widget/      # Embeddable JS widget (built to dist/)
```

## Tech Stack

- **LLM Provider:** OpenRouter (inclusionai/ling-3.0-flash:free by default)
- **Backend:** NestJS (gateway) + FastAPI (AI)
- **Auth:** JWT with bcrypt password hashes
- **Rate Limiting:** `@nestjs/throttler` (NestJS) + `slowapi` (FastAPI)
- **Input Validation:** `class-validator` (NestJS) + `pydantic` (FastAPI)
- **Notifications:** Resend (email) or Google Sheets API

## Commands

```bash
# First time setup
npm install
./setup.sh            # Creates Python venv + installs deps

# Development
npm run dev           # Starts both services via Turborepo
npm run build         # Build all packages
npm run lint          # Lint all packages

# NestJS Gateway only
cd apps/api-gateway && npx nest start --watch

# FastAPI AI Service only
cd apps/ai-service && .venv/bin/uvicorn app.main:app --reload --port 8000

# Build widget
cd widgets/chat-widget && npm run build
```

## Environment Variables

Never commit `.env` files. Required vars in each service:

```env
# apps/ai-service/.env
OPENROUTER_API_KEY=sk-or-xxxxx     # Get from openrouter.ai

# apps/api-gateway/.env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$10$xxxxx    # bcrypt hash
JWT_SECRET=<random-32-byte-hex>
```

## Key Gotchas

- **Turborepo CWD:** NestJS runs from `apps/api-gateway/` — use `path.join(process.cwd(), '..', '..')` for project root paths
- **FastAPI data dir:** RAG service path is `Path(__file__).parent.parent.parent.parent.parent / "data" / "clients"` (5 parents from `app/services/rag.py`)
- **OpenRouter free models:** The `:free` suffix models change availability. Use `inclusionai/ling-3.0-flash:free` as default. Always verify with `GET /api/v1/models` if a model returns 404
- **@nestjs/throttler v5:** Decorator syntax is `@Throttle({ name: { limit, ttl } })` not `@Throttle('name', { limit, ttl })`
- **Widget auto-init:** The widget reads `data-*` attributes from its own `<script>` tag to configure itself

## Security Requirements

1. **Rate limiting:** Auth routes: 5 attempts/15min. Chat: 20/min. Leads: 10/min.
2. **No hardcoded secrets:** All API keys in env vars only.
3. **Input sanitization:** Validate all inputs. Max 2000 chars for messages, 10KB body limit.
4. **CORS:** Open in dev, restricted per client in production.
5. **API key isolation:** OpenRouter key never reaches frontend or client widget.

## Conventions

- **NestJS modules:** One module per domain (auth, chat, admin, leads, health)
- **FastAPI routers:** Internal endpoints at `/internal/*` prefix
- **Client data:** Stored in `data/clients/{client-slug}/config.json` + `knowledge.md`
- **DTOs:** Always use class-validator (NestJS) or pydantic (FastAPI)
- **Client IDs:** Use slugs like `dr-smith-dental`, not UUIDs
