/**
 * Offline Daily Oracle: when GET /v1/today fails, rebuild the payload on device with the engines,
 * using the self profile's birth input cached in the secure tier (keychain / MMKV-encrypted).
 * No LLM copy is available offline → `content` is empty and the card shows engine facts only.
 */
import { ganzhiFromStemBranch, type BirthInput, type CalendarStandard, type Locale, type TraditionPack } from '@findme/engine-core';
import { getDayAlmanac, personalizeAlmanac, type ProfileCore } from '@findme/engine-almanac';
import { dailySky } from '@findme/engine-astro';
import { computeBazi } from '@findme/engine-bazi';
import { parseDate, personalDay, lifePath } from '@findme/engine-numerology';
import { dailyCard, type DrawnCard } from '@findme/engine-tarot';
import { sunSign } from '@findme/engine-astro';
import { resolveBirthMoment } from '@findme/engine-calendar';
import type { DailyPayload } from '@findme/ui';
import { cache, secure } from './storage';

export const BIRTH_CACHE_KEY = 'findme.birth.self';

export interface CachedBirth extends BirthInput {
  profileId: string;
  fullName?: string;
  /** engine-almanac personalisation (from core_json.eastAsia) */
  profileCore?: ProfileCore | null;
}

export async function cacheSelfBirth(b: CachedBirth): Promise<void> {
  await secure.set(BIRTH_CACHE_KEY, JSON.stringify(b));
}
export async function loadSelfBirth(): Promise<CachedBirth | null> {
  const raw = await secure.get(BIRTH_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedBirth;
  } catch {
    return null;
  }
}
export async function clearSelfBirth(): Promise<void> {
  await secure.delete(BIRTH_CACHE_KEY);
}

/** UTC instant of local noon in tz (same sampling as the API). */
export function zonedNoonUtc(date: string, tz: string): Date {
  const guess = new Date(`${date}T12:00:00Z`);
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(guess);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'));
    return new Date(guess.getTime() - (asUtc - guess.getTime()));
  } catch {
    return guess;
  }
}

export interface OfflineTodayInput {
  date: string;
  tz: string;
  locale: Locale;
  traditionPack: TraditionPack;
  calendarStandard: CalendarStandard;
  birth: CachedBirth | null;
  streak?: DailyPayload['streak'];
}

export function tarotForToday(date: string, segment: string): { draw: DrawnCard; keywords: string[] } {
  const draw = dailyCard(date, segment).cards[0]!;
  return { draw, keywords: draw.reversed ? draw.card.keywords_reversed : draw.card.keywords_upright };
}

/** Deterministic, pure. Throws only if an engine throws on malformed birth input. */
export function computeOfflineToday(input: OfflineTodayInput): DailyPayload {
  const { date, tz, locale, traditionPack, birth } = input;
  const wantEast = traditionPack === 'eastAsia' || traditionPack === 'both';
  const wantWest = traditionPack === 'western' || traditionPack === 'both';
  const segments: string[] = [];
  const payload: DailyPayload = { date, tz, locale, traditionPack, profileId: birth?.profileId ?? null, needsProfile: !birth, segments, content: {}, streak: input.streak ?? { current: 0, longest: 0, lastDate: null } };

  let profileCore: ProfileCore | null = birth?.profileCore ?? null;
  if (wantEast) {
    segments.push('ea:common');
    const std = birth?.calendarStandard ?? input.calendarStandard;
    const day = getDayAlmanac(date, std, locale);
    if (birth && !profileCore) {
      try {
        const bazi = computeBazi(birth, { locale, now: date, annualWindow: 0 });
        profileCore = { yearBranch: bazi.resolved.lunar.yearGanzhi.branch, yearStem: bazi.resolved.lunar.yearGanzhi.stem, usefulElements: bazi.favorable.useful, dayMasterElement: bazi.dayMaster.element };
      } catch {
        profileCore = null;
      }
    }
    if (profileCore && profileCore.yearStem !== undefined) segments.push(`ea:${ganzhiFromStemBranch(profileCore.yearStem, profileCore.yearBranch).index}`);
    payload.eastAsia = { almanac: profileCore ? personalizeAlmanac(day, profileCore) : day, atomKeys: [] };
  }
  if (wantWest) {
    segments.push('w:common');
    let pd: number | null = null;
    let lp: number | null = null;
    let sun: string | null = null;
    if (birth) {
      try {
        pd = personalDay(parseDate(birth.date), parseDate(date)).value;
        lp = lifePath(parseDate(birth.date)).value;
        sun = sunSign(resolveBirthMoment(birth).utc);
      } catch {
        /* keep nulls */
      }
    }
    if (lp !== null) segments.push(`w:lp:${lp}`);
    if (sun) segments.push(`w:sun:${sun}`);
    let sky: ReturnType<typeof dailySky> | null = null;
    try {
      sky = dailySky(zonedNoonUtc(date, tz));
    } catch {
      sky = null;
    }
    payload.western = { personalDay: pd, sky, lifePath: lp, sunSign: sun, atomKeys: [] };
    const { draw, keywords } = tarotForToday(date, 'w:common');
    payload.tarot = { card: { id: draw.card.id, name: draw.card.name_en, reversed: draw.reversed, position: { key: 'card', label: '' } }, keywords };
  }
  return payload;
}

const TODAY_CACHE = (date: string, locale: string) => `today:${date}:${locale}`;
export function cacheToday(payload: DailyPayload): void {
  cache.set(TODAY_CACHE(payload.date, payload.locale), payload, 86_400_000);
}
export function cachedToday(date: string, locale: string): DailyPayload | null {
  return cache.get<DailyPayload>(TODAY_CACHE(date, locale));
}
