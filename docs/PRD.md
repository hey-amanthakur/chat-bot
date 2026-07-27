# Requirements Document: AI Chatbot Service for Local Businesses

## 1. Overview
**Product:** A reusable, white-labeled AI chatbot template that can be customized and deployed for local business clients (dentists, salons, gyms, restaurants, etc.) to answer FAQs, capture leads, and assist with bookings.

**Business model:** Productized service — build once, customize per client, charge flat setup fee + optional monthly maintenance.

**Model provider:** OpenRouter (avoids single-vendor lock-in, access to multiple open-source models via one API).

---

## 2. Goals
- Ship a working chatbot for a new client within 1.5–2 hours using a repeatable template
- Keep per-conversation cost low (<$0.01–$0.02 per chat)
- No dependency on a single closed-source LLM vendor
- Non-technical clients should be able to embed it with a single script tag

---

## 3. Functional Requirements

### 3.1 Core Chat Functionality
- FR1: Bot must answer questions using only business-specific info (services, hours, prices, location, policies)
- FR2: Bot must gracefully hand off to lead capture when it doesn't know an answer ("Let me get someone to help — can I get your name and number?")
- FR3: Bot must support a configurable tone/persona per client (formal, casual, friendly)
- FR4: Conversation history should persist per session (at least within a single visit)

### 3.2 Knowledge Base / Customization
- FR5: Each client's data (services, FAQs, hours, pricing) must be stored in a structured, swappable format (e.g., JSON or Markdown file) — not hardcoded into the bot logic
- FR6: System must support easy update of a client's knowledge base without rebuilding the whole bot
- FR7: Support retrieval-augmented responses (RAG) so the model only answers from the client's actual data, not general knowledge — reduces hallucination risk

### 3.3 Lead Capture
- FR8: Bot must be able to collect name, phone/email, and reason for contact when it can't answer
- FR9: Captured leads must be sent somewhere usable — email notification, Google Sheet, or simple webhook

### 3.4 Deployment
- FR10: Bot must be embeddable via a single script tag or iframe on any website (Wix, Squarespace, WordPress, custom HTML)
- FR11: Must work on both desktop and mobile browsers

### 3.5 Admin / Client-Facing
- FR12: Simple way (even a shared doc/form) for client to update their business info without needing you every time (nice-to-have, not required for MVP)

---

## 4. Non-Functional Requirements

- NFR1 (Cost): Target <$0.02 per conversation using open-source models on OpenRouter (e.g., Llama 3.1 8B, Mistral, Qwen — cheaper tiers)
- NFR2 (Latency): Response time under 3 seconds per message
- NFR3 (Reliability): Uptime dependent on OpenRouter + hosting provider SLA; no self-hosted infra required for MVP
- NFR4 (Security/Privacy): No storage of sensitive personal data beyond what's needed for lead capture; API keys stored server-side, never exposed in client-facing code
- NFR5 (Scalability): Same backend/template must support multiple clients simultaneously without cross-contamination of knowledge bases

---

## 5. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| LLM Provider | OpenRouter (routes to Llama 3.1, Mistral, Qwen, etc.) | No single-vendor lock-in, pay-per-token, model flexibility |
| Backend | Lightweight server (Node.js/Express or Python/FastAPI) | Handles API calls to OpenRouter, keeps API key secret |
| Knowledge base storage | JSON/Markdown files per client, or simple vector DB (e.g., Supabase pgvector, Chroma) if doing RAG | Swappable, per-client isolation |
| Frontend widget | Simple embeddable JS chat widget (custom-built or lightly modified open-source widget) | Needs to work on any website via script tag |
| Lead notifications | Email (via Resend/SendGrid) or Google Sheets API webhook | Simple, no extra client-side tooling needed |
| Hosting | Vercel/Render/Railway free-to-cheap tier | Low cost, fast to deploy, scales per client |

---

## 6. Per-Client Workflow (Repeatable Template)

1. Collect business info (services, hours, FAQs, tone) → structured JSON/Markdown file
2. Load file into knowledge base / RAG store for that client
3. Configure system prompt with business name, tone, and lead-capture rules
4. Test against 10 real customer questions (pulled from reviews)
5. Deploy widget config for that client (unique client ID tied to their knowledge base)
6. Hand off script tag + short demo video

---

## 7. Out of Scope (for MVP)
- Voice/phone integration
- Multi-language support
- Full booking/calendar integration (can be phase 2)
- Client self-serve dashboard (manual updates by you initially)
- Fine-tuning a custom model (use RAG + prompting instead)

---

## 8. Open Questions / Decisions Needed
- Which specific OpenRouter model to default to (balance of cost vs. quality) — needs testing
- RAG vs. simple prompt-stuffing for small clients (RAG only needed if knowledge base is large; small businesses may fit directly in the prompt context, which is simpler and cheaper)
- Where lead capture data goes by default (Google Sheet is simplest for non-technical you; email is simplest for client)