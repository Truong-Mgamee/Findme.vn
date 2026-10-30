import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { contentAtoms, creditsLedger, profiles, readings, streaks, users } from '../src/db/schema.js';
import { decryptJson } from '../src/lib/crypto.js';

const HANOI = { name: 'Hà Nội', lat: 21.0285, lng: 105.8542, tz: 'Asia/Ho_Chi_Minh', country: 'VN' };
const NYC = { name: 'New York', lat: 40.7128, lng: -74.006, tz: 'America/New_York', country: 'US' };
const VN_BIRTH = { date: '1997-12-24', time: '12:00', timeUnknown: false, gender: 'female', place: HANOI, calendarStandard: 'vn' };
const STRIPE_SECRET = 'whsec_test_secret';

let app: FastifyInstance;
let token = '';
let userId = '';
let profileId = '';
let firstReadingId = '';

const auth = (t = token) => ({ authorization: `Bearer ${t}` });
const json = (r: { body: string }) => JSON.parse(r.body);

beforeAll(async () => {
  app = await buildApp({ env: { NODE_ENV: 'test', DATABASE_URL: undefined, REDIS_URL: undefined, JWT_SECRET: 'test-secret-test-secret-test', STRIPE_WEBHOOK_SECRET: STRIPE_SECRET, REVENUECAT_WEBHOOK_SECRET: 'rc-secret' } });
  await app.ready();
});
afterAll(async () => {
  await app.close();
});

