import { test } from 'node:test';
import * as assert from 'node:assert';
import { RateLimiter } from '../http/middleware';

test('allows requests within the limit', () => {
  const limiter = new RateLimiter();
  const t = 0;
  for (let i = 0; i < 3; i++) {
    assert.deepStrictEqual(limiter.check('k', 3, 60000, t), { allowed: true, retryAfterMs: 0 });
  }
});

test('blocks once the limit is exceeded and reports retryAfter', () => {
  const limiter = new RateLimiter();
  const t = 0;
  limiter.check('k', 2, 60000, t);
  limiter.check('k', 2, 60000, t);
  const blocked = limiter.check('k', 2, 60000, t);
  assert.strictEqual(blocked.allowed, false);
  assert.strictEqual(blocked.retryAfterMs, 60000);
});

test('resets the window after the TTL elapses', () => {
  const limiter = new RateLimiter();
  const t = 0;
  limiter.check('k', 1, 60000, t);
  assert.strictEqual(limiter.check('k', 1, 60000, t).allowed, false);
  assert.strictEqual(limiter.check('k', 1, 60000, t + 60_001).allowed, true);
});

test('tracks keys independently', () => {
  const limiter = new RateLimiter();
  const t = 0;
  limiter.check('a', 1, 60000, t);
  assert.strictEqual(limiter.check('a', 1, 60000, t).allowed, false);
  assert.strictEqual(limiter.check('b', 1, 60000, t).allowed, true);
});
