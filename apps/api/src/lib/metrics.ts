/** Minimal JSON counters (prom-client can replace this later without touching routes). */
export class Metrics {
  readonly startedAt = Date.now();
  readonly counters = new Map<string, number>();
  readonly timings = new Map<string, { count: number; totalMs: number; maxMs: number }>();

  inc(name: string, labels: Record<string, string | number> = {}, by = 1) {
    const key = this.key(name, labels);
    this.counters.set(key, (this.counters.get(key) ?? 0) + by);
  }
  observe(name: string, ms: number, labels: Record<string, string | number> = {}) {
    const key = this.key(name, labels);
    const t = this.timings.get(key) ?? { count: 0, totalMs: 0, maxMs: 0 };
    t.count += 1;
    t.totalMs += ms;
    t.maxMs = Math.max(t.maxMs, ms);
    this.timings.set(key, t);
  }
  async time<T>(name: string, labels: Record<string, string | number>, fn: () => Promise<T> | T): Promise<T> {
    const t0 = performance.now();
    try {
      return await fn();
    } finally {
      this.observe(name, performance.now() - t0, labels);
    }
  }
  snapshot() {
    return {
      uptimeSec: Math.round((Date.now() - this.startedAt) / 1000),
      counters: Object.fromEntries(this.counters),
      timings: Object.fromEntries([...this.timings].map(([k, v]) => [k, { ...v, avgMs: Math.round((v.totalMs / v.count) * 100) / 100 }])),
    };
  }
  private key(name: string, labels: Record<string, string | number>) {
    const l = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return l ? `${name}{${l}}` : name;
  }
}
