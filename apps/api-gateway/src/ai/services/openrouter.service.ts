import { getEnv } from '../../config';

export interface OpenRouterDeps {
  baseUrl?: string;
  apiKey?: string;
  fetchFn?: typeof fetch;
}

const DEFAULT_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';
const FALLBACK_MODELS = [
  'google/gemma-2-9b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'microsoft/phi-3-mini-128k-instruct:free',
];
const DEFAULT_MAX_TOKENS = 500;
const REQUEST_TIMEOUT_MS = 30000;

export class OpenRouterService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchFn: typeof fetch;

  constructor(deps: OpenRouterDeps = {}) {
    const env = getEnv();
    this.baseUrl = deps.baseUrl ?? env.openrouterBaseUrl;
    this.apiKey = deps.apiKey ?? env.openrouterApiKey;
    this.fetchFn = deps.fetchFn ?? globalThis.fetch;
  }

  buildSystemPrompt(kb: Record<string, any> = {}): string {
    const businessName = kb.name || 'this business';
    const tone = kb.tone || 'friendly';
    const greeting = kb.greeting || `Hi! Welcome to ${businessName}. How can I help you today?`;

    const servicesText = (kb.services || [])
      .map((s: any) => `- ${s.name}: ${s.price} (${s.description})`)
      .join('\n');

    const hoursText = (kb.hours || [])
      .map((h: any) => `- ${h.day}: ${h.open} - ${h.close}`)
      .join('\n');

    const faqsText = (kb.faqs || [])
      .map((faq: any) => `Q: ${faq.question}\nA: ${faq.answer}`)
      .join('\n\n');

    const policiesText = (kb.policies || []).map((p: string) => `- ${p}`).join('\n');

    return `You are a helpful customer service assistant for ${businessName}.

IMPORTANT RULES:
1. ONLY answer questions using the information provided below. Do NOT make up information.
2. If you don't know the answer or the information isn't provided, say "I'm not sure about that, but I'd be happy to connect you with our team who can help."
3. Keep responses concise and conversational.
4. Be ${tone} in tone.
5. If the customer seems to need help beyond FAQs (booking, pricing, emergencies), encourage them to contact the business directly.
6. Never share internal business details, pricing strategies, or competitor comparisons.

GREETING: ${greeting}

BUSINESS INFORMATION:
Name: ${businessName}
Address: ${kb.business_info?.address || 'N/A'}
Phone: ${kb.business_info?.phone || 'N/A'}
Email: ${kb.business_info?.email || 'N/A'}

SERVICES:
${servicesText}

HOURS:
${hoursText}

FAQS:
${faqsText}

POLICIES:
${policiesText}

ADDITIONAL KNOWLEDGE BASE:
${kb.knowledge_text || 'No additional knowledge base information available.'}

When the customer asks a question, provide a helpful answer based on this information. If you cannot answer, offer to connect them with the team.`;
  }

  async chatCompletion(
    message: string,
    _clientId: string,
    kb: Record<string, any> = {},
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(kb);
    const models = kb.model ? [kb.model, ...FALLBACK_MODELS] : [DEFAULT_MODEL, ...FALLBACK_MODELS];

    for (const model of models) {
      try {
        const response = await this.fetchFn(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://chat-bot.example.com',
            'X-Title': 'Business Chatbot',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
            ],
            max_tokens: kb.max_tokens || DEFAULT_MAX_TOKENS,
            temperature: 0.7,
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        if (!response.ok) {
          const detail = await response.text().catch(() => '');
          console.error(`OpenRouter HTTP error (${model}): ${response.status} - ${detail}`);
          
          // Retry on 429 (Rate Limit), 404 (Not Found), 500+ (Server Errors)
          const retryable = response.status === 429 || response.status === 404 || response.status >= 500;
          if (retryable && models.indexOf(model) < models.length - 1) {
            continue;
          }
          return "I'm experiencing a temporary issue. Please try again in a moment.";
        }

        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        return data.choices?.[0]?.message?.content ?? '';
      } catch (error) {
        console.error(`OpenRouter error (${model}): ${error instanceof Error ? error.message : String(error)}`);
        if (models.indexOf(model) < models.length - 1) {
          continue;
        }
        return "I'm having trouble connecting right now. Please try again later.";
      }
    }

    return "I'm having trouble connecting right now. Please try again later.";
  }
}
