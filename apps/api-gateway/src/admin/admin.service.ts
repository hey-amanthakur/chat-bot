import * as fs from 'fs';
import * as path from 'path';
import { FsLike } from '../ai/services/rag.service';
import { HttpError } from '../http/errors';

export interface CreateClientInput {
  name: string;
  slug: string;
  tone?: string;
  leadCaptureEnabled?: boolean;
  leadNotificationMethod?: string;
}

export interface UpdateClientInput {
  name?: string;
  tone?: string;
  leadCaptureEnabled?: boolean;
  leadNotificationMethod?: string;
}

export interface AdminDeps {
  dataDir?: string;
  fs?: FsLike;
}

export class AdminService {
  private readonly dataDir: string;
  private readonly fs: FsLike;

  constructor(deps: AdminDeps = {}) {
    this.dataDir =
      deps.dataDir ??
      process.env.DATA_DIR ??
      path.join(process.cwd(), '..', '..', 'data', 'clients');
    this.fs = deps.fs ?? fs;
  }

  async getClients(): Promise<{ clients: Array<Record<string, unknown>> }> {
    if (!this.fs.existsSync(this.dataDir)) return { clients: [] };

    const entries = this.fs
      .readdirSync(this.dataDir, { withFileTypes: true })
      .filter((e) => e.isDirectory());

    return {
      clients: entries.map((entry) => {
        const configFile = path.join(this.dataDir, entry.name, 'config.json');
        let config: Record<string, unknown> = {};
        if (this.fs.existsSync(configFile)) {
          try {
            config = JSON.parse(this.fs.readFileSync(configFile, 'utf-8'));
          } catch {
            config = {};
          }
        }
        return { slug: entry.name, ...config };
      }),
    };
  }

  async createClient(data: CreateClientInput): Promise<Record<string, unknown>> {
    const clientDir = path.join(this.dataDir, data.slug);
    if (this.fs.existsSync(clientDir)) {
      throw new HttpError(409, `Client "${data.slug}" already exists`);
    }

    this.fs.mkdirSync(clientDir, { recursive: true });
    const config = {
      name: data.name,
      slug: data.slug,
      tone: data.tone ?? 'friendly',
      lead_capture_enabled: data.leadCaptureEnabled ?? true,
      lead_notification_method: data.leadNotificationMethod ?? 'email',
    };
    this.fs.writeFileSync(path.join(clientDir, 'config.json'), JSON.stringify(config, null, 2));

    return { id: data.slug, ...config };
  }

  async updateClient(id: string, data: UpdateClientInput): Promise<Record<string, unknown>> {
    const clientDir = path.join(this.dataDir, id);
    const configFile = path.join(clientDir, 'config.json');

    if (!this.fs.existsSync(clientDir) || !this.fs.existsSync(configFile)) {
      throw new HttpError(404, `Client "${id}" not found`);
    }

    const existing = JSON.parse(this.fs.readFileSync(configFile, 'utf-8')) as Record<
      string,
      unknown
    >;

    const merged: Record<string, unknown> = { ...existing };
    if (data.name !== undefined) merged.name = data.name;
    if (data.tone !== undefined) merged.tone = data.tone;
    if (data.leadCaptureEnabled !== undefined)
      merged.lead_capture_enabled = data.leadCaptureEnabled;
    if (data.leadNotificationMethod !== undefined) {
      merged.lead_notification_method = data.leadNotificationMethod;
    }

    this.fs.writeFileSync(configFile, JSON.stringify(merged, null, 2));

    return { id, ...merged };
  }
}
