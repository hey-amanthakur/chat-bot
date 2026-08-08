import { HttpError, ValidationError } from './errors';

export function fail(message: string): never {
  throw new ValidationError(message);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function assertObject(body: unknown): Record<string, unknown> {
  if (!isObject(body)) fail('Body must be a JSON object');
  return body;
}

export function rejectUnknownKeys(body: Record<string, unknown>, allowed: string[]): void {
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) fail(`Property ${key} should not exist`);
  }
}

export interface StringRule {
  max?: number;
  min?: number;
  optional?: boolean;
}

export function expectString(
  body: Record<string, unknown>,
  key: string,
  rule: StringRule = {},
): string | undefined {
  const value = body[key];

  if (value === undefined) {
    if (rule.optional) return undefined;
    fail(`${key} must be a string`);
  }
  if (typeof value !== 'string') fail(`${key} must be a string`);
  if (rule.min !== undefined && value.length < rule.min) {
    fail(`${key} must be longer than or equal to ${rule.min} characters`);
  }
  if (rule.max !== undefined && value.length > rule.max) {
    fail(`${key} must be shorter than or equal to ${rule.max} characters`);
  }
  return value;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function expectEmail(
  body: Record<string, unknown>,
  key: string,
  rule: { optional?: boolean } = {},
): string | undefined {
  const value = expectString(body, key, { optional: rule.optional, max: 254 });
  if (value === undefined) return undefined;
  if (!EMAIL_RE.test(value)) fail(`${key} must be an email`);
  return value;
}

export function expectBoolean(
  body: Record<string, unknown>,
  key: string,
  rule: { optional?: boolean } = {},
): boolean | undefined {
  const value = body[key];
  if (value === undefined) {
    if (rule.optional) return undefined;
    fail(`${key} must be a boolean`);
  }
  if (typeof value !== 'boolean') fail(`${key} must be a boolean`);
  return value;
}

export function expectEnum(
  body: Record<string, unknown>,
  key: string,
  values: string[],
  rule: { optional?: boolean } = {},
): string | undefined {
  const value = expectString(body, key, { optional: rule.optional, max: 100 });
  if (value === undefined) return undefined;
  if (!values.includes(value))
    fail(`${key} must be one of the following values: ${values.join(', ')}`);
  return value;
}

export { HttpError };
