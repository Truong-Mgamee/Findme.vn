import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

const HANOI = { name: 'Hà Nội', lat: 21.0285, lng: 105.8542, tz: 'Asia/Ho_Chi_Minh', country: 'VN' };
const BIRTH = { date: '1997-12-24', time: '12:00', timeUnknown: false, gender: 'female', place: HANOI, calendarStandard: 'vn' };
const ADMIN = 'admin-token-for-tests';

let app: FastifyInstance;
let token = '';
let readingId = '';
const auth = () => ({ authorization: `Bearer ${token}` });
const admin = () => ({ 'x-admin-token': ADMIN });
const json = (r: { body: string }) => JSON.parse(r.body);

function parseSse(body: string): Array<{ event: string; data: unknown }> {
  return body
    .split('\n\n')
    .filter((b) => b.trim())
    .map((block) => {
      const ev = /event: (.+)/.exec(block)?.[1] ?? 'message';
      const data = /data: (.+)/.exec(block)?.[1] ?? 'null';
      return { event: ev, data: JSON.parse(data) };
    });
}

beforeAll(async () => {
  app = await buildApp({ env: { NODE_ENV: 'test', DATABASE_URL: undefined, REDIS_URL: undefined, JWT_SECRET: 'test-secret-test-secret-test', ADMIN_TOKEN: ADMIN, AI_ENABLED: 'false' } });
  await app.ready();
  const g = await app.inject({ method: 'POST', url: '/v1/auth/guest', headers: { 'accept-language': 'vi' }, payload: { country: 'vn' } });
  token = json(g).token;
  const p = await app.inject({ method: 'POST', url: '/v1/profiles', headers: auth(), payload: { birth: BIRTH, isSelf: true, label: 'Me' } });
  expect(p.statusCode).toBe(201);
});
afterAll(async () => app.close());

describe('admin content', () => {
  it('rejects missing/invalid admin token and accepts the right one', async () => {
    expect((await app.inject({ method: 'GET', url: '/v1/admin/coverage' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/v1/admin/coverage', headers: { 'x-admin-token': 'nope' } })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/v1/admin/coverage', headers: admin() })).statusCode).toBe(200);
  });
  it('imports atoms, lists, edits status, creates a new version, reports coverage', async () => {
    const imp = await app.inject({
      method: 'POST',
      url: '/v1/admin/atoms/import',
      headers: admin(),
      payload: {
        atoms: [
          { tradition: 'ziwei', key: 'ziwei.soulstar.pojunMaj', locale: 'vi', title: 'Mệnh chủ Phá Quân', body_md: 'Bạn ưa đổi mới, dám phá bỏ cái cũ để xây cái mới.', status: 'reviewed', author: 'human' },
          { tradition: 'ziwei', key: 'ziwei.soulstar.pojunMaj', locale: 'en', title: 'Soul star Pojun', body_md: 'You renew by breaking what no longer serves.', status: 'published', author: 'human' },
          { tradition: 'ziwei', key: 'ziwei.fiveclass.water2nd', locale: 'vi', title: 'Thủy Nhị Cục', body_md: 'Thủy nhị cục: linh hoạt, thích nghi nhanh, đại hạn khởi từ 2 tuổi.', status: 'published', author: 'human' },
        ],
      },
    });
    expect(json(imp)).toEqual({ inserted: 3, updated: 0 });
    const again = await app.inject({ method: 'POST', url: '/v1/admin/atoms/import', headers: admin(), payload: { atoms: [{ tradition: 'ziwei', key: 'ziwei.soulstar.pojunMaj', locale: 'vi', title: 'Mệnh chủ Phá Quân', body_md: 'v1 edited', status: 'draft' }] } });
    expect(json(again)).toEqual({ inserted: 0, updated: 1 });
    const list = await app.inject({ method: 'GET', url: '/v1/admin/atoms?tradition=ziwei&locale=vi', headers: admin() });
    expect(json(list).total).toBe(2);
    const viAtom = json(list).items.find((a: { key: string }) => a.key === 'ziwei.soulstar.pojunMaj');
    expect(viAtom.status).toBe('reviewed'); // status preserved unless overwriteStatus
    const put = await app.inject({ method: 'PUT', url: `/v1/admin/atoms/${viAtom.id}`, headers: admin(), payload: { status: 'published', reviewer: 'thay-A' } });
    expect(json(put)).toMatchObject({ status: 'published', reviewer: 'thay-A' });
    const v2 = await app.inject({ method: 'POST', url: '/v1/admin/atoms', headers: admin(), payload: { tradition: 'ziwei', key: 'ziwei.soulstar.pojunMaj', locale: 'vi', title: 'Mệnh chủ Phá Quân (v2)', body_md: 'Bản mới.', status: 'draft' } });
    expect(v2.statusCode).toBe(201);
    expect(json(v2).version).toBe(2);
    const cov = json(await app.inject({ method: 'GET', url: '/v1/admin/coverage', headers: admin() }));
    expect(cov.rows.find((r: { tradition: string; locale: string }) => r.tradition === 'ziwei' && r.locale === 'vi')).toMatchObject({ total: 3, published: 2, draft: 1 });
    // public endpoint only sees published, prefers highest published version in locale
    const pub = json(await app.inject({ method: 'GET', url: '/v1/content/atoms?keys=ziwei.soulstar.pojunMaj,ziwei.fiveclass.water2nd,nope&locale=vi' }));
    expect(pub.atoms.map((a: { key: string; version: number }) => `${a.key}@${a.version}`)).toEqual(['ziwei.soulstar.pojunMaj@1', 'ziwei.fiveclass.water2nd@1']);
    expect(pub.missing).toEqual(['nope']);
  });
});

