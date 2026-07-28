import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get<string>(
      'OPENROUTER_BASE_URL',
      'https://openrouter.ai/api/v1',
    );
    this.apiKey = this.configService.get<string>('OPENROUTER_API_KEY', '');
  }

  buildSystemPrompt(kb: Record<string, any>): string {
    const businessName = kb.name || 'this business';
    const tone = kb.tone || 'friendly';
    const greeting =
      kb.greeting || `Hi! Welcome to ${businessName}. How can I help you today?`;

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

When the customer asks a question, provide a helpful answer based on this information. If you cannot answer, offer to connect them with the team.`;
  }

  async chatCompletion(
    message: string,
    clientId: string,
    kb: Record<string, any> = {},
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(kb);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/chat/completions`,
          {
            model: kb.model || 'inclusionai/ling-3.0-flash:free',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
            ],
            max_tokens: kb.max_tokens || 500,
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://chat-bot.example.com',
              'X-Title': 'Business Chatbot',
            },
            timeout: 30000,
          },
        ),
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      if (error?.response) {
        this.logger.error(
          `OpenRouter HTTP error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        );
        return "I'm experiencing a temporary issue. Please try again in a moment.";
      }
      this.logger.error(`OpenRouter error: ${error?.message || error}`);
      return "I'm having trouble connecting right now. Please try again later.";
    }
  }
}
