import { test } from 'node:test';
import * as assert from 'node:assert';
import { signJwt, verifyJwt, parseExpiresIn } from '../auth/jwt';

const SECRET = 'test-secret-for-jwt-tests';
const BASE_TIME = 1_700_000_000_000;

test('signJwt produces a three-part HS256 token', () => {
  const token = signJwt(
    { email: 'admin@example.com', sub: 'admin' },
    SECRET,
    3600,
    () => BASE_TIME,
  );
  const parts = token.split('.');
  assert.strictEqual(parts.length, 3);
  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
  assert.deepStrictEqual(header, { alg: 'HS256', typ: 'JWT' });
});

test('verifyJwt returns the payload with exp/iat set', () => {
  const token = signJwt({ email: 'a@b.com', sub: 'admin' }, SECRET, 3600, () => BASE_TIME);
  const payload = verifyJwt(token, SECRET, () => BASE_TIME);
  assert.ok(payload);
  assert.strictEqual(payload!.email, 'a@b.com');
  assert.strictEqual(payload!.iat, BASE_TIME / 1000);
  assert.strictEqual(payload!.exp, BASE_TIME / 1000 + 3600);
});

test('verifyJwt rejects tokens signed with a different secret', () => {
  const token = signJwt({ sub: 'admin' }, SECRET, 3600, () => BASE_TIME);
  assert.strictEqual(
    verifyJwt(token, 'other-secret', () => BASE_TIME),
    null,
  );
});

test('verifyJwt rejects tampered payloads', () => {
  const token = signJwt({ sub: 'admin' }, SECRET, 3600, () => BASE_TIME);
  const [header, payload, sig] = token.split('.');
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
  decoded.sub = 'evil';
  const tamperedPayload = Buffer.from(JSON.stringify(decoded)).toString('base64url');
  assert.strictEqual(
    verifyJwt(`${header}.${tamperedPayload}.${sig}`, SECRET, () => BASE_TIME),
    null,
  );
});

test('verifyJwt rejects expired tokens', () => {
  const token = signJwt({ sub: 'admin' }, SECRET, 60, () => BASE_TIME);
  assert.strictEqual(
    verifyJwt(token, SECRET, () => BASE_TIME + 61_000),
    null,
  );
  assert.ok(verifyJwt(token, SECRET, () => BASE_TIME + 59_000));
});

test('verifyJwt rejects malformed tokens', () => {
  assert.strictEqual(verifyJwt('not-a-jwt', SECRET), null);
  assert.strictEqual(verifyJwt('a.b', SECRET), null);
  assert.strictEqual(verifyJwt('', SECRET), null);
});

test('parseExpiresIn parses unit suffixes', () => {
  assert.strictEqual(parseExpiresIn('5m'), 300);
  assert.strictEqual(parseExpiresIn('2h'), 7200);
  assert.strictEqual(parseExpiresIn('1d'), 86400);
  assert.strictEqual(parseExpiresIn('1w'), 604800);
  assert.strictEqual(parseExpiresIn('30s'), 30);
  assert.strictEqual(parseExpiresIn('90'), 90);
  assert.strictEqual(parseExpiresIn('garbage'), 86400);
});
