import { Lunar, Solar } from 'lunar-typescript';
import { LunarDate as VnLunarDate, SolarDate } from 'lunar-date-vn';
import { ganzhiOfYear, type CalendarStandard, type EngineWarning, type GanZhi, type LunarDate } from '@findme/engine-core';
import { hourBranchOf } from './pillars.js';

export interface LunarResult extends LunarDate {
  /** Year ganzhi by lunar new year (used by Zi Wei and almanac display) */
  yearGanzhi: GanZhi;
  /** true when the standard is an approximation (kr/jp currently reuse the UTC+8 computation) */
  approximation: boolean;
  warnings: EngineWarning[];
}

/**
 * Convert a civil Gregorian date (at the birthplace / user location) into the lunisolar date
 * of the given national standard.
 *  - vn: Hồ Ngọc Đức algorithm at UTC+7 (lunar-date-vn)
 *  - cn: UTC+8 (lunar-typescript) — also used for TW/HK/SG/MY
 *  - kr/jp: UTC+9 standards; approximated with the UTC+8 computation until a KASI-verified table is added.
 */
export function civilToLunar(year: number, month: number, day: number, standard: CalendarStandard, hour?: number, minute?: number): LunarResult {
  const hourBranch = hour === undefined ? null : hourBranchOf(hour, minute ?? 0);
  const warnings: EngineWarning[] = [];
  if (standard === 'vn') {
    const l = new SolarDate({ day, month, year, yearIndex: 0, hour: 0 }).toLunarDate();
    if (!l) throw new Error(`lunar-date-vn could not convert ${year}-${month}-${day}`);
    const g = l.get();
    return {
      year: g.year,
      month: g.month,
      isLeapMonth: !!g.leap_month,
      day: g.day,
      hourBranch,
      standard,
      yearGanzhi: ganzhiOfYear(g.year),
      approximation: false,
      warnings,
    };
  }
  const l = Solar.fromYmd(year, month, day).getLunar();
  const approximation = standard === 'kr' || standard === 'jp';
  if (approximation)
    warnings.push({ code: 'LUNAR_STD_APPROX', message: `${standard} lunar standard approximated with UTC+8 rules; dates may differ by one day around new moons near midnight.` });
  return {
    year: l.getYear(),
    month: Math.abs(l.getMonth()),
    isLeapMonth: l.getMonth() < 0,
    day: l.getDay(),
    hourBranch,
    standard,
    yearGanzhi: ganzhiOfYear(l.getYear()),
    approximation,
    warnings,
  };
}

/** Inverse: lunisolar date → civil Gregorian (YYYY-MM-DD) under a standard. */
export function lunarToCivil(year: number, month: number, day: number, isLeapMonth: boolean, standard: CalendarStandard): string {
  if (standard === 'vn') {
    const l = new VnLunarDate({ day, month, year, leap_month: isLeapMonth, yearIndex: 0, hour: 0 });
    l.init();
    const s = l.toSolarDate();
    if (!s) throw new Error('lunar-date-vn inverse failed');
    const g = s.get();
    return `${g.year}-${String(g.month).padStart(2, '0')}-${String(g.day).padStart(2, '0')}`;
  }
  return Lunar.fromYmd(year, isLeapMonth ? -month : month, day).getSolar().toYmd();
}
