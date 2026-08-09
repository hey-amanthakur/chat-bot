<div align="center">

# Chat-Box

### An embeddable, zero-dependency AI chatbot server for local businesses

[![npm version](https://img.shields.io/npm/v/@hey-amanthakur/chat-bot.svg?style=flat-square)](https://www.npmjs.com/package/@hey-amanthakur/chat-bot)
[![npm downloads](https://img.shields.io/npm/dm/@hey-amanthakur/chat-bot.svg?style=flat-square)](https://www.npmjs.com/package/@hey-amanthakur/chat-bot)
[![license](https://img.shields.io/npm/l/@hey-amanthakur/chat-bot.svg?style=flat-square)](./LICENSE)
[![types](https://img.shields.io/npm/types/@hey-amanthakur/chat-bot?style=flat-square)](https://www.npmjs.com/package/@hey-amanthakur/chat-bot)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)](./package.json)
[![node](https://img.shields.io/node/v/@hey-amanthakur/chat-bot?style=flat-square)](https://www.npmjs.com/package/@hey-amanthakur/chat-bot)

**Zero runtime dependencies · Per-client knowledge bases · Lead capture · Embeddable widget · JWT admin API · Express · Fastify · Koa · NestJS**

</div>

---

## Overview

**Chat-Box** is an embeddable AI chatbot for local businesses. Spin up a white-labeled chat widget for any number of businesses — dentists, salons, gyms — each with its own knowledge base, tone, and lead capture, all served by a single plain Node.js process with **zero runtime dependencies**. It ships a `<script>` tag widget, a programmatic ES-module widget, and drop-in adapters for the most popular Node frameworks.

### Highlights

| | |
| --- | --- |
| **Zero dependencies** | A plain Node.js server built on `node:http`, `node:crypto`, and global `fetch` — nothing to audit beyond Node itself. |
| **Embeddable widget** | A vanilla JS chat bubble configured by `data-*` attributes — drop in one `<script>` tag and it's done. |
| **Per-client knowledge bases** | Each business gets its own config, tone, greeting, services, hours, and FAQs. |
| **RAG on your data** | Relevant knowledge-base snippets are injected into the LLM prompt for grounded, business-specific answers. |
| **Lead capture** | Built-in intent detection recognizes booking/contact requests and routes visitors into a lead form. |
| **JWT admin API** | Create and update clients, list leads — secured with JWT (HS256) and password hashing. |
| **Framework adapters** | Drop-in mounting for [Express](#express), [Fastify](#fastify), [Koa](#koa), and [NestJS](#nestjs). |
| **Rate limiting** | Token-bucket limits per endpoint with safe defaults; admin writes are extra throttled. |
| **Input validation** | Zero-dependency validators on every route; 2,000-char messages and a 10 KB body cap. |
| **Dual widget builds** | A classic `<script>` bundle and an ES module for bundler-based sites. |

---

## Table of Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [How it works](#how-it-works)
- [Core API](#core-api)
  - [`ChatBot.start`](#chatbotstart)
  - [REST endpoints](#rest-endpoints)
  - [Chat request & response](#chat-request--response)
- [Configuration reference](#configuration-reference)
  - [`ChatBotConfig`](#chatbotconfig)
  - [`ClientConfig`](#clientconfig)
  - [Widget script attributes](#widget-script-attributes)
- [Framework adapters](#framework-adapters)
  - [Express](#express)
  - [Fastify](#fastify)
  - [Koa](#koa)
  - [NestJS](#nestjs)
- [Examples](#examples)
- [Node.js support](#nodejs-support)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Installation

```bash
npm install @hey-amanthakur/chat-bot
pnpm add    @hey-amanthakur/chat-bot
yarn add    @hey-amanthakur/chat-bot
```

Framework packages are **optional peer dependencies** — install only the one you use:

```bash
npm install express
npm install fastify
npm install koa
npm install @nestjs/common @nestjs/core reflect-metadata   # NestJS only
```

---

## Quick start

```ts
import { ChatBot } from '@hey-amanthakur/chat-bot';

const { app, url } = await ChatBot.start({
  port: 3000,
  openrouterKey: 'sk-or-v1-xxxxx',
  clients: {
    'my-business': {
      name: 'My Business',
      greeting: 'Hi! How can I help you today?',
      services: [
        { name: 'Consultation', price: '$50', description: 'Initial consultation' },
      ],
      hours: [
        { day: 'Monday', open: '9:00 AM', close: '5:00 PM' },
      ],
      faqs: [
        { question: 'Do you accept insurance?', answer: 'Yes, we accept most major plans.' },
      ],
    },
  },
});
```

Then add the widget to your HTML:

```html
<script
  src="http://localhost:3000/widgets/chat-widget.min.js"
  data-client-id="my-business"
  data-color="#2563eb"
  data-icon="🦷"
  data-header="Talk to us"
  data-position="bottom-right"
  data-greeting="Hi! How can I help you today?"
></script>
```

The chat bubble appears on your page. That's it.

---

## How it works

```
Page loads → Widget creates chat bubble
User types → POST /api/chat with clientId + message
Server loads client config (in-memory or from data/clients/)
Lead detection checks message intent
  → If lead detected → returns a contact prompt
  → Otherwise → sends to OpenRouter with the client's knowledge base
AI responds using only the client's data
Response rendered in widget with formatting
```

Each piece owns one concern:

- **Widget** owns the UI — bubble, header, message list, and input bar.
- **Chat service** owns the flow — lead detection first, then RAG + LLM.
- **RAG service** loads and injects the client's knowledge base.
- **Leads service** stores captured leads as JSON per client.
- **Admin service** manages client configs on disk.

---

## Core API

### `ChatBot.start`

```ts
import { ChatBot, type ChatBotConfig } from '@hey-amanthakur/chat-bot';

const config: ChatBotConfig = {
  port: 3000,
  openrouterKey: 'sk-or-v1-xxxxx',
  clients: {
    'dr-smith-dental': {
      name: 'Dr. Smith Dental',
      model: 'openai/gpt-4o',
      services: [
        { name: 'Teeth Cleaning', price: '$120', description: 'Professional cleaning' },
      ],
    },
  },
};

const { app, url } = await ChatBot.start(config);
```

| Returns | Description |
| --- | --- |
| `app` | The underlying `http.Server` — stop it with `app.close()`. |
| `url` | The bound base URL, e.g. `http://localhost:3000`. |

### REST endpoints

| Method | Endpoint | Rate Limit | Auth | Description |
| --- | --- | --- | --- | --- |
| POST | `/api/chat` | 20/min | - | Send a chat message |
| GET | `/api/health` | - | - | Health check |
| POST | `/api/leads` | 10/min | - | Submit a lead |
| GET | `/api/leads/:clientId` | - | - | List leads for a client |
| POST | `/api/admin/login` | 5/15min | - | Admin login (returns JWT) |
| GET | `/api/admin/clients` | 30/min | ✅ | List clients |
| POST | `/api/admin/clients` | 10/hour | ✅ | Create a client |
| PUT | `/api/admin/clients/:id` | 10/hour | ✅ | Update a client |

### Chat request & response

```bash
curl -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"clientId":"my-business","message":"How much is a consultation?","sessionId":"abc123"}'
```

```json
{
  "response": "A consultation is $50. Would you like to book one?",
  "lead_captured": false,
  "session_id": "abc123"
}
```

When lead intent is detected (booking, contact, pricing with follow-up, etc.), `lead_captured` is `true` and the response asks the visitor for their details — which you then submit to `POST /api/leads`:

```bash
curl -X POST http://localhost:3000/api/leads \
  -H 'Content-Type: application/json' \
  -d '{"clientId":"my-business","name":"Jane Doe","phone":"555-0100","reason":"Book a consultation","conversationId":"abc123"}'
```

---

## Configuration reference

### `ChatBotConfig`

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `openrouterKey` | `string` | **Yes** | - | OpenRouter API key from [openrouter.ai](https://openrouter.ai) |
| `clients` | `Record<string, ClientConfig>` | **Yes** | - | Client configurations keyed by client ID |
| `port` | `number` | No | `3000` | Server port |
| `openrouterBaseUrl` | `string` | No | `https://openrouter.ai/api/v1` | Custom OpenRouter endpoint |
| `allowedOrigins` | `string[]` | No | `*` in dev | CORS allowed origins for production |

### `ClientConfig`

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | **Yes** | Business name |
| `tone` | `string` | No | AI response tone (default: `"friendly"`) |
| `greeting` | `string` | No | Welcome message shown when the widget opens |
| `model` | `string` | No | OpenRouter model (default: `"inclusionai/ling-3.0-flash:free"`) |
| `max_tokens` | `number` | No | Max response tokens (default: `500`) |
| `business_info` | `object` | No | `{ address, phone, email }` |
| `services` | `Array` | No | `[{ name, price, description }]` |
| `hours` | `Array` | No | `[{ day, open, close }]` |
| `faqs` | `Array` | No | `[{ question, answer }]` |
| `policies` | `string[]` | No | Business policies |

Each client gets its own knowledge base and chat context — a single server can serve any number of businesses:

```html
<!-- Dr. Smith Dental's website -->
<script src="http://localhost:3000/widgets/chat-widget.min.js" data-client-id="dr-smith-dental"></script>

<!-- Style Studio's website -->
<script src="http://localhost:3000/widgets/chat-widget.min.js" data-client-id="style-studio-salon"></script>
```

### Widget script attributes

| Attribute | Required | Default | Description |
| --- | --- | --- | --- |
| `data-client-id` | **Yes** | - | Must match a key in your `clients` config |
| `data-api-url` | No | `http://localhost:3000` | Backend URL |
| `data-color` | No | `#2563eb` | Primary color for bubble, header, and user messages |
| `data-icon` | No | Chat bubble SVG | Emoji (`🦷`), image URL (`/logo.png`), or raw SVG string |
| `data-header` | No | `Chat with us` | Header title text |
| `data-position` | No | `bottom-right` | `top-left`, `top-right`, `bottom-left`, or `bottom-right` |
| `data-greeting` | No | - | Override the greeting message |

Programmatic usage (ES module build):

```ts
import ChatWidget from '@hey-amanthakur/chat-bot/widget.esm';

new ChatWidget({
  clientId: 'my-business',
  apiUrl: 'http://localhost:3000',
  primaryColor: '#e11d48',
  icon: '💬',
  headerTitle: 'Support Chat',
  position: 'top-right',
  greeting: 'Welcome! How can we help?',
});
```

Icon options:

```ts
icon: '🦷'                        // Emoji
icon: '/images/support-icon.png'  // Image URL
icon: '<svg ...>...</svg>'        // Raw SVG
// Default (no icon set) → chat bubble SVG
```

---

## Framework adapters

Adapters mount Chat-Box inside an existing app. Only `/api/` and `/widgets/` requests are handled by Chat-Box; everything else continues through your framework as usual. Config comes from the environment (`OPENROUTER_API_KEY`, `DATA_DIR`, etc.) and `data/clients/`.

### Express

```ts
import express from 'express';
import { useChatBot } from '@hey-amanthakur/chat-bot/express';

const app = express();

useChatBot(app);
app.listen(3000);
```

### Fastify

```ts
import Fastify from 'fastify';
import { useChatBot } from '@hey-amanthakur/chat-bot/fastify';

const app = Fastify({ logger: true });

useChatBot(app);
app.listen({ port: 3000 });
```

### Koa

```ts
import Koa from 'koa';
import { useChatBot } from '@hey-amanthakur/chat-bot/koa';

const app = new Koa();

useChatBot(app);
app.listen(3000);
```

### NestJS

```ts
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { useChatBot } from '@hey-amanthakur/chat-bot/nestjs';

@Module({})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  useChatBot(app);
  await app.listen(3000);
}

bootstrap();
```

---

## Examples

Runnable examples live in [`examples/`](./examples) — one per framework adapter. Build the package first, then run any example with `npx tsx`:

```bash
npm run build
npx tsx examples/express/index.ts   # mount Chat-Box in Express
npx tsx examples/fastify/index.ts   # mount Chat-Box in Fastify
npx tsx examples/koa/index.ts       # mount Chat-Box in Koa
npx tsx examples/nestjs/index.ts    # mount Chat-Box in NestJS
```

---

## Node.js support

Tested across the Node.js versions the industry currently runs and the newest line:

| Node line | Status | Supported |
| --- | --- | :---: |
| 20.x | EOL ~Apr 2026, still widely deployed | ✅ |
| 22.x | Active LTS | ✅ |
| 24.x | Active LTS (newest LTS) | ✅ |
| 26.x | Current | ✅ |

`engines.node: ">=20"`.

---

## Testing

```bash
npm test      # run the server test suite (node:test)
npm run build # build shared, server, and widget
npm run dev   # start the server in watch mode
npm run clean # remove all build artifacts and node_modules
```

The test suite covers routing, validation, rate limiting, JWT + bcrypt, the RAG loader, OpenRouter fallback, path resolution, and full server end-to-end flows.

---

## Contributing

Contributions are welcome and appreciated. Please read the [Contributing Guidelines](./CONTRIBUTING.md) before opening a pull request.

- **Bug reports & feature requests** → [open an issue](https://github.com/hey-amanthakur/chat-bot/issues/new/choose)
- **Pull requests** → target the `main` branch; include tests for any new behavior
- **Discussions & questions** → [start a discussion](https://github.com/hey-amanthakur/chat-bot/discussions)

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

---

## License

[MIT](./LICENSE) © 2026 [Aman Thakur](https://github.com/hey-amanthakur)
