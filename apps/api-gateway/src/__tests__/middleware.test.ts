import { test } from 'node:test';
import * as assert from 'node:assert';
import { isCorsAllowed, extractBearerToken, readJsonBody } from '../http/middleware';
import type { Env } from '../config';
import { HttpError } from '../http/errors';

const baseEnv: Env = {
  port: 3000,
  nodeEnv: 'production',
  adminEmail: 'a@b.com',
  adminPasswordHash: 'x',
  jwtSecret: 's',
  jwtExpiresIn: '1h',
  openrouterApiKey: 'k',
  openrouterBaseUrl: 'http://x',
  allowedOrigins: ['https://allowed.example.com'],
  dataDir: null,
  leadsDataDir: null,
};

test('isCorsAllowed allows all origins outside production when no allowlist is set', () => {
  const devEnv = { ...baseEnv, nodeEnv: 'development', allowedOrigins: null };
  assert.strictEqual(isCorsAllowed(devEnv, 'https://anything.example'), true);
});

test('isCorsAllowed enforces an explicit allowlist even in development', () => {
  const devEnv = { ...baseEnv, nodeEnv: 'development' };
  assert.strictEqual(isCorsAllowed(devEnv, 'https://allowed.example.com'), true);
  assert.strictEqual(isCorsAllowed(devEnv, 'https://evil.example.com'), false);
});

test('isCorsAllowed restricts to allowed origins in production', () => {
  assert.strictEqual(isCorsAllowed(baseEnv, 'https://allowed.example.com'), true);
  assert.strictEqual(isCorsAllowed(baseEnv, 'https://evil.example.com'), false);
});

test('isCorsAllowed denies everything in production with no allowlist', () => {
  const noOrigins = { ...baseEnv, allowedOrigins: [] };
  assert.strictEqual(isCorsAllowed(noOrigins, 'https://allowed.example.com'), false);
  const nullOrigins = { ...baseEnv, allowedOrigins: null };
  assert.strictEqual(isCorsAllowed(nullOrigins, 'https://allowed.example.com'), false);
});

test('extractBearerToken parses the Authorization header', () => {
  assert.strictEqual(
    extractBearerToken({ headers: { authorization: 'Bearer abc.def' } } as any),
    'abc.def',
  );
  assert.strictEqual(extractBearerToken({ headers: { authorization: 'Bearer ' } } as any), null);
  assert.strictEqual(extractBearerToken({ headers: {} } as any), null);
  assert.strictEqual(
    extractBearerToken({ headers: { authorization: 'Basic dXNlcjpwYXNz' } } as any),
    null,
  );
});

test('readJsonBody rejects oversized payloads', async () => {
  const big = JSON.stringify({ message: 'x'.repeat(11 * 1024) });
  let seen: Error | null = null;
  const ctx = {
    method: 'POST',
    req: {
      [Symbol.asyncIterator]() {
        let sent = false;
        return {
          next: () => {
            if (sent) return Promise.resolve({ done: true, value: undefined });
            sent = true;
            return Promise.resolve({ done: false, value: Buffer.from(big) });
          },
        };
      },
    },
    body: undefined,
  } as any;
  try {
    await readJsonBody(ctx);
  } catch (e) {
    seen = e as Error;
  }
  assert.ok(seen instanceof HttpError);
  assert.strictEqual((seen as HttpError).status, 413);
});

test('readJsonBody rejects invalid JSON', async () => {
  const ctx = {
    method: 'POST',
    req: {
      [Symbol.asyncIterator]() {
        let sent = false;
        return {
          next: () => {
            if (sent) return Promise.resolve({ done: true, value: undefined });
            sent = true;
            return Promise.resolve({ done: false, value: Buffer.from('{not json') });
          },
        };
      },
    },
    body: undefined,
  } as any;
  await assert.rejects(
    () => readJsonBody(ctx),
    (e: unknown) => e instanceof HttpError && e.status === 400,
  );
});

test('readJsonBody parses valid JSON', async () => {
  const ctx = {
    method: 'POST',
    req: {
      [Symbol.asyncIterator]() {
        let sent = false;
        return {
          next: () => {
            if (sent) return Promise.resolve({ done: true, value: undefined });
            sent = true;
            return Promise.resolve({ done: false, value: Buffer.from('{"a":1}') });
          },
        };
      },
    },
    body: undefined,
  } as any;
  await readJsonBody(ctx);
  assert.deepStrictEqual(ctx.body, { a: 1 });
});
