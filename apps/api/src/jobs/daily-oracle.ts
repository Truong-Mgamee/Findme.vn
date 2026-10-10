/**
 * Daily Oracle generator (docs/04 §9). Segment-based so cost is independent of user count:
 *   eastAsia: ea:common + ea:<ganzhiYearIndex 0..59>   western: w:common + w:lp:<n> + w:sun:<sign>
 * Facts come from the engines; the one-screen copy comes from Haiku (or a deterministic template
 * when AI is disabled). Rows are upserted into daily_content and merged by assembleToday().
 */
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { ganzhiFromIndex, ganzhiLabel, type Locale } from '@findme/engine-core';
import { composeDaily, type DailyOutput } from '@findme/ai-composer';
import { getDayAlmanac, personalizeAlmanac } from '@findme/engine-almanac';
import { dailyCard } from '@findme/engine-tarot';
import { dailySky, SIGNS } from '@findme/engine-astro';
import { defaultCalendarStandard, LOCALE_CONFIGS } from '@findme/i18n';
import { dailyContent, users } from '../db/schema.js';
import { aiAvailable } from '../services/ai.js';
import { zonedNoonUtc } from '../services/today.js';
import { runDailyPushJob, runTrialReminderJob } from './push.js';

export interface DailyJobOptions {
  date: string;
  locales: Locale[];
  force?: boolean;
  /** limit segments (tests) */
  maxSegments?: number;
}

export interface DailyJobResult {
  date: string;
  generated: number;
  skipped: number;
  costUsd: number;
  ai: boolean;
}

const LIFE_PATHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

function localeCountry(locale: Locale): string | undefined {
  return LOCALE_CONFIGS[locale].intlTag.split('-').pop();
}

/** Which segments matter for a locale: only year-branch segments that real users have (plus common). */
async function segmentsFor(app: FastifyInstance, locale: Locale, all: boolean): Promise<string[]> {
  const segs = new Set<string>(['ea:common', 'w:common']);
  if (all) {
    for (let i = 0; i < 60; i++) segs.add(`ea:${i}`);
    for (const lp of LIFE_PATHS) segs.add(`w:lp:${lp}`);
    for (const s of SIGNS) segs.add(`w:sun:${s.key}`);
    return [...segs];
  }
  // derive from existing users' profiles (core_json) for this locale
  const rows = await app.db.execute(sql`
    select distinct (p.core_json->'eastAsia'->'lunar'->'yearGanzhi'->>'index') as gz,
                    (p.core_json->'western'->'numerology'->>'lifePath') as lp,
                    (p.core_json->'western'->'astro'->>'sun') as sun
    from profiles p join users u on u.id = p.user_id
    where u.locale = ${locale} and p.is_self = true`);
  const list = ((rows as unknown as { rows?: unknown[] }).rows ?? (Array.isArray(rows) ? (rows as unknown[]) : [])) as Array<{ gz: string | null; lp: string | null; sun: string | null }>;
  for (const r of list) {
    if (r.gz) segs.add(`ea:${r.gz}`);
    if (r.lp) segs.add(`w:lp:${r.lp}`);
    if (r.sun) segs.add(`w:sun:${r.sun}`);
  }
  return [...segs];
}