describe('reading stream with AI disabled → template narrative from published atoms', () => {
  it('creates a ziwei reading, streams summary/sections/done and caches ai_json', async () => {
    const profiles = json(await app.inject({ method: 'GET', url: '/v1/profiles', headers: auth() }));
    const profileId = profiles.profiles[0].id;
    const r = await app.inject({ method: 'POST', url: '/v1/readings', headers: auth(), payload: { kind: 'ziwei_full', profileId } });
    expect(r.statusCode).toBe(201);
    readingId = json(r).id;
    const s = await app.inject({ method: 'GET', url: `/v1/readings/${readingId}/stream`, headers: auth() });
    expect(s.statusCode).toBe(200);
    expect(s.headers['content-type']).toContain('text/event-stream');
    const events = parseSse(s.body);
    const names = events.map((e) => e.event);
    expect(names[0]).toBe('engine_summary');
    expect(names).toContain('summary');
    expect(names).toContain('section');
    expect(names[names.length - 1]).toBe('done');
    const sections = events.filter((e) => e.event === 'section').map((e) => e.data as { title: string; atomRefs: string[] });
    expect(sections.some((x) => x.atomRefs.includes('ziwei.soulstar.pojunMaj'))).toBe(true);
    expect(sections.find((x) => x.atomRefs.includes('ziwei.soulstar.pojunMaj'))!.title).toBe('Mệnh chủ Phá Quân');
    const done = events[events.length - 1]!.data as { usedFallbackTemplate: boolean; model: string | null };
    expect(done).toMatchObject({ usedFallbackTemplate: true, model: null });
    const get = json(await app.inject({ method: 'GET', url: `/v1/readings/${readingId}`, headers: auth() }));
    expect(get.ai.meta).toMatchObject({ usedFallbackTemplate: true, atomCount: 2 });
    // second stream reuses cached ai_json (no delta events, same sections)
    const s2 = parseSse((await app.inject({ method: 'GET', url: `/v1/readings/${readingId}/stream`, headers: auth() })).body);
    expect(s2.filter((e) => e.event === 'section')).toHaveLength(sections.length);
  });
});

