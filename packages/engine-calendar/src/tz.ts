import { DateTime, FixedOffsetZone, IANAZone } from 'luxon';
import type { EngineWarning } from '@findme/engine-core';

export interface ResolvedZone {
  zone: string;
  estimated: boolean;
  warnings: EngineWarning[];
}

/**
 * Resolve an IANA zone. When missing/invalid, estimate a fixed offset from longitude
 * (15° per hour). Server callers should pre-resolve with geo-tz; this fallback keeps the
 * engine usable offline on device.
 */
export function resolveZone(tz: string | undefined, lng: number): ResolvedZone {
  if (tz && IANAZone.isValidZone(tz)) return { zone: tz, estimated: false, warnings: [] };
  const hours = Math.round(lng / 15);
  const sign = hours >= 0 ? '+' : '-';
  const zone = `UTC${sign}${Math.abs(hours)}`;
  return {
    zone,
    estimated: true,
    warnings: [
      {
        code: 'TZ_ESTIMATED',
        message: `Time zone unknown for place; estimated ${zone} from longitude ${lng}. Hour pillar may be off by up to 1h.`,
      },
    ],
  };
}

export function zoneFromSpec(zone: string) {
  return IANAZone.isValidZone(zone) ? IANAZone.create(zone) : FixedOffsetZone.parseSpecifier(zone) ?? FixedOffsetZone.utcInstance;
}

export function localDateTime(date: string, time: string, zone: string): DateTime {
  return DateTime.fromISO(`${date}T${time}`, { zone: zoneFromSpec(zone) });
}