export function factsForSegment(segment: string, date: string, locale: Locale): Record<string, unknown> {
  const std = defaultCalendarStandard(localeCountry(locale));
  const [kind, a, b] = segment.split(':');
  if (kind === 'ea') {
    const day = getDayAlmanac(date, std, locale);
    const base = { lunar: `${day.lunar.year}/${day.lunar.month}/${day.lunar.day}`, dayGanzhi: day.dayGanzhi.han, huangdao: day.huangdao, zhixing: day.zhixing.label, xiu: day.xiu.label, yi: day.yi.slice(0, 5).map((x) => x.label), ji: day.ji.slice(0, 4).map((x) => x.label), goodHours: day.hours.filter((h) => h.auspicious).map((h) => h.label), clashZodiac: day.clash.zodiacLabel, luckyDirections: { joy: day.positions.joy.label, wealth: day.positions.wealth.label }, solarTermNext: day.solarTerm.next };
    if (a === 'common') return base;
    const gz = ganzhiFromIndex(Number(a));
    const p = personalizeAlmanac(day, { yearBranch: gz.branch });
    return { ...base, forYear: ganzhiLabel(gz, locale), clashesWithUser: p.personal.clashesWithUser, harmsUser: p.personal.harmsUser, luckyNumbers: p.personal.luckyNumbers, luckyColor: p.personal.luckyColor.label };
  }
  const tz = std === 'vn' ? 'Asia/Ho_Chi_Minh' : 'UTC';
  const sky = dailySky(zonedNoonUtc(date, tz));
  const card = dailyCard(date, 'w:common').cards[0]!;
  const base = { card: { name: card.card.name_en, reversed: card.reversed, keywords: card.reversed ? card.card.keywords_reversed : card.card.keywords_upright }, moonSign: sky.moon.sign, moonPhase: sky.moon.phase.name, sunSign: sky.sun.sign, retrogrades: sky.retrogrades };
  if (a === 'common') return base;
  if (a === 'lp') return { ...base, lifePath: Number(b), personalDayHint: `life path ${b}` };
  if (a === 'sun') return { ...base, userSunSign: b };
  return base;
}

/** Deterministic copy used when AI is off (still locale-aware and fact-grounded). */
export function templateDaily(segment: string, facts: Record<string, unknown>, locale: Locale): DailyOutput {
  const vi = locale === 'vi';
  if (segment.startsWith('ea')) {
    const f = facts as { huangdao: boolean; zhixing: string; yi: string[]; ji: string[]; goodHours: string[]; luckyColor?: string; luckyNumbers?: number[]; clashesWithUser?: boolean };
    const good = f.huangdao;
    return {
      headline: vi ? (good ? 'Ngày hoàng đạo, hợp khởi sự' : 'Ngày hắc đạo, nên giữ nhịp chậm') : good ? 'An auspicious day to begin things' : 'A quieter day: keep the pace gentle',
      body: vi
        ? `Trực ${f.zhixing}. Nên: ${f.yi.slice(0, 3).join(', ')}. Kiêng: ${f.ji.slice(0, 2).join(', ')}.${f.clashesWithUser ? ' Ngày xung tuổi bạn, tránh quyết định lớn.' : ''}`
        : `Officer ${f.zhixing}. Favourable: ${f.yi.slice(0, 3).join(', ')}. Avoid: ${f.ji.slice(0, 2).join(', ')}.${f.clashesWithUser ? ' This day clashes with your birth year; postpone big decisions.' : ''}`,
      focus: vi ? (good ? 'Khởi đầu' : 'Củng cố') : good ? 'Beginnings' : 'Consolidate',
      luckyHint: vi ? `Giờ tốt: ${f.goodHours.slice(0, 3).join(', ')}${f.luckyColor ? ` · Màu ${f.luckyColor}` : ''}` : `Good hours: ${f.goodHours.slice(0, 3).join(', ')}${f.luckyColor ? ` · Colour ${f.luckyColor}` : ''}`,
    };
  }
  const f = facts as { card: { name: string; reversed: boolean; keywords: string[] }; moonSign: string; moonPhase: string };
  return {
    headline: vi ? `Lá bài hôm nay: ${f.card.name}${f.card.reversed ? ' (ngược)' : ''}` : `Card of the day: ${f.card.name}${f.card.reversed ? ' (reversed)' : ''}`,
    body: vi ? `Từ khoá: ${f.card.keywords.slice(0, 3).join(', ')}. Mặt Trăng ở ${f.moonSign}, pha ${f.moonPhase}.` : `Keywords: ${f.card.keywords.slice(0, 3).join(', ')}. Moon in ${f.moonSign}, ${f.moonPhase}.`,
    focus: f.card.keywords[0] ?? (vi ? 'Lắng nghe' : 'Listen'),
    luckyHint: vi ? `Mặt Trăng ${f.moonSign}` : `Moon in ${f.moonSign}`,
  };
}

