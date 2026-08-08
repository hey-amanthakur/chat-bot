import * as crypto from 'crypto';

export interface JwtPayload {
  [key: string]: unknown;
  sub?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export function signJwt(
  payload: JwtPayload,
  secret: string,
  expiresInSeconds: number,
  now: () => number = Date.now,
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(now() / 1000);
  const body: JwtPayload = { ...payload, iat, exp: iat + expiresInSeconds };

  const headerPart = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadPart = Buffer.from(JSON.stringify(body)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerPart}.${payloadPart}`)
    .digest('base64url');

  return `${headerPart}.${payloadPart}.${signature}`;
}

export function verifyJwt(
  token: string,
  secret: string,
  now: () => number = Date.now,
): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${headerPart}.${payloadPart}`)
    .digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(signaturePart, 'base64url');
  } catch {
    return null;
  }
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return null;
  }

  let payload: JwtPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }

  if (typeof payload.exp !== 'number' || payload.exp * 1000 <= now()) return null;
  return payload;
}

const UNIT_MS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
  w: 7 * 24 * 60 * 60,
};

export function parseExpiresIn(value: string, fallbackSeconds = 24 * 60 * 60): number {
  const match = /^(\d+)\s*(s|m|h|d|w)?$/i.exec(value.trim());
  if (!match) return fallbackSeconds;
  const amount = Number(match[1]);
  const unit = (match[2] || 's').toLowerCase();
  return amount * (UNIT_MS[unit] || 1);
}
