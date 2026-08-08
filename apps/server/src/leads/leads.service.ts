import * as fs from 'fs';
import * as path from 'path';
import { FsLike } from '../ai/services/rag.service';
import { dataLeadsDir } from '../paths';

export interface Lead {
  id: string;
  clientId: string;
  name: string;
  email?: string;
  phone?: string;
  reason: string;
  conversationId: string;
  createdAt: string;
}

export interface LeadInput {
  clientId: string;
  name: string;
  email?: string;
  phone?: string;
  reason: string;
  conversationId: string;
}

export interface LeadsDeps {
  dataDir?: string;
  fs?: FsLike;
}

export class LeadsService {
  private readonly dataDir: string;
  private readonly fs: FsLike;

  constructor(deps: LeadsDeps = {}) {
    this.dataDir = deps.dataDir ?? dataLeadsDir();
    this.fs = deps.fs ?? fs;

    if (!this.fs.existsSync(this.dataDir)) {
      this.fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async createLead(data: LeadInput): Promise<Lead> {
    const lead: Lead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      ...data,
      createdAt: new Date().toISOString(),
    };

    const clientLeadsFile = path.join(this.dataDir, `${data.clientId}.json`);
    let leads: Lead[] = [];
    if (this.fs.existsSync(clientLeadsFile)) {
      leads = JSON.parse(this.fs.readFileSync(clientLeadsFile, 'utf-8')) as Lead[];
    }
    leads.push(lead);
    this.fs.writeFileSync(clientLeadsFile, JSON.stringify(leads, null, 2));

    console.log(`Lead captured: ${lead.id} for client ${data.clientId}`);

    return lead;
  }

  async getLeads(clientId: string): Promise<Lead[]> {
    const clientLeadsFile = path.join(this.dataDir, `${clientId}.json`);
    if (!this.fs.existsSync(clientLeadsFile)) {
      return [];
    }
    return JSON.parse(this.fs.readFileSync(clientLeadsFile, 'utf-8')) as Lead[];
  }
}
