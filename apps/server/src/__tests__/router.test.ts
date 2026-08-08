import { test } from 'node:test';
import * as assert from 'node:assert';
import { matchRoute } from '../http/router';
import type { Route } from '../http/types';

const routes: Route[] = [
  { method: 'GET', path: '/api/health', handler() {} },
  { method: 'GET', path: '/api/leads/:clientId', handler() {} },
  { method: 'PUT', path: '/api/admin/clients/:id', handler() {} },
  { method: 'POST', path: '/api/chat', handler() {} },
];

test('exact match', () => {
  const m = matchRoute(routes, 'GET', '/api/health');
  assert.ok(m);
  assert.strictEqual(m!.route.path, '/api/health');
  assert.deepStrictEqual(m!.params, {});
});

test('param matching extracts decoded values', () => {
  const m = matchRoute(routes, 'GET', '/api/leads/dr-smith-dental');
  assert.ok(m);
  assert.strictEqual(m!.params.clientId, 'dr-smith-dental');
});

test('encoded slashes in params are decoded', () => {
  const m = matchRoute(routes, 'PUT', '/api/admin/clients/a%2Fb');
  assert.ok(m);
  assert.strictEqual(m!.params.id, 'a/b');
});

test('wrong method does not match', () => {
  assert.strictEqual(matchRoute(routes, 'DELETE', '/api/health'), null);
  assert.strictEqual(matchRoute(routes, 'POST', '/api/health'), null);
});

test('wrong segment count does not match', () => {
  assert.strictEqual(matchRoute(routes, 'GET', '/api/leads'), null);
  assert.strictEqual(matchRoute(routes, 'GET', '/api/leads/a/b'), null);
  assert.strictEqual(matchRoute(routes, 'GET', '/api'), null);
});

test('literal mismatch does not match', () => {
  assert.strictEqual(matchRoute(routes, 'GET', '/api/healthx'), null);
});

test('unknown route returns null', () => {
  assert.strictEqual(matchRoute(routes, 'GET', '/api/nope'), null);
});
