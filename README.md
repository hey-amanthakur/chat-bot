# @chat-bot/chat-widget

Embeddable AI chat widget for local businesses. Install, configure, done.

## Install

```bash
npm install @chat-bot/chat-widget
```

## Usage

```js
import { ChatBot } from '@chat-bot/chat-widget';

ChatBot.start({
  port: 3000,
  openrouterKey: 'sk-or-v1-xxxxx',
  clients: {
    'my-business': {
      name: 'My Business',
      tone: 'friendly',
      greeting: 'Hi! How can I help you today?',
      business_info: {
        address: '123 Main St, Anytown',
        phone: '(555) 123-4567',
        email: 'hello@mybusiness.com',
      },
      services: [
        { name: 'Consultation', price: '$50', description: 'Initial consultation' },
        { name: 'Follow-up', price: '$30', description: 'Follow-up visit' },
      ],
      hours: [
        { day: 'Monday', open: '9:00 AM', close: '5:00 PM' },
        { day: 'Tuesday', open: '9:00 AM', close: '5:00 PM' },
        { day: 'Wednesday', open: '9:00 AM', close: '5:00 PM' },
      ],
      faqs: [
        { question: 'Do you accept insurance?', answer: 'Yes, we accept most major insurance plans.' },
        { question: 'Do you offer emergency appointments?', answer: 'Yes, call us for same-day availability.' },
      ],
      policies: [
        'Please arrive 10 minutes before your appointment',
        '24-hour cancellation notice required',
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

## Multiple Clients

Add as many clients as you need:

```js
ChatBot.start({
  port: 3000,
  openrouterKey: 'sk-or-v1-xxxxx',
  clients: {
    'dr-smith-dental': {
      name: 'Dr. Smith Dental',
      services: [
        { name: 'Teeth Cleaning', price: '$120', description: 'Professional cleaning' },
      ],
      // ...
    },
    'style-studio-salon': {
      name: 'Style Studio Salon',
      services: [
        { name: 'Haircut', price: '$45', description: 'Professional haircut' },
      ],
      // ...
    },
  },
});
```

Each client gets their own knowledge base and chat context. Use the client ID in the widget:

```html
<!-- Dr. Smith Dental's website -->
<script src="http://localhost:3000/widgets/chat-widget.min.js" data-client-id="dr-smith-dental"></script>

<!-- Style Studio's website -->
<script src="http://localhost:3000/widgets/chat-widget.min.js" data-client-id="style-studio-salon"></script>
```

## ES Module Usage

```js
import ChatWidget from '@chat-bot/chat-widget/widget.esm';

new ChatWidget({
  clientId: 'my-business',
  apiUrl: 'http://localhost:3000',
  primaryColor: '#e11d48',
  icon: '💬',
  headerTitle: 'Support Chat',
  position: 'bottom-left',
  greeting: 'Welcome! How can we help?',
});
```

### Icon Options

```js
// Emoji
icon: '🦷'

// Image URL
icon: '/images/support-icon.png'
icon: 'https://example.com/chat-icon.svg'

// Raw SVG
icon: '<svg width="28" height="28" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="white"/></svg>'

// Default (no icon set) → chat bubble SVG
```

## API Endpoints

The server exposes these endpoints:

| Method | Endpoint | Rate Limit | Description |
|--------|----------|------------|-------------|
| POST | `/api/chat` | 20/min | Send a chat message |
| GET | `/api/health` | - | Health check |
| POST | `/api/leads` | 10/min | Submit a lead |
| GET | `/api/leads/:clientId` | - | Get leads for a client |

## How It Works

```
Your page loads
  → Widget script creates chat bubble
  → User types a message
  → Widget sends POST /api/chat with clientId + message
  → Server loads client config (in-memory)
  → Lead detection checks message intent
  → If lead detected → returns contact prompt
  → Otherwise → sends to OpenRouter with client's knowledge base
  → AI responds using only the client's data (services, hours, FAQs, policies)
  → Response rendered in widget with formatting
```

## Security

- **API key stays server-side** — never reaches the browser
- **Rate limiting** on all endpoints
- **Input validation** — max 2000 chars for messages, 10KB body limit
- **CORS** configurable per deployment
- **No database required** — client data lives in memory

## Development

```bash
git clone https://github.com/chat-bot/chat-bot.git
cd chat-bot
npm install
npm run dev
```

### Commands

```bash
npm run dev          # Start the server
npm run build        # Build all packages
npm run lint         # Lint all packages
npm test             # Run unit tests
```

### Running Tests

```bash
cd apps/api-gateway

# Unit tests
npm test

# E2E tests
npx jest --config jest-e2e.config.js
```

## Tech Stack

- **Server:** NestJS
- **Widget:** Vanilla TypeScript + Rollup
- **LLM:** OpenRouter (any model)
- **Auth:** JWT + bcrypt
- **Rate Limiting:** @nestjs/throttler
- **Validation:** class-validator
- **Build:** Turborepo
