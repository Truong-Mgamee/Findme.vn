import { Solar } from 'lunar-typescript';
import { ganzhiFromHan, ganzhiFromStemBranch, ganzhiOfYear, type GanZhi } from '@findme/engine-core';
import type { BirthMoment } from './moment.js';
import { currentJie, lichunUtc } from './solarTerms.js';

export type DayBoundary = '23:00' | '00:00';

export interface PillarOptions {
  /** Which clock drives day/hour pillars. Default 'solar' (true solar time). */
  clock?: 'solar' | 'local';
  /** When does the day pillar roll over. '23:00' (late Zi belongs to next day) is the common Bazi convention. */
  dayBoundary?: DayBoundary;
}

export interface FourPillars {
  year: GanZhi;
  month: GanZhi;
  day: GanZhi;
  /** null when birth time unknown */
  hour: GanZhi | null;
  /** 0..11, null when unknown */
  hourBranch: number | null;
  /** solar-term year number (changes at 立春) */
  solarYear: number;
  /** index 0..11 of the Jie opening the month (0 = 立春/寅) */
  jieIndex: number;
  isLateZi: boolean;
  options: Required<PillarOptions>;
}

/** Day ganzhi for a civil Gregorian date (independent of national lunar standard). */
export function dayGanzhi(year: number, month: number, day: number): GanZhi {
  return ganzhiFromHan(Solar.fromYmd(year, month, day).getLunar().getDayInGanZhi());
}

export function hourBranchOf(hour: number, minute: number): number {
  const mins = hour * 60 + minute;
  return Math.floor(((mins + 60) % 1440) / 120);
}

/** 五虎遁: month stem from year stem + month branch */
export function monthStem(yearStem: number, monthBranch: number): number {
  return ((yearStem % 5) * 2 + 2 + ((monthBranch - 2 + 12) % 12)) % 10;
}

/** 五鼠遁: hour stem from day stem + hour branch */
export function hourStem(dayStem: number, hourBranch: number): number {
  return ((dayStem % 5) * 2 + hourBranch) % 10;
}

function addDays(y: number, m: number, d: number, n: number): [number, number, number] {
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()];
}

/**
 * Four Pillars from a resolved moment. Year & month follow absolute solar-term instants
 * (so they are correct for any time zone); day & hour follow the chosen local clock.
 */
export function computePillars(moment: BirthMoment, opts: PillarOptions = {}): FourPillars {
  const options: Required<PillarOptions> = { clock: opts.clock ?? 'solar', dayBoundary: opts.dayBoundary ?? '23:00' };
  const c = options.clock === 'solar' ? moment.solar : moment.local;

  // Year by 立春
  const civilYear = c.year;
  const solarYear = moment.utc.getTime() >= lichunUtc(civilYear).getTime() ? civilYear : civilYear - 1;
  const year = ganzhiOfYear(solarYear);

  // Month by latest Jie
  const jie = currentJie(moment.utc);
  const monthBranch = (jie.index + 2) % 12;
  const month = ganzhiFromStemBranch(monthStem(year.stem, monthBranch), monthBranch);

  // Day & hour
  const isLateZi = !moment.timeUnknown && c.hour === 23;
  let [dy, dm, dd]: [number, number, number] = [c.year, c.month, c.day];
  if (isLateZi && options.dayBoundary === '23:00') [dy, dm, dd] = addDays(dy, dm, dd, 1);
  const day = dayGanzhi(dy, dm, dd);

  let hour: GanZhi | null = null;
  let hb: number | null = null;
  if (!moment.timeUnknown) {
    hb = hourBranchOf(c.hour, c.minute);
    // With a midnight boundary, late-Zi hour stem still derives from the NEXT day's stem.
    const stemBase = isLateZi && options.dayBoundary === '00:00' ? dayGanzhi(...addDays(dy, dm, dd, 1)).stem : day.stem;
    hour = ganzhiFromStemBranch(hourStem(stemBase, hb), hb);
  }

  return { year, month, day, hour, hourBranch: hb, solarYear, jieIndex: jie.index, isLateZi, options };
}
