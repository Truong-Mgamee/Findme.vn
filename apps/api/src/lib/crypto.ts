import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';

const VERSION = 1;
const IV_LEN = 12;
const TAG_LEN = 16;

/** Stable JSON: object keys sorted recursively, undefined dropped. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort()) {
      const val = (v as Record<string, unknown>)[k];
      if (val !== undefined) out[k] = sortKeys(val);
    }
    return out;
  }
  return v;
}

/** AES-256-GCM. Layout: version(1) | iv(12) | tag(16) | ciphertext. */
export function encryptJson(value: unknown, key: Buffer): Buffer {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const plain = Buffer.from(canonicalJson(value), 'utf8');
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([VERSION]), iv, tag, enc]);
}

export function decryptJson<T = unknown>(blob: Buffer | Uint8Array, key: Buffer): T {
  const buf = Buffer.isBuffer(blob) ? blob : Buffer.from(blob);
  if (buf[0] !== VERSION) throw new Error(`unsupported birth_enc version ${buf[0]}`);
  const iv = buf.subarray(1, 1 + IV_LEN);
  const tag = buf.subarray(1 + IV_LEN, 1 + IV_LEN + TAG_LEN);
  const data = buf.subarray(1 + IV_LEN + TAG_LEN);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(plain.toString('utf8')) as T;
}

/**
 * Keyed hash of the canonical birth JSON (HMAC-SHA256 under the enc key). Used only for
 * engine-output caching / duplicate detection, so a leaked hash cannot be brute-forced
 * back to a birth date the way a plain sha256 of such a low-entropy input could.
 */
export function birthHash(birth: unknown, key: Buffer): string {
  return createHmac('sha256', key).update(canonicalJson(birth)).digest('hex');
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= (ab[i] as number) ^ (bb[i] as number);
  return diff === 0;
}
