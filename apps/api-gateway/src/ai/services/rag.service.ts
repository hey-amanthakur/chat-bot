import * as fs from 'fs';
import * as path from 'path';

export type FsLike = Pick<
  typeof fs,
  'existsSync' | 'readFileSync' | 'writeFileSync' | 'mkdirSync' | 'readdirSync' | 'statSync'
>;

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

export interface RagDeps {
  dataDir?: string;
  fs?: FsLike;
}

export class RagService {
  private readonly dataDir: string;
  private readonly fs: FsLike;
  private memoryClients: Record<string, Record<string, any>> = {};

  constructor(deps: RagDeps = {}) {
    this.dataDir =
      deps.dataDir ??
      process.env.DATA_DIR ??
      path.join(process.cwd(), '..', '..', 'data', 'clients');
    this.fs = deps.fs ?? fs;
  }

  setClients(clients: Record<string, Record<string, any>>): void {
    this.memoryClients = clients;
  }

  async getKnowledgeBase(clientId: string): Promise<Record<string, any>> {
    if (this.memoryClients[clientId]) {
      return this.memoryClients[clientId];
    }

    const clientDir = path.join(this.dataDir, clientId);

    if (!this.fs.existsSync(clientDir)) {
      return { ...DEFAULT_KB };
    }

    const configFile = path.join(clientDir, 'config.json');
    if (this.fs.existsSync(configFile)) {
      const raw = this.fs.readFileSync(configFile, 'utf-8');
      return JSON.parse(raw) as Record<string, any>;
    }

    return { ...DEFAULT_KB };
  }

  retrieveContext(kb: Record<string, any>, _query: string): string {
    const contextParts: string[] = [];

    if (kb.services?.length) {
      const services = kb.services
        .map((s: any) => `- ${s.name}: ${s.price || 'N/A'} - ${s.description || ''}`)
        .join('\n');
      contextParts.push(`SERVICES:\n${services}`);
    }

    if (kb.faqs?.length) {
      const faqs = kb.faqs.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join('\n');
      contextParts.push(`FAQS:\n${faqs}`);
    }

    if (kb.hours?.length) {
      const hours = kb.hours.map((h: any) => `- ${h.day}: ${h.open} - ${h.close}`).join('\n');
      contextParts.push(`HOURS:\n${hours}`);
    }

    if (kb.policies?.length) {
      const policies = kb.policies.map((p: string) => `- ${p}`).join('\n');
      contextParts.push(`POLICIES:\n${policies}`);
    }

    return contextParts.length ? contextParts.join('\n\n') : 'No business information available.';
  }
}
