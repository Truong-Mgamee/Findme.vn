import { describe, expect, it } from 'vitest';
import { createClient, isPaywall } from '../src/index.js';

describe('createClient', () => {
  it('adds Bearer / X-Locale / X-Tz headers and surfaces 402 bodies', async () => {
    const seen: Array<{ url: string; headers: Record<string, string> }> = [];
    const fetchMock: typeof fetch = async (input) => {
      const req = input as Request;
      seen.push({ url: req.url, headers: Object.fromEntries(req.headers.entries()) });
      if (req.url.endsWith('/v1/readings')) return new Response(JSON.stringify({ error: 'x', reason: 'deep_reading_requires_plus', paywall: true, credits: 0 }), { status: 402, headers: { 'content-type': 'application/json' } });
      return new Response(JSON.stringify({ ok: true, driver: 'pglite', store: 'memory', uptimeSec: 1, version: '0.1.0' }), { status: 200, headers: { 'content-type': 'application/json' } });
    };
    let paywall: unknown = null;
    const api = createClient('https://api.test', async () => 'tok', { locale: 'vi', tz: 'Asia/Ho_Chi_Minh', fetch: fetchMock, onPaywall: (b) => (paywall = b) });
    const h = await api.GET('/v1/healthz');
    expect(h.data?.ok).toBe(true);
    expect(seen[0]?.headers).toMatchObject({ authorization: 'Bearer tok', 'x-locale': 'vi', 'x-tz': 'Asia/Ho_Chi_Minh' });
    const r = await api.POST('/v1/readings', { body: { kind: 'bazi_luck', profileId: '00000000-0000-4000-8000-000000000000' } });
    expect(r.response.status).toBe(402);
    expect(isPaywall(r.error)).toBe(true);
    expect(paywall).toMatchObject({ reason: 'deep_reading_requires_plus' });
  });
});