describe('ask AI quota', () => {
  it('allows 3 free questions per day then returns 402, with fallback text when AI disabled', async () => {
    const ask = (q: string) => app.inject({ method: 'POST', url: '/v1/ai/ask', headers: auth(), payload: { question: q, readingId } });
    const a1 = await ask('Năm nay tôi nên tập trung vào gì?');
    expect(a1.statusCode).toBe(200);
    expect(json(a1)).toMatchObject({ quotaLeft: 2, model: null });
    expect(json(a1).text.length).toBeGreaterThan(10);
    expect(json(await ask('q2')).quotaLeft).toBe(1);
    expect(json(await ask('q3')).quotaLeft).toBe(0);
    const a4 = await ask('q4');
    expect(a4.statusCode).toBe(402);
    expect(json(a4)).toMatchObject({ reason: 'ask_ai_quota_exceeded', paywall: true });
    const bad = await app.inject({ method: 'POST', url: '/v1/ai/ask', headers: auth(), payload: { question: 'hỏi thêm?', readingId: '00000000-0000-0000-0000-000000000000' } });
    expect([402, 404]).toContain(bad.statusCode);
  });
});

describe('daily oracle job', () => {
  it('generates template rows for user segments and /today merges them', async () => {
    const run = await app.inject({ method: 'POST', url: '/v1/admin/jobs/daily-oracle', headers: admin(), payload: { date: '2026-10-10', locales: ['vi'] } });
    expect(run.statusCode).toBe(200);
    const r = json(run);
    expect(r.ai).toBe(false);
    expect(r.generated).toBeGreaterThanOrEqual(3); // ea:common, ea:13 (丁丑), w:common (+ western segments if present)
    const again = json(await app.inject({ method: 'POST', url: '/v1/admin/jobs/daily-oracle', headers: admin(), payload: { date: '2026-10-10', locales: ['vi'] } }));
    expect(again.generated).toBe(0);
    expect(again.skipped).toBe(r.generated);
    const rows = json(await app.inject({ method: 'GET', url: '/v1/admin/daily-content?date=2026-10-10&locale=vi', headers: admin() })).rows;
    const ea13 = rows.find((x: { segmentKey: string }) => x.segmentKey === 'ea:13');
    expect(ea13.payload.headline).toMatch(/hoàng đạo/);
    expect(ea13.payload.facts.forYear).toBe('Đinh Sửu');
    const today = json(await app.inject({ method: 'GET', url: '/v1/today', headers: { ...auth(), 'x-tz': 'Asia/Ho_Chi_Minh' } }));
    if (today.date === '2026-10-10') expect(today.content['ea:13']).toBeDefined();
    expect(today.segments).toContain('ea:13');
  });
});

describe('billing + push (P12 scaffolding)', () => {
  it('checkout returns 501 without Stripe config; products list is empty', async () => {
    const r = await app.inject({ method: 'POST', url: '/v1/billing/checkout', headers: auth(), payload: { product: 'plus_monthly' } });
    expect(r.statusCode).toBe(501);
    expect(json(await app.inject({ method: 'GET', url: '/v1/billing/products', headers: auth() })).products).toEqual([]);
  });
  it('registers and removes push tokens, toggling pushEnabled', async () => {
    const add = await app.inject({ method: 'POST', url: '/v1/me/push-token', headers: auth(), payload: { token: 'ExponentPushToken[abcdefghijklmnop]', platform: 'ios' } });
    expect(json(add)).toEqual({ ok: true, tokens: 1 });
    expect(json(await app.inject({ method: 'GET', url: '/v1/me', headers: auth() })).pushEnabled).toBe(true);
    expect((await app.inject({ method: 'PUT', url: '/v1/me', headers: auth(), payload: { tz: 'Asia/Ho_Chi_Minh', dailyHour: 7 } })).statusCode).toBe(200);
    const { runDailyPushJob } = await import('../src/jobs/push.js');
    const r = await runDailyPushJob(app, new Date(Date.UTC(2026, 9, 10, 0, 0))); // 07:00 Asia/Ho_Chi_Minh = default daily hour
    expect(r.dryRun).toBe(true);
    expect(r.candidates).toBeGreaterThanOrEqual(1);
    const del = await app.inject({ method: 'DELETE', url: '/v1/me/push-token', headers: auth(), payload: { token: 'ExponentPushToken[abcdefghijklmnop]' } });
    expect(json(del)).toEqual({ ok: true, tokens: 0 });
    expect(json(await app.inject({ method: 'GET', url: '/v1/me', headers: auth() })).pushEnabled).toBe(false);
  });
});
