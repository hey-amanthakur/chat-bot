import { test, before, after } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { AddressInfo } from 'net';
import { createChatServer } from '../server';
import type { Env } from '../config';

const clients = {
  'dr-smith-dental': {
    name: 'Dr. Smith Dental',
    tone: 'friendly',
    model: 'test-model',
    services: [{ name: 'Cleaning', price: '$99', description: 'Standard cleaning' }],
  },
};

const fetchCalls: Array<{ url: string; init: RequestInit & { body?: string } }> = [];
const fakeFetch = (async (url: string, init: any) => {
  fetchCalls.push({ url, init });
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content: 'Hello! How can I help?' } }] }),
    text: async () => '',
  };
}) as typeof fetch;

let server: ReturnType<typeof createChatServer>;
let baseUrl: string;
const tmpClients = fs.mkdtempSync(path.join(os.tmpdir(), 'chatbot-clients-'));
const tmpLeads = fs.mkdtempSync(path.join(os.tmpdir(), 'chatbot-leads-'));
const tmpWidget = fs.mkdtempSync(path.join(os.tmpdir(), 'chatbot-widget-'));
fs.writeFileSync(path.join(tmpWidget, 'chat-widget.min.js'), 'var x = 1;');

const env: Env = {
  port: 0,
  nodeEnv: 'test',
  adminEmail: 'admin@test.com',
  adminPasswordHash: 'test-pass',
  jwtSecret: 'test-jwt-secret',
  jwtExpiresIn: '1h',
  openrouterApiKey: 'test-key',
  openrouterBaseUrl: 'http://openrouter.test/api/v1',
  allowedOrigins: null,
  dataDir: tmpClients,
  leadsDataDir: tmpLeads,
};

