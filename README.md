# AI Chatbot Service

White-labeled AI chatbot for local businesses. Answer FAQs, capture leads, and assist with bookings.

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Widget     │────▶│  NestJS Gateway  │────▶│  FastAPI AI Svc  │
│  (browser)   │     │    :3000         │     │     :8000        │
└──────────────┘     └──────────────────┘     └──────────────────┘
                            │                         │
                     Rate Limiting              OpenRouter API
                     JWT Auth                   RAG Engine
                     Input Validation           Lead Detection
```

| Service | Framework | Port | Purpose |
|---------|-----------|------|---------|
| API Gateway | NestJS | 3000 | Auth, rate limiting, validation, CORS |
| AI Service | FastAPI | 8000 | OpenRouter calls, RAG, prompts, leads |
| Chat Widget | Vanilla JS | - | Embeddable UI for client websites |

## Quick Start

```bash
# First time setup
npm install
./setup.sh          # Creates Python venv + installs deps

# Start development
npm run dev         # Runs both services
```

## Services

- **API Gateway:** http://localhost:3000
- **AI Service:** http://localhost:8000
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
│   ├── api-gateway/      # NestJS (TypeScript)
│   │   └── src/
│   │       ├── auth/     # JWT authentication
│   │       ├── chat/     # Chat proxy to AI service
│   │       ├── admin/    # Client management
│   │       ├── leads/    # Lead capture
│   │       └── health/   # Health endpoints
│   │
│   └── ai-service/       # FastAPI (Python)
│       └── app/
│           ├── api/      # Internal endpoints
│           ├── services/ # OpenRouter, RAG, leads
│           └── models/   # Pydantic schemas
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

Copy `.env.example` to `.env` in each service:

```bash
# apps/api-gateway/.env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$10$...    # bcrypt hash
JWT_SECRET=<random-32-byte-hex>

# apps/ai-service/.env
OPENROUTER_API_KEY=sk-or-xxxxx   # Get from openrouter.ai
```

## Client Knowledge Base

Each client has a folder in `data/clients/{client-id}/`:

```
data/clients/dr-smith-dental/
├── config.json      # Client settings
├── knowledge.md     # Business info
└── faqs.json        # Frequently asked questions
```

## Tech Stack

- **Backend:** NestJS + FastAPI
- **LLM:** OpenRouter (Llama 3.1, Mistral, Qwen)
- **Auth:** JWT + bcrypt
- **Rate Limiting:** @nestjs/throttler + slowapi
- **Validation:** class-validator + pydantic
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
npm run dev          # Start all services
npm run build        # Build all packages
npm run lint         # Lint all packages
npm run format       # Format with Prettier
npm run test         # Run all tests
```
