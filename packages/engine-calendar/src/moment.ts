import { DateTime } from 'luxon';
import type { BirthInput, CalendarStandard, EngineWarning } from '@findme/engine-core';
import { localDateTime, resolveZone } from './tz.js';
import { trueSolarOffsetMinutes } from './solarTime.js';

export interface CivilClock {
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  time: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface BirthMoment {
  /** zone used for civil time */
  zone: string;
  zoneOffsetMinutes: number;
  dstApplied: boolean;
  /** civil local wall-clock at birthplace */
  local: CivilClock;
  /** apparent solar time wall-clock (same calendar-day semantics as local). Equals local when disabled. */
  solar: CivilClock;
  /** minutes added to local to obtain solar */
  solarCorrectionMinutes: number;
  /** absolute instant */
  utc: Date;
  timeUnknown: boolean;
  calendarStandard: CalendarStandard;
  lng: number;
  lat: number;
  warnings: EngineWarning[];
}

export interface MomentOptions {
  /** Apply fixed −30 min for Korean Saju convention when true solar time is disabled. */
  koreanSolarTimeAdjust?: boolean;
}

function clock(dt: DateTime): CivilClock {
  return {
    date: dt.toFormat('yyyy-LL-dd'),
    time: dt.toFormat('HH:mm'),
    year: dt.year,
    month: dt.month,
    day: dt.day,
    hour: dt.hour,
    minute: dt.minute,
  };
}

/** Normalises a BirthInput into absolute + local + true-solar clocks. Pure; no I/O. */
export function resolveBirthMoment(input: BirthInput, opts: MomentOptions = {}): BirthMoment {
  const warnings: EngineWarning[] = [];
  const z = resolveZone(input.place.tz, input.place.lng);
  warnings.push(...z.warnings);

  let time = input.time ?? '12:00';
  if (input.timeUnknown) {
    time = '12:00';
    warnings.push({ code: 'TIME_UNKNOWN', message: 'Birth time unknown; noon assumed. Hour pillar omitted; Zi Wei chart is approximate.' });
  }
  const dt = localDateTime(input.date, time, z.zone);
  if (!dt.isValid) throw new Error(`Invalid birth date/time: ${input.date} ${time} (${dt.invalidExplanation ?? dt.invalidReason})`);

  const useTrueSolar = input.useTrueSolarTime !== false;
  let correction = 0;
  if (useTrueSolar) {
    correction = trueSolarOffsetMinutes(dt.toJSDate(), input.place.lng, dt.offset);
  } else if (opts.koreanSolarTimeAdjust && input.calendarStandard === 'kr') {
    correction = -30;
  }
  const solarDt = dt.plus({ minutes: Math.round(correction) });

  return {
    zone: z.zone,
    zoneOffsetMinutes: dt.offset,
    dstApplied: dt.isInDST,
    local: clock(dt),
    solar: clock(solarDt),
    solarCorrectionMinutes: Math.round(correction * 10) / 10,
    utc: dt.toUTC().toJSDate(),
    timeUnknown: input.timeUnknown,
    calendarStandard: input.calendarStandard,
    lng: input.place.lng,
    lat: input.place.lat,
    warnings,
  };
}
