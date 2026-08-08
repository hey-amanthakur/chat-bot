# @hey-amanthakur/chat-bot

Embeddable AI chatbot for local businesses. Install, configure, done.

[![npm](https://img.shields.io/npm/v/@hey-amanthakur/chat-bot)](https://www.npmjs.com/package/@hey-amanthakur/chat-bot)
[![license](https://img.shields.io/npm/l/@hey-amanthakur/chat-bot)](https://github.com/hey-amanthakur/chat-bot/blob/master/LICENSE)

## Install

```bash
npm install @hey-amanthakur/chat-bot
```

## Quick Start

```js
import { ChatBot } from '@hey-amanthakur/chat-bot';

ChatBot.start({
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

## Configuration

### `ChatBot.start()` Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `port` | `number` | No | `3000` | Server port |
| `openrouterKey` | `string` | **Yes** | - | OpenRouter API key from [openrouter.ai](https://openrouter.ai) |
| `openrouterBaseUrl` | `string` | No | `https://openrouter.ai/api/v1` | Custom OpenRouter endpoint |
| `clients` | `Record<string, ClientConfig>` | **Yes** | - | Client configurations keyed by client ID |
| `allowedOrigins` | `string[]` | No | `*` in dev | CORS allowed origins for production |

### `ClientConfig` Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | `string` | **Yes** | Business name |
| `tone` | `string` | No | AI response tone (default: `"friendly"`) |
| `greeting` | `string` | No | Welcome message shown when widget opens |
| `model` | `string` | No | OpenRouter model (default: `"inclusionai/ling-3.0-flash:free"`) |
| `max_tokens` | `number` | No | Max response tokens (default: `500`) |
| `business_info` | `object` | No | `{ address, phone, email }` |
| `services` | `Array` | No | `[{ name, price, description }]` |
| `hours` | `Array` | No | `[{ day, open, close }]` |
| `faqs` | `Array` | No | `[{ question, answer }]` |
| `policies` | `string[]` | No | Business policies |

### Widget Script Attributes

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `data-client-id` | **Yes** | - | Must match a key in your `clients` config |
| `data-api-url` | No | `http://localhost:3000` | Backend URL |
| `data-color` | No | `#2563eb` | Primary color for bubble, header, and user messages |
| `data-icon` | No | Chat bubble SVG | Emoji (`🦷`), image URL (`/logo.png`), or raw SVG string |
| `data-header` | No | `Chat with us` | Header title text |
| `data-position` | No | `bottom-right` | `top-left`, `top-right`, `bottom-left`, or `bottom-right` |
| `data-greeting` | No | - | Override the greeting message |

## ES Module Usage

```js
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

### Icon Options

```js
// Emoji
icon: '🦷'

// Image URL
icon: '/images/support-icon.png'

// Raw SVG
icon: '<svg width="28" height="28" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="white"/></svg>'

// Default (no icon set) → chat bubble SVG
```

## Multiple Clients

```js
ChatBot.start({
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
    'style-studio-salon': {
      name: 'Style Studio Salon',
      services: [
        { name: 'Haircut', price: '$45', description: 'Professional haircut' },
      ],
    },
  },
});
```

Each client gets their own knowledge base and chat context:

```html
<!-- Dr. Smith Dental's website -->
<script src="http://localhost:3000/widgets/chat-widget.min.js" data-client-id="dr-smith-dental"></script>

<!-- Style Studio's website -->
<script src="http://localhost:3000/widgets/chat-widget.min.js" data-client-id="style-studio-salon"></script>
```

## How It Works

```
Page loads → Widget creates chat bubble
User types → POST /api/chat with clientId + message
Server loads client config (in-memory)
Lead detection checks message intent
  → If lead detected → returns contact prompt
  → Otherwise → sends to OpenRouter with client's knowledge base
AI responds using only the client's data
Response rendered in widget with formatting
```

## API Endpoints

| Method | Endpoint | Rate Limit | Description |
|--------|----------|------------|-------------|
| POST | `/api/chat` | 20/min | Send a chat message |
| GET | `/api/health` | - | Health check |
| POST | `/api/leads` | 10/min | Submit a lead |
| GET | `/api/leads/:clientId` | - | Get leads for a client |
| POST | `/api/admin/login` | 5/15min | Admin login (returns JWT) |
| GET | `/api/admin/clients` | 30/min | List clients (auth) |
| POST | `/api/admin/clients` | 10/hour | Create a client (auth) |
| PUT | `/api/admin/clients/:id` | 10/hour | Update a client (auth) |

## Security

- **API key stays server-side** — never reaches the browser
- **Rate limiting** on all endpoints
- **Input validation** — max 2000 chars, 10KB body limit
- **CORS** configurable per deployment
- **JWT auth** for admin endpoints (HS256, bcrypt password verification)
- **No database required** — client configs load from memory or `data/clients/`

## Development

```bash
git clone https://github.com/hey-amanthakur/chat-bot.git
cd chat-bot
npm install
npm run build
npm run dev
```

### Project Structure

```
apps/
  server/         # Node.js server (zero-dependency core)
packages/
  widget/         # Embeddable JS widget (TypeScript + Rollup)
  shared/         # Common types and logic
data/             # Client knowledge bases (JSON/Markdown)
examples/         # Integration examples (Express, Fastify, etc.)
```

### Commands

```bash
npm run build        # Build shared, server, and widget
npm run dev          # Start the server in watch mode
npm test             # Run test suites in the server workspace
npm run clean        # Remove all build artifacts and node_modules
```

## Tech Stack

- **Monorepo:** npm Workspaces
- **Server:** Plain Node.js (`node:http`, `node:crypto`, global `fetch`)
- **Widget:** Vanilla TypeScript + Rollup
- **LLM:** OpenRouter (any model)
- **Auth:** JWT (HS256) + bcrypt
- **Rate Limiting:** In-memory token bucket
- **Validation:** Custom zero-dependency validators
- **Tests:** `node:test` (70 tests)
- **Runtime dependencies:** none (zero — dev/build deps only)

## License

MIT
