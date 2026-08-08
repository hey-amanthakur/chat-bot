import type { IncomingMessage } from 'http';
import { HttpError } from './errors';
import type { RouteContext } from './types';
import type { Env } from '../config';

const MAX_BODY_BYTES = 10 * 1024;

export function isCorsAllowed(env: Env, origin: string): boolean {
  if (env.allowedOrigins) return env.allowedOrigins.includes(origin);
  return env.nodeEnv !== 'production';
}

export function applyCorsHeaders(ctx: RouteContext, env: Env): void {
  const { origin } = ctx;
  if (!origin) return;

  if (!isCorsAllowed(env, origin)) return;

  ctx.res.setHeader('Access-Control-Allow-Origin', origin);
  ctx.res.setHeader('Vary', 'Origin');
  ctx.res.setHeader('Access-Control-Allow-Credentials', 'true');
  ctx.res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  ctx.res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  ctx.res.setHeader('Access-Control-Max-Age', '86400');
}

export async function readJsonBody(ctx: RouteContext): Promise<void> {
  if (ctx.method === 'GET' || ctx.method === 'HEAD') {
    ctx.body = {};
    return;
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of ctx.req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new HttpError(413, 'Payload too large');
    }
    chunks.push(chunk as Buffer);
  }

  const raw = Buffer.concat(chunks).toString('utf-8');
  if (!raw.trim()) {
    ctx.body = {};
    return;
  }
  try {
    ctx.body = JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'Invalid JSON body');
  }
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

export class RateLimiter {
  private windows = new Map<string, { count: number; resetAt: number }>();

  check(key: string, limit: number, ttlMs: number, now = Date.now()): RateLimitResult {
    const entry = this.windows.get(key);

    if (!entry || now >= entry.resetAt) {
      this.windows.set(key, { count: 1, resetAt: now + ttlMs });
      this.prune(now);
      return { allowed: true, retryAfterMs: 0 };
    }

    if (entry.count >= limit) {
      return { allowed: false, retryAfterMs: entry.resetAt - now };
    }

    entry.count++;
    return { allowed: true, retryAfterMs: 0 };
  }

  private prune(now: number): void {
    if (this.windows.size < 10000) return;
    for (const [key, entry] of this.windows) {
      if (now >= entry.resetAt) this.windows.delete(key);
    }
  }
}

export function extractBearerToken(req: IncomingMessage): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}
