import { test } from 'node:test';
import * as assert from 'node:assert';
import { bcryptHash, verifyBcrypt } from '../auth/bcrypt';

const KNOWN_VECTORS: Array<{ password: string; hash: string }> = [
  {
    password: 'password',
    hash: '$2b$10$9f0gaMi8gbFiyf0oQZibj.eInY2Omwf2ohoYfmdyEjxXAtXqpNJTq',
  },
  {
    password: 'secret-password',
    hash: '$2b$10$rXVdTuYdKBXP9NYveNr5tOtTAVdXbCEEnGjlyy0tLipDey5dl.qS6',
  },
  {
    password: 'correct horse',
    hash: '$2b$10$BtC0hpivp5ccil/cQjLKeOJS6atYP87rvGVMSIZEnSK5Dz44VAN2a',
  },
];

test('verifyBcrypt accepts known-good hashes', () => {
  for (const { password, hash } of KNOWN_VECTORS) {
    assert.strictEqual(verifyBcrypt(password, hash), true, `should verify ${password}`);
  }
});

test('verifyBcrypt rejects wrong passwords and malformed hashes', () => {
  const { hash } = KNOWN_VECTORS[0];
  assert.strictEqual(verifyBcrypt('wrong', hash), false);
  assert.strictEqual(verifyBcrypt('password', '$2b$10$invalid'), false);
  assert.strictEqual(verifyBcrypt('password', 'not-a-hash'), false);
  assert.strictEqual(verifyBcrypt(undefined as unknown as string, hash), false);
});

test('verifyBcrypt handles $2a and $2y prefixes identically', () => {
  const { password, hash } = KNOWN_VECTORS[0];
  assert.strictEqual(verifyBcrypt(password, hash.replace(/^\$2b\$/, '$2a$')), true);
  assert.strictEqual(verifyBcrypt(password, hash.replace(/^\$2b\$/, '$2y$')), true);
});

test('bcryptHash round-trips through verifyBcrypt', () => {
  const hash = bcryptHash('round-trip-password', 10);
  assert.ok(hash.startsWith('$2b$10$'));
  assert.strictEqual(hash.length, 60);
  assert.strictEqual(verifyBcrypt('round-trip-password', hash), true);
  assert.strictEqual(verifyBcrypt('wrong-password', hash), false);
});

test('bcryptHash with a fixed salt is deterministic', () => {
  const salt = '$2b$10$9f0gaMi8gbFiyf0oQZibj.';
  const a = bcryptHash('password', salt);
  const b = bcryptHash('password', salt);
  assert.strictEqual(a, b);
  assert.strictEqual(a, KNOWN_VECTORS[0].hash);
});

test('bcrypt truncates passwords at 72 bytes like the reference', () => {
  const seventyTwo = 'z'.repeat(72);
  const hash = bcryptHash(seventyTwo, 10);
  assert.strictEqual(verifyBcrypt('z'.repeat(73), hash), true, '73 chars truncates to 72');
});
