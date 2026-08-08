import * as crypto from 'crypto';
import { verifyBcrypt } from './bcrypt';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;

export interface ScryptParams {
  N?: number;
  r?: number;
  p?: number;
}

export async function hashPasswordScrypt(
  password: string,
  params: ScryptParams = {},
): Promise<string> {
  const N = params.N ?? SCRYPT_N;
  const r = params.r ?? SCRYPT_R;
  const p = params.p ?? SCRYPT_P;
  const salt = crypto.randomBytes(16);
  const key = await scryptAsync(password, salt, N, r, p);
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

function scryptAsync(
  password: string,
  salt: Buffer,
  N: number,
  r: number,
  p: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, { N, r, p }, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (typeof password !== 'string' || typeof hash !== 'string') return Promise.resolve(false);

  if (hash.startsWith('$2')) {
    return Promise.resolve(verifyBcrypt(password, hash));
  }

  if (hash.startsWith('scrypt$')) {
    const parts = hash.split('$');
    if (parts.length < 6) return Promise.resolve(false);
    const N = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    const salt = Buffer.from(parts[4], 'base64url');
    const expected = Buffer.from(parts[5], 'base64url');
    if (!N || !r || !p || !salt.length || !expected.length) return Promise.resolve(false);
    return scryptAsync(password, salt, N, r, p).then((key) => {
      return key.length === expected.length && crypto.timingSafeEqual(key, expected);
    });
  }

  return Promise.resolve(false);
}
