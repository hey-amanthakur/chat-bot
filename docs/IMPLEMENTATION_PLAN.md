# AI Chatbot Service - Implementation Plan

## Executive Summary

**Project:** White-labeled AI chatbot for local businesses  
**Tech Stack:** NestJS (API Gateway) + FastAPI (AI Service) + Embeddable JS Widget  
**Timeline:** 4 weeks (MVP)  
**Model:** Productized service (setup fee + monthly maintenance)

---

## 📋 Document Structure

| Document | Status | Purpose |
|----------|--------|---------|
| PRD (Product Requirements Document) | ✅ Exists | Business goals, features, constraints |
| Technical Architecture | 📝 To Create | System design, API contracts, data flow |
| Security & Access | 📝 To Create | Auth, rate limiting, secrets management |
| Feature Ticket List | 📝 To Create | Sprint-ready tasks with acceptance criteria |

---

## 🏗️ Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT WEBSITES                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │              Embeddable JS Widget (v1.0)                           │    │
│  │    • Chat UI    • Session Management    • Analytics                │    │
│  └────────────────────────────┬────────────────────────────────────────┘    │
└───────────────────────────────┼─────────────────────────────────────────────┘
                                │ HTTPS (CORS restricted)
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      NESTJS API GATEWAY (Port 3000)                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  • Rate Limiter (ThrottlerModule)      • Input Validation (Pipes)  │    │
│  │  • JWT Auth Guard                        • CORS Configuration       │    │
│  │  • Helmet Security                       • Request Logging          │    │
│  └────────────────────────────┬────────────────────────────────────────┘    │
└───────────────────────────────┼─────────────────────────────────────────────┘
                                │ Internal HTTP/gRPC
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Auth Module    │  │   Chat Module    │  │   Admin Module   │
│  (JWT, Login)    │  │  (Proxy to AI)   │  │  (Client CRUD)   │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FASTAPI AI SERVICE (Port 8000)                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  • OpenRouter Integration       • RAG Engine                      │    │
│  │  • System Prompt Builder        • Lead Capture Detection          │    │
│  │  • Conversation Handler         • Response Optimizer              │    │
│  └────────────────────────────┬────────────────────────────────────────┘    │
└───────────────────────────────┼─────────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   OpenRouter     │  │  JSON/Markdown   │  │  Resend/Sheets   │
│      API         │  │  (Client KB)     │  │  (Notifications) │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Service Responsibilities

| Service | Framework | Port | Responsibilities |
|---------|-----------|------|------------------|
| API Gateway | NestJS | 3000 | Auth, rate limiting, routing, validation, CORS |
| AI Service | FastAPI | 8000 | OpenRouter calls, RAG, prompts, lead detection |

### API Endpoints

#### NestJS Gateway (Public-Facing)

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| POST | `/api/chat` | Client ID | 20/min | Send message, get response |
| POST | `/api/admin/login` | Credentials | 5/15min | Admin authentication |
| GET | `/api/admin/clients` | JWT | 30/min | List all clients |
| POST | `/api/admin/clients` | JWT | 10/hr | Create new client |
| PUT | `/api/admin/clients/:id` | JWT | 10/hr | Update client config |
| POST | `/api/leads` | Client ID | 10/min | Submit lead capture |
| GET | `/api/health` | None | 60/min | Health check |

#### FastAPI Internal API (NestJS → FastAPI)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/internal/chat` | Process chat message |
| GET | `/internal/knowledge-base/{client_id}` | Get client KB |
| POST | `/internal/leads/detect` | Detect lead capture intent |

### Project Structure