describe('system', () => {
  it('GET /v1/healthz reports pglite + memory store', async () => {
    const r = await app.inject({ method: 'GET', url: '/v1/healthz' });
    expect(r.statusCode).toBe(200);
    expect(json(r)).toMatchObject({ ok: true, driver: 'pglite', store: 'memory' });
  });
  it('serves OpenAPI at /docs/json with the v1 routes', async () => {
    const r = await app.inject({ method: 'GET', url: '/docs/json' });
    expect(r.statusCode).toBe(200);
    const doc = json(r);
    expect(doc.openapi).toBe('3.1.0');
    for (const p of ['/v1/auth/guest', '/v1/me', '/v1/profiles', '/v1/profiles/{id}/ziwei', '/v1/today', '/v1/readings', '/v1/almanac', '/v1/webhooks/revenuecat']) expect(doc.paths[p], p).toBeDefined();
    expect(doc.paths['/v1/profiles'].post.requestBody.content['application/json'].schema.properties.birth).toBeDefined();
  });
  it('protected routes reject missing / bad tokens', async () => {
    expect((await app.inject({ method: 'GET', url: '/v1/me' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/v1/me', headers: auth('nope') })).statusCode).toBe(401);
  });
});

describe('guest onboarding (VN, eastAsia)', () => {
  it('POST /v1/auth/guest derives locale/tradition/calendar from headers', async () => {
    const r = await app.inject({ method: 'POST', url: '/v1/auth/guest', headers: { 'accept-language': 'vi-VN,vi;q=0.9', 'x-tz': 'Asia/Ho_Chi_Minh' }, payload: { country: 'vn' } });
    expect(r.statusCode).toBe(201);
    const body = json(r);
    expect(body.user).toMatchObject({ locale: 'vi', country: 'VN', traditionPack: 'eastAsia', calendarStandard: 'vn', tz: 'Asia/Ho_Chi_Minh' });
    token = body.token;
    userId = body.user.id;
  });
  it('PUT /v1/me updates settings and GET /v1/me reflects them', async () => {
    const r = await app.inject({ method: 'PUT', url: '/v1/me', headers: auth(), payload: { dailyHour: 8, traditionPack: 'eastAsia' } });
    expect(r.statusCode).toBe(200);
    expect(json(r).dailyHour).toBe(8);
    const bad = await app.inject({ method: 'PUT', url: '/v1/me', headers: auth(), payload: { tz: 'Mars/Olympus' } });
    expect(bad.statusCode).toBe(400);
    const me = await app.inject({ method: 'GET', url: '/v1/me', headers: auth() });
    expect(json(me)).toMatchObject({ id: userId, dailyHour: 8 });
  });
  it('POST /v1/profiles encrypts birth, computes eastAsia core_json with exactly 3 insights, hides the raw date', async () => {
    const r = await app.inject({ method: 'POST', url: '/v1/profiles', headers: auth(), payload: { birth: VN_BIRTH, isSelf: true, fullName: 'Nguyễn Thị Mai' } });
    expect(r.statusCode).toBe(201);
    const p = json(r);
    profileId = p.id;
    expect(p.label).toBe('Tôi');
    expect(p.birthSummary).toMatchObject({ gender: 'female', timeUnknown: false, calendarStandard: 'vn', hasName: true });
    expect(p.core.traditionPack).toBe('eastAsia');
    expect(p.core.eastAsia.pillars.map((x: { han: string }) => x.han)).toEqual(['丁丑', '壬子', '庚子', '壬午']);
    expect(p.core.eastAsia.lunar).toMatchObject({ year: 1997, month: 11, day: 25, standard: 'vn' });
    expect(p.core.eastAsia.yearBranch).toBe(1); // 丑
    expect(p.core.eastAsia.ziwei.soul).toEqual({ key: 'pojunMaj', name: 'Phá Quân' });
    expect(p.core.eastAsia.bazi.dayMaster.label).toBe('Canh');
    expect(p.core.western).toBeUndefined();
    expect(p.insights).toHaveLength(3);
    expect(p.insights[0].key).toBe('ziwei.soulstar.pojunMaj');
    expect(p.insights[1].key).toMatch(/^bazi\.daymaster\.6\.(strong|weak|balanced)$/);
    expect(r.body).not.toContain('1997-12-24');
    expect(r.body).not.toContain('"date"');
  });
  it('GET /v1/profiles/:id/ziwei returns 12 palaces with vi names + horoscope', async () => {
    const r = await app.inject({ method: 'GET', url: `/v1/profiles/${profileId}/ziwei?date=2026-10-10`, headers: auth() });
    expect(r.statusCode).toBe(200);
    const { chart, horoscope, atomKeys } = json(r);
    expect(chart.palaces).toHaveLength(12);
    expect(chart.palaces.map((p: { name: string }) => p.name)).toContain('Tài Bạch');
    expect(chart.soul.name).toBe('Phá Quân');
    expect(chart.chineseDate).toBe('Đinh Sửu - Nhâm Tý - Canh Tý - Nhâm Ngọ');
    expect(horoscope.date).toBe('2026-10-10');
    expect(horoscope.yearly.palaceNames).toHaveLength(12);
    expect(atomKeys).toContain('ziwei.soulstar.pojunMaj');
    const en = await app.inject({ method: 'GET', url: `/v1/profiles/${profileId}/ziwei`, headers: { ...auth(), 'x-locale': 'en' } });
    expect(json(en).chart.palaces[0].name).toBe('wealth');
  });
  it('GET /v1/profiles/:id/bazi returns pillars 丁丑 壬子 庚子 壬午', async () => {
    const r = await app.inject({ method: 'GET', url: `/v1/profiles/${profileId}/bazi`, headers: auth() });
    expect(r.statusCode).toBe(200);
    const out = json(r);
    expect(out.engine).toBe('bazi');
    expect(out.facts.pillars.map((p: { ganzhi: { han: string } }) => p.ganzhi.han)).toEqual(['丁丑', '壬子', '庚子', '壬午']);
    expect(out.facts.dayMaster.label).toBe('Canh');
    expect(out.atomKeys).toContain('bazi.daymaster.6');
  });
  it('GET /v1/today returns eastAsia payload with personalised almanac and streak 1 (idempotent within a day)', async () => {
    const r = await app.inject({ method: 'GET', url: '/v1/today', headers: auth() });
    expect(r.statusCode).toBe(200);
    const t = json(r);
    expect(t).toMatchObject({ traditionPack: 'eastAsia', profileId, needsProfile: false, locale: 'vi', tz: 'Asia/Ho_Chi_Minh' });
    expect(t.segments).toContain('ea:common');
    expect(t.segments.some((s: string) => /^ea:\d+$/.test(s))).toBe(true);
    expect(t.eastAsia.almanac.standard).toBe('vn');
    expect(t.eastAsia.almanac.personal).toMatchObject({ clashesWithUser: expect.any(Boolean), score: expect.any(Number) });
    expect(t.eastAsia.atomKeys.length).toBeGreaterThan(3);
    expect(t.streak).toMatchObject({ current: 1, longest: 1 });
    const again = json(await app.inject({ method: 'GET', url: '/v1/today', headers: auth() }));
    expect(again.streak.current).toBe(1);
  });
  it('GET /v1/today merges daily_content rows for the user segments', async () => {
    const t = json(await app.inject({ method: 'GET', url: '/v1/today', headers: auth() }));
    await app.db.insert(app.schema.dailyContent).values({ date: t.date, locale: 'vi', segmentKey: 'ea:common', payloadJson: { title: 'Ngày đẹp', body: 'x' } });
    const t2 = json(await app.inject({ method: 'GET', url: '/v1/today', headers: auth() }));
    expect(t2.content['ea:common']).toEqual({ title: 'Ngày đẹp', body: 'x' });
  });
});

describe('readings + paywall + credits', () => {
  it('first deep reading is free (free_first)', async () => {
    const r = await app.inject({ method: 'POST', url: '/v1/readings', headers: auth(), payload: { kind: 'ziwei_full', profileId } });
    expect(r.statusCode).toBe(201);
    const reading = json(r);
    firstReadingId = reading.id;
    expect(reading.paidBy).toBe('free_first');
    expect(reading.engine.engine).toBe('ziwei');
    expect(reading.engine.facts.chart.palaces).toHaveLength(12);
    expect(reading.engine.atomKeys).toContain('ziwei.soulstar.pojunMaj');
    expect(JSON.stringify(reading.engine)).not.toContain('1997-12-24');
  });
  it('second deep reading → 402 {reason, paywall:true}', async () => {
    const r = await app.inject({ method: 'POST', url: '/v1/readings', headers: auth(), payload: { kind: 'bazi_luck', profileId } });
    expect(r.statusCode).toBe(402);
    expect(json(r)).toMatchObject({ reason: 'deep_reading_requires_plus', paywall: true, credits: 0 });
    const c = await app.inject({ method: 'POST', url: '/v1/readings', headers: auth(), payload: { kind: 'bazi_luck', profileId, payWith: 'credit' } });
    expect(c.statusCode).toBe(402);
    expect(json(c).reason).toBe('insufficient_credits');
  });
  it('RevenueCat webhook grants credits idempotently (requires the shared secret)', async () => {
    const payload = { event: { id: 'evt_credits_1', type: 'NON_RENEWING_PURCHASE', app_user_id: userId, product_id: 'findme_credits_5', store: 'APP_STORE' } };
    expect((await app.inject({ method: 'POST', url: '/v1/webhooks/revenuecat', payload })).statusCode).toBe(401);
    const ok = await app.inject({ method: 'POST', url: '/v1/webhooks/revenuecat', headers: { authorization: 'Bearer rc-secret' }, payload });
    expect(ok.statusCode).toBe(200);
    expect(json(ok)).toMatchObject({ received: true, duplicate: false, applied: ['credits:+5'] });
    const dup = await app.inject({ method: 'POST', url: '/v1/webhooks/revenuecat', headers: { authorization: 'Bearer rc-secret' }, payload });
    expect(json(dup)).toMatchObject({ duplicate: true, applied: [] });
    const ent = json(await app.inject({ method: 'GET', url: '/v1/entitlements', headers: auth() }));
    expect(ent).toMatchObject({ credits: 5, subscriptions: [], features: [], freeFirstReadingAvailable: false });
  });
  it('POST /v1/readings with payWith:credit succeeds and the ledger decrements', async () => {
    const r = await app.inject({ method: 'POST', url: '/v1/readings', headers: auth(), payload: { kind: 'bazi_luck', profileId, payWith: 'credit' } });
    expect(r.statusCode).toBe(201);
    expect(json(r).paidBy).toBe('credit');
    expect(json(r).engine.facts.pillars).toHaveLength(4);
    const ent = json(await app.inject({ method: 'GET', url: '/v1/entitlements', headers: auth() }));
    expect(ent.credits).toBe(4);
    const rows = await app.db.select().from(creditsLedger).where(eq(creditsLedger.userId, userId));
    expect(rows.map((x) => x.delta).sort()).toEqual([-1, 5]);
  });
  it('numerology_full with credit, then GET /readings lists newest first and /readings/:id works', async () => {
    const r = await app.inject({ method: 'POST', url: '/v1/readings', headers: auth(), payload: { kind: 'numerology_full', profileId, payWith: 'credit' } });
    expect(r.statusCode).toBe(201);
    expect(json(r).engine.facts.lifePath.value).toBe(8); // 1997-12-24 → 1+9+9+7+1+2+2+4 = 35 → 8
    expect(json(r).engine.facts.birthDate).toBeUndefined(); // redacted before storage
    const list = json(await app.inject({ method: 'GET', url: '/v1/readings', headers: auth() }));
    expect(list.readings).toHaveLength(3);
    expect(list.readings[0].kind).toBe('numerology_full');
    const one = await app.inject({ method: 'GET', url: `/v1/readings/${firstReadingId}`, headers: auth() });
    expect(json(one).kind).toBe('ziwei_full');
  });
  it('GET /v1/readings/:id/stream emits engine_summary + done over SSE', async () => {
    const r = await app.inject({ method: 'GET', url: `/v1/readings/${firstReadingId}/stream`, headers: auth() });
    expect(r.statusCode).toBe(200);
    expect(r.headers['content-type']).toContain('text/event-stream');
    expect(r.body).toContain('event: engine_summary');
    expect(r.body).toContain('"engine":"ziwei"');
    expect(r.body).toContain('event: done');
  });
  it('tarot_spread / iching are 501 until their engines land; compatibility needs a partner', async () => {
    expect((await app.inject({ method: 'POST', url: '/v1/readings', headers: auth(), payload: { kind: 'tarot_spread', profileId, payWith: 'credit' } })).statusCode).toBe(501);
    expect((await app.inject({ method: 'POST', url: '/v1/readings', headers: auth(), payload: { kind: 'iching', profileId, payWith: 'credit' } })).statusCode).toBe(501);
    const c = await app.inject({ method: 'POST', url: '/v1/readings', headers: auth(), payload: { kind: 'compatibility', profileId, payWith: 'credit' } });
    expect(c.statusCode).toBe(400);
    const ent = json(await app.inject({ method: 'GET', url: '/v1/entitlements', headers: auth() }));
    expect(ent.credits).toBe(3); // failures never debit
  });
});

describe('almanac', () => {
  it('GET /v1/almanac is public and cached', async () => {
    const r = await app.inject({ method: 'GET', url: '/v1/almanac?date=2026-02-17&std=vn&locale=vi' });
    expect(r.statusCode).toBe(200);
    expect(r.headers['cache-control']).toContain('public');
    const a = json(r);
    expect(a.lunar).toMatchObject({ year: 2026, month: 1, day: 1 }); // Tết Bính Ngọ
    expect(a.dayGanzhi.han).toHaveLength(2);
    expect(a.hours).toHaveLength(13);
  });
  it('POST /v1/almanac/pick needs Plus (402), then works after a Stripe subscription webhook (signed)', async () => {
    const body = { task: 'wedding', from: '2026-11-01', to: '2026-11-30', profileIds: [profileId] };
    const denied = await app.inject({ method: 'POST', url: '/v1/almanac/pick', headers: auth(), payload: body });
    expect(denied.statusCode).toBe(402);
    expect(json(denied)).toMatchObject({ reason: 'almanac_pick_requires_plus', paywall: true });

    const event = { id: 'evt_sub_1', type: 'customer.subscription.created', data: { object: { id: 'sub_1', status: 'active', current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400, metadata: { user_id: userId, product: 'plus' }, items: { data: [] } } } };
    const raw = JSON.stringify(event);
    const t = Math.floor(Date.now() / 1000);
    const bad = await app.inject({ method: 'POST', url: '/v1/webhooks/stripe', headers: { 'content-type': 'application/json', 'stripe-signature': `t=${t},v1=deadbeef` }, payload: raw });
    expect(bad.statusCode).toBe(401);
    const v1 = createHmac('sha256', STRIPE_SECRET).update(`${t}.${raw}`).digest('hex');
    const ok = await app.inject({ method: 'POST', url: '/v1/webhooks/stripe', headers: { 'content-type': 'application/json', 'stripe-signature': `t=${t},v1=${v1}` }, payload: raw });
    expect(ok.statusCode).toBe(200);
    expect(json(ok).applied).toEqual(['entitlement:plus:active']);
    const ent = json(await app.inject({ method: 'GET', url: '/v1/entitlements', headers: auth() }));
    expect(ent.features).toContain('almanac_pick');
    expect(ent.subscriptions[0]).toMatchObject({ product: 'plus', status: 'active', source: 'stripe' });

    const r = await app.inject({ method: 'POST', url: '/v1/almanac/pick', headers: auth(), payload: body });
    expect(r.statusCode).toBe(200);
    const out = json(r);
    expect(out.paidBy).toBe('subscription');
    expect(out.ranked.length).toBeGreaterThan(0);
    expect(out.ranked.length).toBeLessThanOrEqual(10);
    expect(out.ranked[0].score).toBeGreaterThanOrEqual(out.ranked[1].score);
    // a subscriber's next deep reading is paid by subscription, not credits
    const d = await app.inject({ method: 'POST', url: '/v1/readings', headers: auth(), payload: { kind: 'bazi_luck', profileId } });
    expect(json(d).paidBy).toBe('subscription');
    expect(json(await app.inject({ method: 'GET', url: '/v1/entitlements', headers: auth() })).credits).toBe(3);
  });
});

describe('content atoms', () => {
  it('returns published atoms with locale→en fallback and lists missing keys', async () => {
    await app.db.insert(contentAtoms).values([
      { id: 'a1', tradition: 'ziwei', key: 'ziwei.soulstar.pojunMaj', locale: 'en', title: 'Po Jun', bodyMd: 'en body', status: 'published', version: 1 },
      { id: 'a2', tradition: 'ziwei', key: 'ziwei.soulstar.pojunMaj', locale: 'vi', title: 'Phá Quân', bodyMd: 'vi body', status: 'published', version: 1 },
      { id: 'a3', tradition: 'ziwei', key: 'ziwei.soulstar.pojunMaj', locale: 'vi', title: 'Phá Quân v2', bodyMd: 'vi body 2', status: 'published', version: 2 },
      { id: 'a4', tradition: 'bazi', key: 'bazi.daymaster.6', locale: 'en', title: 'Geng', bodyMd: 'en', status: 'published', version: 1 },
      { id: 'a5', tradition: 'bazi', key: 'bazi.daymaster.7', locale: 'vi', title: 'draft', bodyMd: 'x', status: 'draft', version: 1 },
    ]);
    const r = await app.inject({ method: 'GET', url: '/v1/content/atoms?keys=ziwei.soulstar.pojunMaj,bazi.daymaster.6,bazi.daymaster.7,nope&locale=vi' });
    expect(r.statusCode).toBe(200);
    const out = json(r);
    expect(out.atoms.map((a: { key: string; locale: string; version: number; fallback: boolean }) => [a.key, a.locale, a.version, a.fallback])).toEqual([
      ['ziwei.soulstar.pojunMaj', 'vi', 2, false],
      ['bazi.daymaster.6', 'en', 1, true],
    ]);
    expect(out.missing).toEqual(['bazi.daymaster.7', 'nope']);
  });
});

describe('western profile (New York, en)', () => {
  let wToken = '';
  let wProfile = '';
  it('guest with en + US → western pack', async () => {
    const r = await app.inject({ method: 'POST', url: '/v1/auth/guest', headers: { 'x-locale': 'en', 'x-tz': 'America/New_York' }, payload: { country: 'US' } });
    expect(json(r).user).toMatchObject({ locale: 'en', traditionPack: 'western', calendarStandard: 'cn' });
    wToken = json(r).token;
  });
  it('POST /profiles computes numerology + astro with 3 insights (no eastAsia)', async () => {
    const r = await app.inject({ method: 'POST', url: '/v1/profiles', headers: auth(wToken), payload: { birth: { date: '1990-05-15', time: '08:30', timeUnknown: false, gender: 'male', place: NYC }, isSelf: true, fullName: 'John Smith' } });
    expect(r.statusCode).toBe(201);
    const p = json(r);
    wProfile = p.id;
    expect(p.core.eastAsia).toBeUndefined();
    expect(p.core.western.numerology).toMatchObject({ lifePath: 3, nameSupported: true }); // 1990-05-15 → 1+9+9+0+5+1+5 = 30 → 3
    expect(p.core.western.numerology.expression).toBeTypeOf('number');
    expect(p.core.western.astro).toMatchObject({ sun: 'taurus', timeKnown: true });
    expect(p.core.western.astro.rising).toBeTypeOf('string');
    expect(p.insights).toHaveLength(3);
    expect(p.insights.map((i: { key: string }) => i.key.split('.')[0])).toEqual(['numerology', 'astro', 'astro']);
    expect(p.insights[1].title).toBe('Sun in Taurus');
  });
  it('GET numerology + astro routes', async () => {
    const n = json(await app.inject({ method: 'GET', url: `/v1/profiles/${wProfile}/numerology`, headers: auth(wToken) }));
    expect(n.facts.lifePath.value).toBe(3);
    expect(n.atomKeys).toContain('numerology.lifepath.3');
    const a = json(await app.inject({ method: 'GET', url: `/v1/profiles/${wProfile}/astro?houses=whole`, headers: auth(wToken) }));
    expect(a.facts.planets).toHaveLength(11);
    expect(a.facts.houseSystem).toBe('whole');
    expect(a.atomKeys).toContain('astro.sun.taurus');
  });
  it('GET /today for a western user has personal day + sky, no almanac', async () => {
    const t = json(await app.inject({ method: 'GET', url: '/v1/today', headers: auth(wToken) }));
    expect(t.eastAsia).toBeUndefined();
    expect(t.western.personalDay).toBeGreaterThanOrEqual(1);
    expect(t.western.sky.moon.phase.name).toBeTypeOf('string');
    expect(t.segments).toEqual(expect.arrayContaining(['w:common', 'w:lp:3', 'w:sun:taurus']));
  });
  it('time-unknown profile → no rising sign, moon approximate, insights still 3', async () => {
    const r = await app.inject({ method: 'POST', url: '/v1/profiles', headers: auth(wToken), payload: { birth: { date: '1990-05-15', timeUnknown: true, gender: 'other', place: NYC }, label: 'Friend' } });
    expect(r.statusCode).toBe(201);
    expect(json(r).core.western.astro).toMatchObject({ rising: null, timeKnown: false, moonApproximate: true });
    expect(json(r).insights).toHaveLength(3);
    const list = json(await app.inject({ method: 'GET', url: '/v1/profiles', headers: auth(wToken) }));
    expect(list.profiles).toHaveLength(2);
    expect((await app.inject({ method: 'GET', url: `/v1/profiles/${wProfile}`, headers: auth() })).statusCode).toBe(404); // other user's profile
    const mine = json(await app.inject({ method: 'GET', url: `/v1/profiles/${wProfile}?includeBirth=true`, headers: auth(wToken) }));
    expect(mine.birth.date).toBe('1990-05-15');
  });
});

describe('privacy + deletion', () => {
  it('profiles rows hold no plaintext birth date (birth_enc bytes, hash, core_json)', async () => {
    const rows = await app.db.select().from(profiles);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const row of rows) {
      const enc = Buffer.from(row.birthEnc);
      expect(enc[0]).toBe(1); // format version
      expect(enc.toString('latin1')).not.toContain('1997-12-24');
      expect(enc.toString('latin1')).not.toContain('1990-05-15');
      expect(enc.toString('latin1')).not.toContain('"date"');
      expect(row.birthHash).toMatch(/^[0-9a-f]{64}$/);
      const rest = JSON.stringify({ ...row, birthEnc: undefined });
      expect(rest).not.toContain('1997-12-24');
      expect(rest).not.toContain('1990-05-15');
      const birth = decryptJson<{ date: string }>(row.birthEnc, app.config.birthEncKey);
      expect(['1997-12-24', '1990-05-15']).toContain(birth.date);
    }
    const r = await app.db.select().from(readings);
    expect(JSON.stringify(r)).not.toContain('1997-12-24');
  });
  it('DELETE /v1/me hard-deletes the user and all owned rows; token stops working', async () => {
    const r = await app.inject({ method: 'DELETE', url: '/v1/me', headers: auth() });
    expect(r.statusCode).toBe(204);
    expect(await app.db.select().from(users).where(eq(users.id, userId))).toHaveLength(0);
    expect(await app.db.select().from(profiles).where(eq(profiles.userId, userId))).toHaveLength(0);
    expect(await app.db.select().from(readings).where(eq(readings.userId, userId))).toHaveLength(0);
    expect(await app.db.select().from(creditsLedger).where(eq(creditsLedger.userId, userId))).toHaveLength(0);
    expect(await app.db.select().from(streaks).where(eq(streaks.userId, userId))).toHaveLength(0);
    expect((await app.inject({ method: 'GET', url: '/v1/me', headers: auth() })).statusCode).toBe(401);
  });
  it('POST /v1/auth/link is 501 without SUPABASE_JWT_SECRET', async () => {
    const g = json(await app.inject({ method: 'POST', url: '/v1/auth/guest', payload: {} }));
    const r = await app.inject({ method: 'POST', url: '/v1/auth/link', headers: auth(g.token), payload: { supabaseAccessToken: 'x'.repeat(20) } });
    expect(r.statusCode).toBe(501);
  });
});
