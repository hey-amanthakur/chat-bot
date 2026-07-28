import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_KB = {
  name: 'Business',
  tone: 'friendly',
  greeting: 'Hi! How can I help you today?',
  business_info: {},
  services: [],
  faqs: [],
  policies: [],
  hours: [],
};

@Injectable()
export class RagService {
  private readonly dataDir: string;

  constructor(private readonly configService: ConfigService) {
    this.dataDir =
      this.configService.get<string>('DATA_DIR') ||
      path.join(process.cwd(), '..', '..', 'data', 'clients');
  }

  async getKnowledgeBase(clientId: string): Promise<Record<string, any>> {
    const clientDir = path.join(this.dataDir, clientId);

    if (!fs.existsSync(clientDir)) {
      return { ...DEFAULT_KB };
    }

    const configFile = path.join(clientDir, 'config.json');
    if (fs.existsSync(configFile)) {
      const raw = fs.readFileSync(configFile, 'utf-8');
      return JSON.parse(raw);
    }

    return { ...DEFAULT_KB };
  }

  retrieveContext(kb: Record<string, any>, query: string): string {
    const contextParts: string[] = [];

    if (kb.services?.length) {
      const services = kb.services
        .map((s: any) => `- ${s.name}: ${s.price || 'N/A'} - ${s.description || ''}`)
        .join('\n');
      contextParts.push(`SERVICES:\n${services}`);
    }

    if (kb.faqs?.length) {
      const faqs = kb.faqs
        .map((f: any) => `Q: ${f.question}\nA: ${f.answer}`)
        .join('\n');
      contextParts.push(`FAQS:\n${faqs}`);
    }

    if (kb.hours?.length) {
      const hours = kb.hours
        .map((h: any) => `- ${h.day}: ${h.open} - ${h.close}`)
        .join('\n');
      contextParts.push(`HOURS:\n${hours}`);
    }

    if (kb.policies?.length) {
      const policies = kb.policies.map((p: string) => `- ${p}`).join('\n');
      contextParts.push(`POLICIES:\n${policies}`);
    }

    return contextParts.length ? contextParts.join('\n\n') : 'No business information available.';
  }
}
