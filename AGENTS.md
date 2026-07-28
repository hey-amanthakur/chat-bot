# AGENTS.md

## Documentation

- `docs/PRD.md` - Product Requirements Document
- `docs/IMPLEMENTATION_PLAN.md` - Technical architecture, security, feature tickets

## Project Overview

White-labeled AI chatbot service for local businesses (dentists, salons, gyms, etc.). Productized service: build once, customize per client.

## Architecture

Single NestJS server handling everything:

| Component | Framework | Port | Purpose |
|-----------|-----------|------|---------|
| Server | NestJS | 3000 | Auth, rate limiting, validation, CORS, AI processing |
| Chat Widget | Vanilla JS | - | Embeddable UI for client websites |

## Project Structure

```
apps/
└── api-gateway/      # NestJS (TypeScript)
    └── src/
        ├── ai/        # OpenRouter, RAG, Lead detection
        ├── auth/      # JWT authentication
        ├── chat/      # Chat processing
        ├── admin/     # Client management
        ├── leads/     # Lead capture
        └── health/    # Health endpoints
data/
├── clients/          # Per-client knowledge bases (JSON/Markdown)
└── leads/            # Captured leads per client
widgets/
└── chat-widget/      # Embeddable JS widget (built to dist/)
```

## Tech Stack

- **LLM Provider:** OpenRouter (inclusionai/ling-3.0-flash:free by default)
- **Backend:** NestJS
- **Auth:** JWT with bcrypt password hashes
- **Rate Limiting:** `@nestjs/throttler`
- **Input Validation:** `class-validator`
- **Notifications:** Resend (email) or Google Sheets API

## Commands

```bash
# First time setup
npm install

# Development
npm run dev           # Starts the NestJS server
npm run build         # Build all packages
npm run lint          # Lint all packages

# Server only
cd apps/api-gateway && npx nest start --watch

# Build widget
cd widgets/chat-widget && npm run build
```

## Environment Variables

Never commit `.env` files. Required vars:

```env
# apps/api-gateway/.env
OPENROUTER_API_KEY=sk-or-xxxxx     # Get from openrouter.ai
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$10$xxxxx    # bcrypt hash
JWT_SECRET=<random-32-byte-hex>
```

## Key Gotchas

- **Turborepo CWD:** NestJS runs from `apps/api-gateway/` — use `path.join(process.cwd(), '..', '..')` for project root paths
- **RAG data dir:** CWD is `apps/api-gateway/` — data path resolves to `../../data/clients`. Override with `DATA_DIR` env var (set in Dockerfile for production)
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

- **NestJS modules:** One module per domain (auth, chat, admin, leads, health, ai)
- **Client data:** Stored in `data/clients/{client-slug}/config.json`
- **DTOs:** Always use class-validator
- **Client IDs:** Use slugs like `dr-smith-dental`, not UUIDs