```
chat-bot/
├── apps/
│   ├── api-gateway/          # NestJS Application
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── guards/
│   │   │   ├── chat/
│   │   │   │   ├── chat.module.ts
│   │   │   │   ├── chat.controller.ts
│   │   │   │   └── chat.service.ts
│   │   │   ├── admin/
│   │   │   │   ├── admin.module.ts
│   │   │   │   ├── admin.controller.ts
│   │   │   │   └── admin.service.ts
│   │   │   ├── leads/
│   │   │   │   ├── leads.module.ts
│   │   │   │   ├── leads.controller.ts
│   │   │   │   └── leads.service.ts
│   │   │   ├── common/
│   │   │   │   ├── filters/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── pipes/
│   │   │   │   └── middleware/
│   │   │   └── config/
│   │   └── test/
│   │
│   └── ai-service/           # FastAPI Application
│       ├── app/
│       │   ├── main.py
│       │   ├── core/
│       │   │   ├── config.py
│       │   │   ├── security.py
│       │   │   └── dependencies.py
│       │   ├── api/
│       │   │   ├── internal/
│       │   │   │   ├── chat.py
│       │   │   │   ├── knowledge.py
│       │   │   │   └── leads.py
│       │   │   └── v1/
│       │   ├── services/
│       │   │   ├── openrouter.py
│       │   │   ├── rag.py
│       │   │   ├── prompt_builder.py
│       │   │   └── lead_detector.py
│       │   ├── models/
│       │   │   ├── schemas.py
│       │   │   └── database.py
│       │   └── utils/
│       │       ├── validators.py
│       │       └── sanitizers.py
│       └── tests/
│
├── libs/
│   └── shared/                # Shared types/constants
│       ├── src/
│       │   ├── interfaces/
│       │   ├── constants/
│       │   └── dto/
│       └── package.json
│
├── widgets/
│   └── chat-widget/           # Embeddable JS Widget
│       ├── src/
│       │   ├── index.ts
│       │   ├── chat.ts
│       │   ├── api-client.ts
│       │   └── styles/
│       ├── dist/
│       └── package.json
│
├── data/
│   └── clients/               # Per-client knowledge bases
│       ├── client-1/
│       │   ├── config.json
│       │   ├── knowledge.md
│       │   └── faqs.json
│       └── client-2/
│
├── docker-compose.yml
├── package.json               # NestJS workspace
├── pyproject.toml             # FastAPI dependencies
└── .env.example
```

### Data Models

```typescript
// Client Configuration
interface Client {
  id: string;                    // UUID
  name: string;                  // "Dr. Smith Dental"
  slug: string;                  // "dr-smith-dental"
  apiKey: string;               // hashed, client-specific
  knowledgeBase: KnowledgeBase;
  settings: ClientSettings;
  createdAt: Date;
  updatedAt: Date;
}

interface KnowledgeBase {
  businessInfo: BusinessInfo;
  services: Service[];
  faqs: FAQ[];
  policies: Policy[];
  hours: BusinessHours[];
}

interface ClientSettings {
  tone: 'formal' | 'casual' | 'friendly';
  leadCaptureEnabled: boolean;
  leadNotificationMethod: 'email' | 'sheet' | 'webhook';
  leadEmail?: string;           // encrypted
  maxTokensPerResponse: number;
}

// Conversation
interface Conversation {
  id: string;
  clientId: string;
  sessionId: string;            // browser session
  messages: Message[];
  leadCaptured?: Lead;
  startedAt: Date;
  lastActiveAt: Date;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    tokensUsed: number;
    model: string;
    responseTimeMs: number;
  };
}

// Lead
interface Lead {
  id: string;
  clientId: string;
  name: string;
  email?: string;
  phone?: string;
  reason: string;
  conversationId: string;
  createdAt: Date;
}
```

---

## 🔐 Security & Access Document

### Security Requirements Matrix

| ID | Requirement | NestJS Implementation | FastAPI Implementation | Priority |
|----|-------------|----------------------|------------------------|----------|
| SEC-01 | Rate limiting on auth routes | `@nestjs/throttler`: 5 req/15min | `slowapi`: 5 req/15min | 🔴 Critical |
| SEC-02 | Rate limiting on chat | `@nestjs/throttler`: 20 req/min | `slowapi`: 20 req/min | 🔴 Critical |
| SEC-03 | No hardcoded secrets | `@nestjs/config` + `.env` | `pydantic-settings` + `.env` | 🔴 Critical |
| SEC-04 | API key isolation | Server-side only; client gets session tokens | Internal API only (no external exposure) | 🔴 Critical |
| SEC-05 | Input sanitization | `class-validator` + `class-transformer` | `pydantic` validators | 🔴 Critical |
| SEC-06 | CORS restriction | `@nestjs/common` CORS config | `CORSMiddleware` | 🟡 High |
| SEC-07 | Request size limits | `bodyParser: { limit: '10kb' }` | `Request body size middleware` | 🟡 High |
| SEC-08 | SQL injection prevention | TypeORM/Prisma parameterized queries | SQLAlchemy ORM | 🟡 High |
| SEC-09 | XSS protection | Helmet.js + CSP headers | `secure` headers middleware | 🟡 High |
| SEC-10 | Audit logging | Winston Logger + Interceptors | Python logging + Middleware | 🟢 Medium |

### Secrets Management Plan

**Environment Variables Required:**

```env
# OpenRouter
OPENROUTER_API_KEY=sk-or-xxxxx          # Never expose to client
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Admin Auth
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$10$xxxxx        # bcrypt hash, never plaintext
JWT_SECRET=$RANDOM_32_BYTE_HEX          # Generate at deploy time
JWT_EXPIRES_IN=24h

# Notifications
RESEND_API_KEY=re_xxxxx                 # Optional: email service
GOOGLE_SHEETS_CREDENTIALS={...}         # Optional: service account JSON

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000             # 15 minutes
RATE_LIMIT_MAX_AUTH=5                   # 5 attempts per window

# Server
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://client1.com,https://client2.com
```