export async function runDailyOracleJob(app: FastifyInstance, opts: DailyJobOptions): Promise<DailyJobResult> {
  const ai = aiAvailable(app);
  if (ai) process.env.ANTHROPIC_API_KEY = app.config.ANTHROPIC_API_KEY;
  let generated = 0;
  let skipped = 0;
  let costUsd = 0;
  for (const locale of opts.locales) {
    let segments = await segmentsFor(app, locale, false);
    if (opts.maxSegments) segments = segments.slice(0, opts.maxSegments);
    const existing = opts.force
      ? new Set<string>()
      : new Set((await app.db.select({ s: dailyContent.segmentKey }).from(dailyContent).where(and(eq(dailyContent.date, opts.date), eq(dailyContent.locale, locale), inArray(dailyContent.segmentKey, segments)))).map((r) => r.s));
    for (const segment of segments) {
      if (existing.has(segment)) {
        skipped++;
        continue;
      }
      const facts = factsForSegment(segment, opts.date, locale);
      let daily: DailyOutput;
      let model: string | null = null;
      if (ai) {
        try {
          const r = await composeDaily({ locale, segmentKey: segment, facts }, { model: app.config.AI_MODEL_DAILY });
          daily = r.daily;
          model = r.model;
          costUsd += r.costUsd;
        } catch (err) {
          app.log.warn({ err, segment }, 'daily compose failed; using template');
          daily = templateDaily(segment, facts, locale);
        }
      } else daily = templateDaily(segment, facts, locale);
      await app.db
        .insert(dailyContent)
        .values({ date: opts.date, locale, segmentKey: segment, payloadJson: { ...daily, facts, model, generatedAt: new Date().toISOString() } })
        .onConflictDoUpdate({ target: [dailyContent.date, dailyContent.locale, dailyContent.segmentKey], set: { payloadJson: { ...daily, facts, model, generatedAt: new Date().toISOString() } } });
      generated++;
    }
  }
  app.metrics.inc('daily_oracle_generated_total', {}, generated);
  return { date: opts.date, generated, skipped, costUsd, ai };
}

/** Users whose chosen daily hour is "now" in their zone (for the push scheduler). */
export async function usersDueForPush(app: FastifyInstance, now = new Date()): Promise<Array<{ id: string; tz: string; locale: string }>> {
  const rows = await app.db.select({ id: users.id, tz: users.tz, locale: users.locale, dailyHour: users.dailyHour }).from(users);
  return rows.filter((u) => {
    const h = Number(new Intl.DateTimeFormat('en-US', { timeZone: u.tz, hour: 'numeric', hour12: false }).format(now));
    return h % 24 === u.dailyHour;
  });
}

/** Hourly scheduler: generate for "today" in zones that just crossed midnight (all enabled locales). */
export function startDailyScheduler(app: FastifyInstance, locales: Locale[]): () => void {
  const tick = async () => {
    const dates = new Set<string>();
    for (const off of [-12, -7, -5, 0, 1, 7, 8, 9, 10]) dates.add(new Date(Date.now() + off * 3600 * 1000).toISOString().slice(0, 10));
    for (const date of dates) {
      try {
        const r = await runDailyOracleJob(app, { date, locales });
        if (r.generated) app.log.info(r, 'daily oracle generated');
      } catch (err) {
        app.log.error({ err, date }, 'daily oracle job failed');
      }
    }
    try {
      app.log.info(await runTrialReminderJob(app), 'trial reminders');
    } catch (err) {
      app.log.error({ err }, 'trial reminder job failed');
    }
  };
  const pushTick = async () => {
    try {
      const r = await runDailyPushJob(app);
      if (r.candidates) app.log.info(r, 'daily push');
    } catch (err) {
      app.log.error({ err }, 'daily push job failed');
    }
  };
  void tick();
  void pushTick();
  const h1 = setInterval(() => void tick(), 60 * 60 * 1000);
  const h2 = setInterval(() => void pushTick(), 15 * 60 * 1000);
  return () => {
    clearInterval(h1);
    clearInterval(h2);
  };
}
