import type { BirthInput, CalendarStandard } from '@findme/engine-core';
import { resolveBirthMoment, type BirthMoment, type MomentOptions } from './moment.js';
import { computePillars, type FourPillars, type PillarOptions } from './pillars.js';
import { civilToLunar, type LunarResult } from './lunar.js';
import { currentSolarTerm, solarTermsOfYear } from './solarTerms.js';

export interface ResolvedBirth {
  moment: BirthMoment;
  /** lunisolar date per national standard, from the civil local clock */
  lunar: LunarResult;
  /** lunisolar date using the true-solar clock & 23:00 day roll (what most Zi Wei practitioners enter) */
  lunarForChart: LunarResult;
  pillars: FourPillars;
}

/** One-stop resolution used by Bazi/Ziwei/Almanac engines. */
export function resolveBirth(input: BirthInput, opts: { moment?: MomentOptions; pillars?: PillarOptions } = {}): ResolvedBirth {
  const moment = resolveBirthMoment(input, opts.moment);
  const pillars = computePillars(moment, opts.pillars);
  const std: CalendarStandard = input.calendarStandard;
  const lunar = civilToLunar(moment.local.year, moment.local.month, moment.local.day, std, moment.timeUnknown ? undefined : moment.local.hour, moment.local.minute);
  const c = pillars.options.clock === 'solar' ? moment.solar : moment.local;
  let [y, m, d] = [c.year, c.month, c.day];
  if (pillars.isLateZi && pillars.options.dayBoundary === '23:00') {
    const n = new Date(Date.UTC(y, m - 1, d + 1));
    [y, m, d] = [n.getUTCFullYear(), n.getUTCMonth() + 1, n.getUTCDate()];
  }
  const lunarForChart = civilToLunar(y, m, d, std, moment.timeUnknown ? undefined : c.hour, c.minute);
  return { moment, lunar, lunarForChart, pillars };
}

export const CalendarProvider = { resolveBirth, resolveBirthMoment, computePillars, civilToLunar, solarTermsOfYear, currentSolarTerm };
