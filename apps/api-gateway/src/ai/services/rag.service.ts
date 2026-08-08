import * as fs from 'fs';
import * as path from 'path';
import { dataClientsDir } from '../../paths';

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
    this.dataDir = deps.dataDir ?? dataClientsDir();
    this.fs = deps.fs ?? fs;
  }

  setClients(clients: Record<string, Record<string, any>>): void {
    this.memoryClients = clients;
  }

  getKnowledgeBase(clientId: string): Record<string, any> {
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
      const kb = JSON.parse(raw) as Record<string, any>;

      const knowledgeFile = path.join(clientDir, 'knowledge.md');
      if (this.fs.existsSync(knowledgeFile)) {
        kb.knowledge_text = this.fs.readFileSync(knowledgeFile, 'utf-8');
      }

      return kb;
    }

    return { ...DEFAULT_KB };
  }

}

