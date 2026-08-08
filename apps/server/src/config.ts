import * as fs from 'fs';
import * as path from 'path';

export interface Env {
  port: number;
  nodeEnv: string;
  adminEmail: string;
  adminPasswordHash: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  openrouterApiKey: string;
  openrouterBaseUrl: string;
  allowedOrigins: string[] | null;
  dataDir: string | null;
  leadsDataDir: string | null;
}

export function loadDotEnv(cwd = process.cwd()): void {
  const file = path.join(cwd, '.env');
  if (!fs.existsSync(file)) return;

  const content = fs.readFileSync(file, 'utf-8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export function getEnv(): Env {
  const originsRaw = process.env.ALLOWED_ORIGINS;
  return {
    port: Number(process.env.PORT || 3000),
    nodeEnv: process.env.NODE_ENV || 'development',
    adminEmail: process.env.ADMIN_EMAIL || '',
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
    openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    allowedOrigins: originsRaw
      ? originsRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null,
    dataDir: process.env.DATA_DIR || null,
    leadsDataDir: process.env.LEADS_DATA_DIR || null,
  };
}