**Scanning Checklist (to execute):**

```bash
# 1. Scan for hardcoded secrets
grep -r "sk-" --include="*.js" --include="*.ts" .
grep -r "api_key" --include="*.js" --include="*.ts" . -i
grep -r "password" --include="*.js" --include="*.ts" . -i | grep -v "hash"
grep -r "token" --include="*.js" --include="*.ts" . -i | grep -v "jwt"

# 2. Check .gitignore covers sensitive files
cat .gitignore  # Must include: .env*, *.key, credentials.json

# 3. Verify frontend bundle has no secrets
grep -r "OPENROUTER" --include="*.js" dist/
```

### Rate Limiting Implementation

#### NestJS (API Gateway)

```typescript
// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'auth',
        ttl: 900000,  // 15 minutes
        limit: 5,      // 5 attempts
      },
      {
        name: 'chat',
        ttl: 60000,   // 1 minute
        limit: 20,     // 20 messages
      },
      {
        name: 'leads',
        ttl: 60000,   // 1 minute
        limit: 10,     // 10 submissions
      },
    ]),
  ],
})
export class AppModule {}

// auth.controller.ts
@Controller('api/admin')
@UseGuards(ThrottlerGuard)
export class AuthController {
  @Post('login')
  @Throttle('auth', { limit: 5, ttl: 900000 })
  async login(@Body() loginDto: LoginDto) { ... }
}
```

#### FastAPI (AI Service)

```python
# app/main.py
from fastapi import FastAPI
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# app/api/internal/chat.py
@router.post("/internal/chat")
@limiter.limit("20/minute")
async def process_chat(request: Request, message: ChatMessage):
    ...
```

### Input Sanitization Rules

| Field | Validation | Max Length | Reject On |
|-------|------------|------------|-----------|
| `message` | Non-empty string | 2000 chars | Empty, XSS patterns, oversized |
| `clientId` | UUID format | 36 chars | Invalid format |
| `name` | Alpha + spaces | 100 chars | Numbers, special chars |
| `email` | Valid email | 254 chars | Invalid format |
| `phone` | E.164 format | 15 chars | Invalid format |
| `reason` | Non-empty string | 500 chars | Empty, oversized |

---

## 📝 Feature Ticket List

### Sprint 1: Foundation (Week 1)

| Ticket | Title | Priority | Est | Acceptance Criteria |
|--------|-------|----------|-----|---------------------|
| FEAT-01 | Project scaffolding (NestJS) | 🔴 High | 2h | NestJS app, modules structure, .env setup, health endpoint |
| FEAT-02 | Project scaffolding (FastAPI) | 🔴 High | 2h | FastAPI app, routers, pydantic config, health endpoint |
| FEAT-03 | Environment validation | 🔴 High | 1h | Both services fail fast if required env vars missing |
| FEAT-04 | Rate limiting (NestJS) | 🔴 High | 2h | ThrottlerModule: auth 5/15min, chat 20/min, leads 10/min |
| FEAT-05 | Rate limiting (FastAPI) | 🔴 High | 2h | slowapi: internal endpoints rate limited |
| FEAT-06 | Input validation (NestJS) | 🔴 High | 2h | class-validator DTOs for all endpoints |
| FEAT-07 | Input validation (FastAPI) | 🔴 High | 2h | pydantic models for all request/response |
| FEAT-08 | Security headers | 🔴 High | 1h | Helmet (NestJS), CORS, CSP headers |
| FEAT-09 | Admin auth (JWT) | 🔴 High | 4h | Login, token generation, JwtStrategy, guards |
| FEAT-10 | Inter-service communication | 🔴 High | 2h | NestJS → FastAPI HTTP client with retry logic |
| FEAT-11 | Logging system | 🟡 Med | 2h | Winston (NestJS) + Python logging with security events |

### Sprint 2: Core Chat (Week 2)

| Ticket | Title | Priority | Est | Acceptance Criteria |
|--------|-------|----------|-----|---------------------|
| FEAT-12 | Client config loader (FastAPI) | 🔴 High | 3h | Load per-client JSON, validate with pydantic |
| FEAT-13 | OpenRouter integration (FastAPI) | 🔴 High | 4h | httpx async client, error handling, retry logic |
| FEAT-14 | System prompt builder (FastAPI) | 🔴 High | 3h | Dynamic prompts per client (tone, persona, rules) |
| FEAT-15 | Chat endpoint (NestJS) | 🔴 High | 2h | POST /api/chat, validate, proxy to FastAPI |
| FEAT-16 | Chat processor (FastAPI) | 🔴 High | 4h | POST /internal/chat, session management, response <3s |
| FEAT-17 | RAG implementation (FastAPI) | 🟡 Med | 4h | Simple similarity search for knowledge base |
| FEAT-18 | Lead capture trigger (FastAPI) | 🔴 High | 2h | Detect "I don't know" scenarios, prompt for info |
| FEAT-19 | Lead API endpoint (NestJS) | 🔴 High | 2h | POST /api/leads, validation, store |

