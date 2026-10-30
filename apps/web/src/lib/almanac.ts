import { civilToLunar } from '@findme/engine-calendar';
import { getDayAlmanac, type DayAlmanac, type TaskKey } from '@findme/engine-almanac';
import type { CalendarStandard } from '@findme/engine-core';
import { daysInMonth, pad2 } from './dates';

export const SEO_TASKS: readonly TaskKey[] = ['wedding', 'opening', 'moving', 'contract', 'travel', 'groundbreaking'];
export const ALL_TASKS: readonly TaskKey[] = [...SEO_TASKS, 'haircut', 'pray', 'burial', 'study'];

export function isTask(v: string): v is TaskKey {
  return (ALL_TASKS as readonly string[]).includes(v);
}

export interface MonthCell {
  date: string;
  day: number;
  weekday: number;
  lunarDay: number;
  lunarMonth: number;
  isLeapMonth: boolean;
  /** first day of a lunar month → show the month label */
  lunarMonthStart: boolean;
  huangdao: boolean;
  dayGanzhiHan: string;
}

/** Solar month grid with the lunar date of every day (engine-calendar, per national standard). */
export function monthGrid(y: number, m: number, standard: CalendarStandard, locale: 'vi' | 'en'): { cells: MonthCell[]; firstWeekday: number } {
  const n = daysInMonth(y, m);
  const cells: MonthCell[] = [];
  for (let d = 1; d <= n; d++) {
    const date = `${y}-${pad2(m)}-${pad2(d)}`;
    const lunar = civilToLunar(y, m, d, standard);
    const a = getDayAlmanac(date, standard, locale);
    cells.push({
      date,
      day: d,
      weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay(),
      lunarDay: lunar.day,
      lunarMonth: lunar.month,
      isLeapMonth: lunar.isLeapMonth,
      lunarMonthStart: lunar.day === 1,
      huangdao: a.huangdao,
      dayGanzhiHan: a.dayGanzhi.han,
    });
  }
  const firstWeekday = cells[0]?.weekday ?? 0;
  return { cells, firstWeekday };
}

export function almanacFor(date: string, standard: CalendarStandard, locale: 'vi' | 'en'): DayAlmanac {
  return getDayAlmanac(date, standard, locale);
}