async function request(
  method: string,
  urlPath: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<{
  status: number;
  headers: Headers;
  json: () => Promise<any>;
  text: () => Promise<string>;
}> {
  const res = await fetch(`${baseUrl}${urlPath}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: res.status,
    headers: res.headers,
    json: () => res.json(),
    text: () => res.text(),
  };
}

before(async () => {
  server = createChatServer({
    env,
    clients,
    openrouterFetch: fakeFetch,
    widgetDist: tmpWidget,
    verifyPassword: (password: string, hash: string) => password === hash,
  });
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const addr = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

after(() => {
  server.close();
});

test('GET /api/health returns ok', async () => {
  const res = await request('GET', '/api/health');
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'ok');
  assert.strictEqual(data.service, 'server');
});

test('POST /api/chat detects a lead and does not call OpenRouter', async () => {
  const before = fetchCalls.length;
  const res = await request('POST', '/api/chat', {
    clientId: 'dr-smith-dental',
    message: 'Can I book an appointment? My name is Jane.',
  });
  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.lead_captured, true);
  assert.strictEqual(fetchCalls.length, before);
});

test('POST /api/chat calls OpenRouter for normal questions', async () => {
  const res = await request('POST', '/api/chat', {
    clientId: 'dr-smith-dental',
    message: 'What are your hours?',
  });
  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.lead_captured, false);
  assert.strictEqual(data.response, 'Hello! How can I help?');
  assert.ok(data.session_id);

  const call = fetchCalls[fetchCalls.length - 1];
  assert.ok(call.url.endsWith('/chat/completions'));
  assert.strictEqual((call.init.headers as any).Authorization, 'Bearer test-key');
  const body = JSON.parse(call.init.body || '{}');
  assert.strictEqual(body.model, 'test-model');
});

test('POST /api/chat validates the message length', async () => {
  const res = await request('POST', '/api/chat', {
    clientId: 'dr-smith-dental',
    message: 'x'.repeat(2001),
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.statusCode, 400);
});

test('POST /api/chat rejects non-object bodies', async () => {
  const res = await request('POST', '/api/chat', 'not-an-object');
  assert.strictEqual(res.status, 400);
});

test('POST /api/leads persists a lead and GET /api/leads/:clientId reads it', async () => {
  const res = await request('POST', '/api/leads', {
    clientId: 'dr-smith-dental',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-1234',
    reason: 'Wants a cleaning',
    conversationId: 'conv-1',
  });
  assert.strictEqual(res.status, 201);
  const lead = await res.json();
  assert.ok(lead.id);
  assert.strictEqual(lead.name, 'Jane Doe');
  assert.strictEqual(lead.clientId, 'dr-smith-dental');

  const file = path.join(tmpLeads, 'dr-smith-dental.json');
  assert.ok(fs.existsSync(file));

  const list = await request('GET', '/api/leads/dr-smith-dental');
  assert.strictEqual(list.status, 200);
  const leads = await list.json();
  assert.ok(Array.isArray(leads));
  assert.strictEqual(leads.length, 1);
});

test('POST /api/leads validates email', async () => {
  const res = await request('POST', '/api/leads', {
    clientId: 'c',
    name: 'Bad',
    email: 'not-an-email',
    reason: 'r',
    conversationId: 'c1',
  });
  assert.strictEqual(res.status, 400);
});

test('admin login rejects wrong credentials and accepts correct ones', async () => {
  const bad = await request('POST', '/api/admin/login', {
    email: 'admin@test.com',
    password: 'wrong-password',
  });
  assert.strictEqual(bad.status, 401);

  const ok = await request('POST', '/api/admin/login', {
    email: 'admin@test.com',
    password: 'test-pass',
  });
  assert.strictEqual(ok.status, 201);
  const data = await ok.json();
  assert.ok(data.access_token);
});

test('admin routes require authentication', async () => {
  const res = await request('GET', '/api/admin/clients');
  assert.strictEqual(res.status, 401);
});

test('admin client CRUD works end to end', async () => {
  const login = await request('POST', '/api/admin/login', {
    email: 'admin@test.com',
    password: 'test-pass',
  });
  const { access_token } = await login.json();
  const auth = { Authorization: `Bearer ${access_token}` };

  const created = await request(
    'POST',
    '/api/admin/clients',
    {
      name: 'Fresh Cuts Salon',
      slug: 'fresh-cuts-salon',
      tone: 'casual',
    },
    auth,
  );
  assert.strictEqual(created.status, 201);
  const createdData = await created.json();
  assert.strictEqual(createdData.slug, 'fresh-cuts-salon');

  const dup = await request(
    'POST',
    '/api/admin/clients',
    {
      name: 'Again',
      slug: 'fresh-cuts-salon',
    },
    auth,
  );
  assert.strictEqual(dup.status, 409);

  const updated = await request(
    'PUT',
    '/api/admin/clients/fresh-cuts-salon',
    {
      tone: 'friendly',
      leadCaptureEnabled: false,
    },
    auth,
  );
  assert.strictEqual(updated.status, 200);
  const updatedData = await updated.json();
  assert.strictEqual(updatedData.tone, 'friendly');
  assert.strictEqual(updatedData.lead_capture_enabled, false);

  const list = await request('GET', '/api/admin/clients', undefined, auth);
  assert.strictEqual(list.status, 200);
  const { clients: listed } = await list.json();
  assert.ok(listed.some((c: any) => c.slug === 'fresh-cuts-salon'));

  const missing = await request(
    'PUT',
    '/api/admin/clients/does-not-exist',
    { tone: 'friendly' },
    auth,
  );
  assert.strictEqual(missing.status, 404);
});

test('CORS echoes an allowed origin in development', async () => {
  const res = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'https://client-site.example' },
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('access-control-allow-origin'), 'https://client-site.example');
});

test('serves the chat widget bundle', async () => {
  const res = await fetch(`${baseUrl}/widgets/chat-widget.min.js`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(await res.text(), 'var x = 1;');
  assert.ok((res.headers.get('content-type') || '').includes('javascript'));
});

test('blocks widget path traversal', async () => {
  const res = await fetch(`${baseUrl}/widgets/../../etc/passwd`);
  assert.strictEqual(res.status, 404);
});

test('unknown API route returns 404', async () => {
  const res = await request('GET', '/api/nope');
  assert.strictEqual(res.status, 404);
});

test('rate limiting blocks chat spam', async () => {
  const limiterServer = createChatServer({
    env,
    clients,
    openrouterFetch: fakeFetch,
    rateLimiter: { check: () => ({ allowed: false, retryAfterMs: 5000 }) } as any,
  });
  await new Promise<void>((resolve) => limiterServer.listen(0, () => resolve()));
  const addr = limiterServer.address() as AddressInfo;
  try {
    const res = await fetch(`http://127.0.0.1:${addr.port}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: 'dr-smith-dental', message: 'hi' }),
    });
    assert.strictEqual(res.status, 429);
    assert.ok(res.headers.get('retry-after'));
  } finally {
    limiterServer.close();
  }
});
