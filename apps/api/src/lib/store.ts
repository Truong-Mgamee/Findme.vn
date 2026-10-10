/**
 * Tiny key/value store used for quotas and short-lived caches.
 * In-memory by default; ioredis when REDIS_URL is set (same interface).
 */
export interface KvStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSec?: number): Promise<void>;
  /** increments and returns the new value; ttl applied when the key is created */
  incr(key: string, ttlSec?: number): Promise<number>;
  del(key: string): Promise<void>;
  close(): Promise<void>;
}

export class MemoryStore implements KvStore {
  private map = new Map<string, { v: string; exp: number | null }>();
  private live(key: string) {
    const e = this.map.get(key);
    if (!e) return null;
    if (e.exp !== null && e.exp <= Date.now()) {
      this.map.delete(key);
      return null;
    }
    return e;
  }
  async get(key: string) {
    return this.live(key)?.v ?? null;
  }
  async set(key: string, value: string, ttlSec?: number) {
    this.map.set(key, { v: value, exp: ttlSec ? Date.now() + ttlSec * 1000 : null });
  }
  async incr(key: string, ttlSec?: number) {
    const e = this.live(key);
    const n = (e ? Number(e.v) : 0) + 1;
    this.map.set(key, { v: String(n), exp: e ? e.exp : ttlSec ? Date.now() + ttlSec * 1000 : null });
    return n;
  }
  async del(key: string) {
    this.map.delete(key);
  }
  async close() {
    this.map.clear();
  }
}

export async function createStore(redisUrl?: string): Promise<{ store: KvStore; kind: 'memory' | 'redis' }> {
  if (!redisUrl) return { store: new MemoryStore(), kind: 'memory' };
  const { default: Redis } = await import('ioredis');
  const redis = new Redis(redisUrl, { lazyConnect: false, maxRetriesPerRequest: 2 });
  const store: KvStore = {
    get: (k) => redis.get(k),
    async set(k, v, ttl) {
      if (ttl) await redis.set(k, v, 'EX', ttl);
      else await redis.set(k, v);
    },
    async incr(k, ttl) {
      const n = await redis.incr(k);
      if (n === 1 && ttl) await redis.expire(k, ttl);
      return n;
    },
    async del(k) {
      await redis.del(k);
    },
    async close() {
      await redis.quit();
    },
  };
  return { store, kind: 'redis' };
}

/** Seconds until the end of the given local day (UTC approximation good enough for quotas). */
export function secondsUntilMidnightUtc(now = new Date()): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(60, Math.floor((next - now.getTime()) / 1000));
}
