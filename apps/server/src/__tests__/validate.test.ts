import { test } from 'node:test';
import * as assert from 'node:assert';
import {
  assertObject,
  rejectUnknownKeys,
  expectString,
  expectEmail,
  expectBoolean,
  expectEnum,
} from '../http/validate';
import { ValidationError } from '../http/errors';

test('assertObject rejects non-objects', () => {
  for (const bad of [null, 'str', 42, [], true]) {
    assert.throws(() => assertObject(bad), ValidationError);
  }
  assert.deepStrictEqual(assertObject({ a: 1 }), { a: 1 });
});

test('rejectUnknownKeys rejects disallowed keys', () => {
  assert.throws(() => rejectUnknownKeys({ a: 1, b: 2 }, ['a']), /Property b should not exist/);
  assert.doesNotThrow(() => rejectUnknownKeys({ a: 1 }, ['a']));
});

test('expectString enforces presence, type, and length', () => {
  assert.throws(() => expectString({}, 'x'), /x must be a string/);
  assert.throws(() => expectString({ x: 5 }, 'x'), /x must be a string/);
  assert.throws(() => expectString({ x: 'short' }, 'x', { min: 6 }), /longer than or equal to 6/);
  assert.throws(
    () => expectString({ x: 'toolong' }, 'x', { max: 5 }),
    /shorter than or equal to 5/,
  );
  assert.strictEqual(expectString({ x: 'ok' }, 'x'), 'ok');
  assert.strictEqual(expectString({}, 'x', { optional: true }), undefined);
});

test('expectEmail validates format', () => {
  assert.strictEqual(expectEmail({ email: 'a@b.com' }, 'email'), 'a@b.com');
  assert.throws(() => expectEmail({ email: 'not-an-email' }, 'email'), /email must be an email/);
  assert.strictEqual(expectEmail({}, 'email', { optional: true }), undefined);
});

test('expectBoolean requires a real boolean', () => {
  assert.strictEqual(expectBoolean({ flag: true }, 'flag'), true);
  assert.throws(() => expectBoolean({ flag: 'true' }, 'flag'), /flag must be a boolean/);
  assert.strictEqual(expectBoolean({}, 'flag', { optional: true }), undefined);
});

test('expectEnum restricts values', () => {
  assert.strictEqual(expectEnum({ tone: 'friendly' }, 'tone', ['formal', 'friendly']), 'friendly');
  assert.throws(
    () => expectEnum({ tone: 'angry' }, 'tone', ['formal', 'friendly']),
    /one of the following/,
  );
  assert.strictEqual(expectEnum({}, 'tone', ['formal'], { optional: true }), undefined);
});
