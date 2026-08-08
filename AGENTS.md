# AGENTS.md

## Documentation

- `docs/PRD.md` - Product Requirements Document
- `docs/IMPLEMENTATION_PLAN.md` - Technical architecture, security, feature tickets

## Project Overview

White-labeled AI chatbot service for local businesses (dentists, salons, gyms, etc.). Productized service: build once, customize per client.

## Architecture

Single zero-dependency Node.js server handling everything (no runtime deps, no NestJS):

| Component | Stack | Port | Purpose |
|-----------|-------|------|---------|
| Server | Node.js `http` | 3000 | Auth, rate limiting, validation, CORS, AI processing |
| Chat Widget | Vanilla JS | - | Embeddable UI for client websites |

## Project Structure

```
apps/
└── api-gateway/      # Plain Node.js (TypeScript compiled with tsc)
    └── src/
        ├── ai/        # OpenRouter (fetch), RAG, Lead detection
        ├── auth/      # JWT (HS256), pure-JS bcrypt verify, scrypt hashing
        ├── chat/      # Chat processing
        ├── admin/     # Client management
        ├── leads/     # Lead capture
        ├── health/    # Health endpoints
        ├── http/      # Router, validation, rate limiter, static files, errors
        ├── config.ts  # Env + .env loader
        ├── routes.ts  # Route table (replaces NestJS controllers/guards)
        ├── server.ts  # createChatServer / startChatServer
        ├── index.ts   # Library API (ChatBot.start)
        └── __tests__/ # node:test suites (compiled to dist-test/)
data/
├── clients/          # Per-client knowledge bases (JSON)
└── leads/            # Captured leads per client
widgets/
└── chat-widget/      # Embeddable JS widget (built to dist/)
```

## Tech Stack

- **LLM Provider:** OpenRouter (inclusionai/ling-3.0-flash:free by default)
- **Backend:** Node.js built-ins only — `node:http`, `node:crypto`, global `fetch`, `node:test`
- **Auth:** JWT (HS256) with pure-JS bcrypt verification (`src/auth/bcrypt.ts`); new hashes via `scrypt$` format
- **Rate Limiting:** In-memory token bucket (`src/http/middleware.ts`)
- **Input Validation:** Custom validators (`src/http/validate.ts`) replacing class-validator
- **Tests:** `node:test` (no jest/supertest)

## Commands

```bash
# First time setup
npm install

# Development
npm run build         # Build server (tsc) + widget (rollup) + copy into dist/
npm run dev           # Builds then runs node --watch dist/main.js (CWD = apps/api-gateway)
npm run lint          # eslint (0 errors expected; warnings OK)
npm test              # tsc -p tsconfig.spec.json then node --test "dist-test/**/*.test.js"

# Server only
cd apps/api-gateway && npm run dev

# Generate an admin password hash
node apps/api-gateway/dist/scripts/hash-password.js <password>
```

## Environment Variables

Never commit `.env` files. Loaded from `apps/api-gateway/.env` (see `.env.example`). Required vars:

```env
# apps/api-gateway/.env
OPENROUTER_API_KEY=sk-or-xxxxx     # Get from openrouter.ai
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$10$xxxxx    # bcrypt or scrypt$ hash (hash-password.js)
JWT_SECRET=<random-32-byte-hex>
```

## Key Gotchas

- **CWD:** Server runs from `apps/api-gateway/` — use `path.join(process.cwd(), '..', '..')` for project root paths
- **RAG data dir:** CWD is `apps/api-gateway/` — data path resolves to `../../data/clients`. Override with `DATA_DIR` env var (set in Dockerfile for production)
- **Static paths:** `/widgets/` serves `widgets/chat-widget/dist` (or `./widgets-dist` in Docker). Build the widget before `npm run dev` or `/widgets/` 404s
- **OpenRouter free models:** The `:free` suffix models change availability. Use `inclusionai/ling-3.0-flash:free` as default. Always verify with `GET /api/v1/models` if a model returns 404
- **Zero runtime deps:** `apps/api-gateway` must NOT gain npm runtime dependencies. Everything uses Node built-ins or ported code (bcrypt, JWT). Dev/build deps (typescript, rollup, eslint) live in root `package.json`
- **Docker:** Production image copies only `dist` + `widgets-dist` + `data` — no node_modules (no runtime deps)
- **Widget auto-init:** The widget reads `data-*` attributes from its own `<script>` tag to configure itself

## Security Requirements

1. **Rate limiting:** Auth routes: 5 attempts/15min. Chat: 20/min. Leads: 10/min. Admin GET: 30/min, admin writes: 10/hour.
2. **No hardcoded secrets:** All API keys in env vars only.
3. **Input sanitization:** Validate all inputs. Max 2000 chars for messages, 10KB body limit.
4. **CORS:** Open in dev, restricted per client in production (`ALLOWED_ORIGINS`; empty = deny cross-origin).
5. **API key isolation:** OpenRouter key never reaches frontend or client widget.

## Conventions

- **Route table:** Add endpoints in `src/routes.ts` (not controllers) — validation via `src/http/validate.ts`, auth via `auth: true` flag
- **Client data:** Stored in `data/clients/{client-slug}/config.json`
- **Validation:** Always use `src/http/validate.ts` helpers (expectString/expectEmail/etc.), never inline checks
- **Client IDs:** Use slugs like `dr-smith-dental`, not UUIDs
- **Tests:** node:test files under `src/__tests__/*.test.ts`; keep them compiling via `tsconfig.spec.json`

## Codebase Analysis — Fallow

Run [Fallow](https://fallow.mintlify.app/) before committing to catch dead code, unused deps, duplication, and complexity hotspots.

```bash
# Full analysis (dead code + duplication + complexity + health)
npx fallow

# Targeted analysis
npx fallow dead-code     # Unused files, exports, dependencies
npx fallow dupes         # Copy-pasted code blocks
npx fallow health        # Complexity, maintainability, hotspots

# Auto-fix unused exports and dependencies
npx fallow fix --dry-run # Preview changes
npx fallow fix           # Apply changes
```

**Known false positives in this repo:**
- `demo.html` — HTML file with script tags, not a JS import
- Rollup plugins — in `widgets/chat-widget/package.json`, cross-workspace blind spot
- `src/__tests__/` — compiled to `dist-test/` via `tsconfig.spec.json`, not importable by the main build
- `src/scripts/hash-password.ts` — CLI utility run from `dist/`, not imported