### Sprint 3: Widget & Leads (Week 3)

| Ticket | Title | Priority | Est | Acceptance Criteria |
|--------|-------|----------|-----|---------------------|
| FEAT-14 | JS Widget - UI | 🔴 High | 4h | Chat bubble, message list, input field |
| FEAT-15 | JS Widget - API client | 🔴 High | 3h | Fetch wrapper, session handling, CORS |
| FEAT-16 | Embeddable script | 🔴 High | 2h | Single <script> tag loads widget |
| FEAT-17 | Lead API endpoint | 🔴 High | 2h | POST /api/leads, validation, storage |
| FEAT-18 | Email notifications | 🟡 Med | 3h | Resend integration, lead summary email |
| FEAT-19 | Google Sheets integration | 🟢 Low | 3h | Append rows to client's sheet |

### Sprint 4: Admin & Polish (Week 4)

| Ticket | Title | Priority | Est | Acceptance Criteria |
|--------|-------|----------|-----|---------------------|
| FEAT-20 | Admin endpoints | 🟡 Med | 4h | CRUD for clients, knowledge base management |
| FEAT-21 | Client config UI | 🟢 Low | 4h | Simple form to update business info |
| FEAT-22 | Mobile responsiveness | 🔴 High | 2h | Widget works on all screen sizes |
| FEAT-23 | Conversation history | 🟡 Med | 3h | Persist per session, cleanup after 24h |
| FEAT-24 | Error handling | 🔴 High | 2h | Graceful failures, user-friendly messages |
| FEAT-25 | Security audit | 🔴 High | 4h | Full code review, penetration test |
| FEAT-26 | Documentation | 🟡 Med | 2h | API docs, deployment guide, README |

---

## 🛡️ Security Audit Checklist

### Pre-Deployment Security Verification

```
[ ] No hardcoded API keys, tokens, or passwords in source code
[ ] All secrets in environment variables
[ ] .env files in .gitignore
[ ] Rate limiting active on all endpoints
[ ] Input validation on all user-facing endpoints
[ ] Request size limits configured (10KB max)
[ ] CORS restricted to allowed origins
[ ] Security headers enabled (helmet)
[ ] Admin passwords stored as bcrypt hashes
[ ] JWT tokens have expiration
[ ] OpenRouter API key never sent to frontend
[ ] Error messages don't leak system details
[ ] Logging captures security events
[ ] Dependency audit passed (npm audit)
```

### Runtime Security Monitoring

| Event | Action | Log Level |
|-------|--------|-----------|
| Failed login attempt | Log IP + timestamp | WARN |
| Rate limit exceeded | Log client ID + IP | WARN |
| Invalid input rejected | Log field + value | INFO |
| API key misuse | Log + alert | ERROR |
| Unusual traffic spike | Log + alert | ERROR |

---

## 📅 Timeline Overview

```
Week 1: Foundation & Security
├── Day 1-2: Project setup, env validation, rate limiting
├── Day 3-4: Admin auth, input validation, security headers
└── Day 5: Logging, testing

Week 2: Core Chat Engine
├── Day 1-2: Client config, OpenRouter integration
├── Day 3-4: System prompts, chat endpoint
└── Day 5: RAG, lead capture logic

Week 3: Widget & Integrations
├── Day 1-2: JS Widget UI + API client
├── Day 3: Embeddable script
├── Day 4-5: Lead API, email/Sheets integration

Week 4: Admin & Launch
├── Day 1-2: Admin CRUD endpoints
├── Day 3: Mobile responsive, conversation history
├── Day 4: Security audit, error handling
└── Day 5: Documentation, deployment
```

---

## 🚀 Deployment Architecture

```
Production Environment:
├── Vercel/Render (API Server)
│   ├── Environment Variables (encrypted)
│   ├── Auto-scaling
│   └── Custom domain per client
│
├── Static Hosting (Widget)
│   └── CDN-distributed JS bundle
│
└── Data Storage
    ├── JSON files (per-client KB)
    └── Server memory (conversations, ephemeral)
```

---

## 📌 Next Steps

1. **Review this plan** - Confirm tech stack choices and priorities
2. **Set up project** - Initialize repo with folder structure
3. **Start Sprint 1** - Begin with FEAT-01 (project scaffolding)
4. **Security first** - Implement rate limiting and env validation before features

**Ready to begin implementation?**
