/**
 * Daily Oracle assembly (docs/04 §9 step 5): join pre-generated `daily_content` segment rows with
 * per-user facts (personalised almanac, personal day, sky, streak). When no job has run for the
 * day yet, facts are computed on the fly so the screen is never empty.
 */
import { and, eq, inArray } from 'drizzle-orm';
import type { Locale } from '@findme/engine-core';
import { atomKeysForAlmanac, type DayAlmanac, type PersonalizedAlmanac } from '@findme/engine-almanac';
import { atomKeysForDailySky, dailySky } from '@findme/engine-astro';
import { parseDate, personalDay } from '@findme/engine-numerology';
import type { Db } from '../db/client.js';
import { dailyContent, streaks, type User } from '../db/schema.js';
import { decryptJson } from '../lib/crypto.js';
import { addDays, localDate } from '../lib/locale.js';
import type { KvStore } from '../lib/store.js';
import { almanacFor, type StoredBirth } from './engines.js';
import { selfProfile } from './profiles.js';

export interface TodayPayload {
  date: string;
  tz: string;
  locale: Locale;
  traditionPack: string;
  profileId: string | null;
  needsProfile: boolean;
  segments: string[];
  /** daily_content rows keyed by segment (LLM copy from the Daily Oracle job) */
  content: Record<string, Record<string, unknown>>;
  eastAsia?: { almanac: DayAlmanac | PersonalizedAlmanac; atomKeys: string[] };
  western?: { personalDay: number | null; sky: ReturnType<typeof dailySky>; lifePath: number | null; sunSign: string | null; atomKeys: string[] };
  streak: { current: number; longest: number; lastDate: string | null };
}

/** UTC instant of local noon in `tz` on `date` (Moon moves ~13°/day, so noon is the fairest sample). */
export function zonedNoonUtc(date: string, tz: string): Date {
  const guess = new Date(`${date}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(guess);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'));
  const offsetMs = asUtc - guess.getTime();
  return new Date(guess.getTime() - offsetMs);
}

export async function cachedAlmanac(store: KvStore, date: string, std: StoredBirth['calendarStandard'], locale: Locale): Promise<DayAlmanac> {
  const key = `almanac:${date}:${std}:${locale}`;
  const hit = await store.get(key);
  if (hit) return JSON.parse(hit) as DayAlmanac;
  const day = almanacFor(date, std, locale) as DayAlmanac;
  await store.set(key, JSON.stringify(day), 86400);
  return day;
}

export async function touchStreak(db: Db, userId: string, today: string) {
  const [row] = await db.select().from(streaks).where(eq(streaks.userId, userId)).limit(1);
  if (!row) {
    await db.insert(streaks).values({ userId, current: 1, longest: 1, lastDate: today });
    return { current: 1, longest: 1, lastDate: today };
  }
  if (row.lastDate === today) return { current: row.current, longest: row.longest, lastDate: row.lastDate };
  const current = row.lastDate === addDays(today, -1) ? row.current + 1 : 1;
  const longest = Math.max(row.longest, current);
  await db.update(streaks).set({ current, longest, lastDate: today }).where(eq(streaks.userId, userId));
  return { current, longest, lastDate: today };
}

export async function assembleToday(deps: { db: Db; store: KvStore; encKey: Buffer }, user: User, tz: string, locale: Locale, now = new Date()): Promise<TodayPayload> {
  const date = localDate(tz, now);
  const profile = await selfProfile(deps.db, user.id);
  const core = profile?.coreJson ?? null;
  const pack = user.traditionPack;
  const wantEast = pack === 'eastAsia' || pack === 'both';
  const wantWest = pack === 'western' || pack === 'both';
  const segments: string[] = [];
  const payload: TodayPayload = { date, tz, locale, traditionPack: pack, profileId: profile?.id ?? null, needsProfile: !profile, segments, content: {}, streak: { current: 0, longest: 0, lastDate: null } };

  if (wantEast) {
    segments.push('ea:common');
    if (core?.eastAsia) segments.push(`ea:${core.eastAsia.lunar.yearGanzhi.index}`);
    const std = (core?.calendarStandard ?? user.calendarStandard) as StoredBirth['calendarStandard'];
    const day = await cachedAlmanac(deps.store, date, std, locale);
    const almanac = core ? almanacFor(date, std, locale, core) : day;
    payload.eastAsia = { almanac, atomKeys: atomKeysForAlmanac(almanac, 'personal' in almanac ? (almanac as PersonalizedAlmanac).personal : undefined) };
  }
  if (wantWest) {
    segments.push('w:common');
    const sky = dailySky(zonedNoonUtc(date, tz));
    let pd: number | null = null;
    const lifePath = core?.western?.numerology.lifePath ?? null;
    const sunSign = core?.western?.astro.sun ?? null;
    if (profile) {
      const birth = decryptJson<StoredBirth>(profile.birthEnc, deps.encKey);
      pd = personalDay(parseDate(birth.date), parseDate(date)).value;
    }
    if (lifePath !== null) segments.push(`w:lp:${lifePath}`);
    if (sunSign) segments.push(`w:sun:${sunSign}`);
    payload.western = { personalDay: pd, sky, lifePath, sunSign, atomKeys: [...(pd !== null ? [`numerology.personalday.${pd}`] : []), ...atomKeysForDailySky(sky)] };
  }

  if (segments.length) {
    const rows = await deps.db
      .select()
      .from(dailyContent)
      .where(and(eq(dailyContent.date, date), inArray(dailyContent.locale, locale === 'en' ? ['en'] : [locale, 'en']), inArray(dailyContent.segmentKey, segments)));
    for (const seg of segments) {
      const row = rows.find((r) => r.segmentKey === seg && r.locale === locale) ?? rows.find((r) => r.segmentKey === seg);
      if (row) payload.content[seg] = row.payloadJson;
    }
  }
  payload.streak = await touchStreak(deps.db, user.id, date);
  return payload;
}
