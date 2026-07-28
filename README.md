# AI Chatbot Service

White-labeled AI chatbot for local businesses. Answer FAQs, capture leads, and assist with bookings.

## Architecture

```
┌──────────────┐     ┌──────────────────────────┐
│   Widget     │────▶│     NestJS Server         │
│  (browser)   │     │        :3000              │
└──────────────┘     └──────────────────────────┘
                           │
                     Rate Limiting
                     JWT Auth
                     Input Validation
                     OpenRouter API
                     RAG Engine
                     Lead Detection
```

| Component | Framework | Port | Purpose |
|-----------|-----------|------|---------|
| Server | NestJS | 3000 | Auth, rate limiting, validation, CORS, AI processing |
| Chat Widget | Vanilla JS | - | Embeddable UI for client websites |

## Quick Start

```bash
# First time setup
npm install

# Start development
npm run dev
```

## Services

- **Server:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health

## API Endpoints

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| POST | `/api/chat` | Client ID | 20/min | Send message |
| POST | `/api/admin/login` | Credentials | 5/15min | Admin login |
| GET | `/api/admin/clients` | JWT | 30/min | List clients |
| POST | `/api/admin/clients` | JWT | 10/hr | Create client |
| PUT | `/api/admin/clients/:id` | JWT | 10/hr | Update client |
| POST | `/api/leads` | Client ID | 10/min | Submit lead |
| GET | `/api/health` | None | - | Health check |

## Project Structure

```
chat-bot/
├── apps/
│   └── api-gateway/      # NestJS (TypeScript)
│       └── src/
│           ├── ai/        # OpenRouter, RAG, Lead detection
│           ├── auth/      # JWT authentication
│           ├── chat/      # Chat processing
│           ├── admin/     # Client management
│           ├── leads/     # Lead capture
│           └── health/    # Health endpoints
│
├── widgets/
│   └── chat-widget/      # Embeddable JS widget
│
├── data/
│   └── clients/          # Per-client knowledge bases
│
└── docs/
    ├── PRD.md            # Product requirements
    └── IMPLEMENTATION_PLAN.md
```

## Environment Variables

Copy `.env.example` to `.env` in `apps/api-gateway/`:

```bash
OPENROUTER_API_KEY=sk-or-xxxxx   # Get from openrouter.ai
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$10$...    # bcrypt hash
JWT_SECRET=<random-32-byte-hex>
```

## Docker Self-Host

```bash
cp .env.example .env              # Fill in your env vars
docker compose up -d              # Server running on localhost:3000
```

## Client Knowledge Base

Each client has a folder in `data/clients/{client-id}/`:

```
data/clients/dr-smith-dental/
├── config.json      # Client settings + knowledge
└── knowledge.md     # Business info
```

## Tech Stack

- **Backend:** NestJS
- **LLM:** OpenRouter (inclusionai/ling-3.0-flash:free)
- **Auth:** JWT + bcrypt
- **Rate Limiting:** @nestjs/throttler
- **Validation:** class-validator
- **Build:** Turborepo
- **Widget:** Vanilla JS + Rollup

## Security

- Rate limiting on all endpoints
- No API keys in frontend code
- Input validation + size limits (10KB)
- CORS restricted per client
- bcrypt password hashing
- JWT expiration

## Commands

```bash
npm run dev          # Start the server
npm run build        # Build all packages
npm run lint         # Lint all packages
npm run format       # Format with Prettier
npm run test         # Run all tests
```
