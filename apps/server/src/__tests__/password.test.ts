import { test } from 'node:test';
import * as assert from 'node:assert';
import { hashPasswordScrypt, verifyPassword } from '../auth/password';
import { bcryptHash } from '../auth/bcrypt';

test('scrypt hash round-trips', async () => {
  const hash = await hashPasswordScrypt('my-super-secret');
  assert.ok(hash.startsWith('scrypt$'));
  assert.strictEqual(await verifyPassword('my-super-secret', hash), true);
  assert.strictEqual(await verifyPassword('wrong-password', hash), false);
});

test('scrypt hashes are salted (different each time)', async () => {
  const a = await hashPasswordScrypt('same-password');
  const b = await hashPasswordScrypt('same-password');
  assert.notStrictEqual(a, b);
});

test('verifyPassword rejects malformed scrypt hashes', async () => {
  assert.strictEqual(await verifyPassword('x', 'scrypt$garbage'), false);
  assert.strictEqual(await verifyPassword('x', 'scrypt$16384$2$1$'), false);
});

test('verifyPassword supports legacy bcrypt hashes', async () => {
  const bcrypt = bcryptHash('legacy-password', 10);
  assert.strictEqual(await verifyPassword('legacy-password', bcrypt), true);
  assert.strictEqual(await verifyPassword('wrong', bcrypt), false);
});

test('verifyPassword rejects unknown formats', async () => {
  assert.strictEqual(await verifyPassword('x', 'plain'), false);
  assert.strictEqual(await verifyPassword('x', ''), false);
  assert.strictEqual(await verifyPassword(undefined as unknown as string, '$2b$10$x'), false);
});
