/**
 * Geocentric apparent ecliptic positions via astronomy-engine (MIT, ±1 arcmin).
 *
 * Frame: true ecliptic and equinox of date (ECT). astronomy-engine's `Ecliptic()` converts a
 * J2000 equatorial vector (EQJ) to true-ecliptic-of-date angles; `SunPosition()` and
 * `EclipticGeoMoon()` already return ECT. Planet vectors are requested with aberration
 * correction (`GeoVector(body, date, true)`), giving *apparent* positions — the same
 * convention as astrological ephemerides.
 */
import * as Astronomy from 'astronomy-engine';
import type { PlanetKey } from './zodiac.js';
import { normalizeDegrees, wrap180 } from './zodiac.js';

export type NodeKey = 'northNode';
export type BodyKey = PlanetKey | NodeKey;

export const PLANET_KEYS: ReadonlyArray<PlanetKey> = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
];

export const BODY_KEYS: ReadonlyArray<BodyKey> = [...PLANET_KEYS, 'northNode'];

export const LUMINARIES: ReadonlySet<BodyKey> = new Set<BodyKey>(['sun', 'moon']);

const ASTRO_BODY: Record<Exclude<PlanetKey, 'sun' | 'moon'>, Astronomy.Body> = {
  mercury: Astronomy.Body.Mercury,
  venus: Astronomy.Body.Venus,
  mars: Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn: Astronomy.Body.Saturn,
  uranus: Astronomy.Body.Uranus,
  neptune: Astronomy.Body.Neptune,
  pluto: Astronomy.Body.Pluto,
};

export interface EclipticPosition {
  /** Ecliptic longitude of date, degrees [0, 360) */
  lon: number;
  /** Ecliptic latitude, degrees */
  lat: number;
}

export interface BodyPosition extends EclipticPosition {
  body: BodyKey;
  /** Longitudinal speed in degrees/day (lon(t) − lon(t − 1d), wrapped). Negative = retrograde. */
  speed: number;
  retrograde: boolean;
}

const DAY_MS = 86_400_000;
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);

/** Julian centuries since J2000.0 (UT; the TT−UT difference is negligible for the node). */
export function julianCenturies(date: Date): number {
  return (date.getTime() - J2000_MS) / (DAY_MS * 36525);
}

/**
 * Mean longitude of the Moon's ascending node (Meeus, *Astronomical Algorithms*, 2nd ed.,
 * eq. 47.7):
 *
 *   Ω = 125.044 52 − 1934.136 261 T + 0.002 0708 T² + T³ / 450 000   (degrees)
 *
 * T = Julian centuries from J2000.0. Mean node, not true node (true node oscillates ±1.5°
 * around it with a 173-day period). Astrologers commonly accept either.
 */
export function meanLunarNode(date: Date): number {
  const T = julianCenturies(date);
  return normalizeDegrees(125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000);
}

/** Geocentric apparent ecliptic lon/lat of one body at a UTC instant. */
export function bodyPosition(body: BodyKey, dateUTC: Date): EclipticPosition {
  assertDate(dateUTC);
  switch (body) {
    case 'sun': {
      const s = Astronomy.SunPosition(dateUTC);
      return { lon: normalizeDegrees(s.elon), lat: s.elat };
    }
    case 'moon': {
      const m = Astronomy.EclipticGeoMoon(dateUTC);
      return { lon: normalizeDegrees(m.lon), lat: m.lat };
    }
    case 'northNode':
      return { lon: meanLunarNode(dateUTC), lat: 0 };
    default: {
      const vec = Astronomy.GeoVector(ASTRO_BODY[body], dateUTC, true);
      const e = Astronomy.Ecliptic(vec);
      return { lon: normalizeDegrees(e.elon), lat: e.elat };
    }
  }
}

/**
 * Positions of Sun → Pluto plus the mean North Node, with a retrograde flag obtained by
 * comparing the longitude with that of one day earlier.
 */
export function planetPositions(dateUTC: Date): BodyPosition[] {
  assertDate(dateUTC);
  const prev = new Date(dateUTC.getTime() - DAY_MS);
  return BODY_KEYS.map((body) => {
    const now = bodyPosition(body, dateUTC);
    const before = bodyPosition(body, prev);
    const speed = wrap180(now.lon - before.lon);
    // Sun and Moon never retrograde geocentrically; mean node is always retrograde.
    const retrograde = body === 'sun' || body === 'moon' ? false : speed < 0;
    return { body, lon: now.lon, lat: now.lat, speed, retrograde };
  });
}

export type MoonPhaseName =
  | 'new'
  | 'waxingCrescent'
  | 'firstQuarter'
  | 'waxingGibbous'
  | 'full'
  | 'waningGibbous'
  | 'lastQuarter'
  | 'waningCrescent';

export const MOON_PHASE_NAMES: ReadonlyArray<MoonPhaseName> = [
  'new',
  'waxingCrescent',
  'firstQuarter',
  'waxingGibbous',
  'full',
  'waningGibbous',
  'lastQuarter',
  'waningCrescent',
];

export interface MoonPhaseInfo {
  /** Moon − Sun ecliptic longitude difference, degrees [0, 360). 0 new, 90 first quarter, 180 full, 270 last quarter. */
  angle: number;
  /** 8-phase name; each phase spans 45° centred on its cardinal angle. */
  name: MoonPhaseName;
  /** Illuminated fraction of the disc 0..1 (geometric approximation (1 − cos angle)/2). */
  illumination: number;
  /** True while the angle is increasing towards full (angle < 180). */
  waxing: boolean;
}

export function moonPhase(dateUTC: Date): MoonPhaseInfo {
  assertDate(dateUTC);
  const angle = normalizeDegrees(Astronomy.MoonPhase(dateUTC));
  const idx = Math.floor(normalizeDegrees(angle + 22.5) / 45) % 8;
  return {
    angle,
    name: MOON_PHASE_NAMES[idx] as MoonPhaseName,
    illumination: (1 - Math.cos((angle * Math.PI) / 180)) / 2,
    waxing: angle < 180,
  };
}

export function assertDate(d: Date): void {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) {
    throw new TypeError('Expected a valid Date (UTC instant)');
  }
}
