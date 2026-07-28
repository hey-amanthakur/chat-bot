import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

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

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);
  private readonly dataDir = path.join(process.cwd(), '..', '..', 'data', 'leads');

  constructor() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async createLead(data: {
    clientId: string;
    name: string;
    email?: string;
    phone?: string;
    reason: string;
    conversationId: string;
  }): Promise<Lead> {
    const lead: Lead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      ...data,
      createdAt: new Date().toISOString(),
    };

    const clientLeadsFile = path.join(this.dataDir, `${data.clientId}.json`);
    let leads: Lead[] = [];
    if (fs.existsSync(clientLeadsFile)) {
      leads = JSON.parse(fs.readFileSync(clientLeadsFile, 'utf-8')) as Lead[];
    }
    leads.push(lead);
    fs.writeFileSync(clientLeadsFile, JSON.stringify(leads, null, 2));

    this.logger.log(`Lead captured: ${lead.id} for client ${data.clientId}`);

    return lead;
  }

  async getLeads(clientId: string): Promise<Lead[]> {
    const clientLeadsFile = path.join(this.dataDir, `${clientId}.json`);
    if (!fs.existsSync(clientLeadsFile)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(clientLeadsFile, 'utf-8')) as Lead[];
  }
}
