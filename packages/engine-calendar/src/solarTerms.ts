import { Solar } from 'lunar-typescript';

/** The 12 "Jie" (节) that open Bazi months, in branch order starting at 寅 (branch 2). */
export const JIE_NAMES = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'] as const;
export const JIE_NAMES_VI = ['Lập Xuân', 'Kinh Trập', 'Thanh Minh', 'Lập Hạ', 'Mang Chủng', 'Tiểu Thử', 'Lập Thu', 'Bạch Lộ', 'Hàn Lộ', 'Lập Đông', 'Đại Tuyết', 'Tiểu Hàn'] as const;
export const JIE_NAMES_EN = ['Start of Spring', 'Awakening of Insects', 'Clear and Bright', 'Start of Summer', 'Grain in Ear', 'Minor Heat', 'Start of Autumn', 'White Dew', 'Cold Dew', 'Start of Winter', 'Major Snow', 'Minor Cold'] as const;

/** All 24 terms in the order lunar-typescript emits them for a Gregorian year window. */
export const TERMS_24 = ['小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'] as const;

export interface SolarTermInstant {
  name: (typeof TERMS_24)[number];
  /** absolute instant */
  utc: Date;
  isJie: boolean;
}

const CN_OFFSET_MS = 8 * 3600 * 1000;
const cache = new Map<number, SolarTermInstant[]>();

/** lunar-typescript gives term instants as UTC+8 civil clock; convert to absolute instants. */
function cnClockToUtc(s: Solar): Date {
  return new Date(Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour(), s.getMinute(), s.getSecond()) - CN_OFFSET_MS);
}

/** Solar term instants that fall in Gregorian `year` (UTC), sorted ascending. */
export function solarTermsOfYear(year: number): SolarTermInstant[] {
  const hit = cache.get(year);
  if (hit) return hit;
  const table = Solar.fromYmd(year, 6, 1).getLunar().getJieQiTable();
  const out: SolarTermInstant[] = [];
  for (const [key, solar] of Object.entries(table)) {
    if (!(TERMS_24 as readonly string[]).includes(key)) continue; // skip upper-case aliases of neighbours
    const utc = cnClockToUtc(solar);
    out.push({ name: key as SolarTermInstant['name'], utc, isJie: (JIE_NAMES as readonly string[]).includes(key) });
  }
  out.sort((a, b) => a.utc.getTime() - b.utc.getTime());
  cache.set(year, out);
  return out;
}

/** Instant of 立春 (Start of Spring) for Gregorian year. */
export function lichunUtc(year: number): Date {
  const t = solarTermsOfYear(year).find((x) => x.name === '立春');
  if (!t) throw new Error(`no 立春 for ${year}`);
  return t.utc;
}

/** Latest Jie at or before `utc`, searching current and previous year. */
export function currentJie(utc: Date): { name: (typeof JIE_NAMES)[number]; index: number; utc: Date } {
  const y = utc.getUTCFullYear();
  const all = [...solarTermsOfYear(y - 1), ...solarTermsOfYear(y), ...solarTermsOfYear(y + 1)].filter((t) => t.isJie);
  let best: SolarTermInstant | undefined;
  for (const t of all) if (t.utc.getTime() <= utc.getTime()) best = t;
  if (!best) throw new Error('no preceding Jie');
  const index = (JIE_NAMES as readonly string[]).indexOf(best.name);
  return { name: best.name as (typeof JIE_NAMES)[number], index, utc: best.utc };
}

/** Current 24-term (Jie or Qi) at or before `utc` and the next one. */
export function currentSolarTerm(utc: Date): { current: SolarTermInstant; next: SolarTermInstant } {
  const y = utc.getUTCFullYear();
  const all = [...solarTermsOfYear(y - 1), ...solarTermsOfYear(y), ...solarTermsOfYear(y + 1)];
  let i = -1;
  for (let k = 0; k < all.length; k++) if ((all[k] as SolarTermInstant).utc.getTime() <= utc.getTime()) i = k;
  if (i < 0 || i + 1 >= all.length) throw new Error('solar term lookup out of range');
  return { current: all[i] as SolarTermInstant, next: all[i + 1] as SolarTermInstant };
}
