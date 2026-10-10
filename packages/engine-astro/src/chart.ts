/**
 * Natal chart assembly: planets in signs/houses, angles, cusps and major aspects.
 */
import type { Angles, Cusps, HouseSystem } from './houses.js';
import { houseOf, houses } from './houses.js';
import type { BodyKey, BodyPosition } from './positions.js';
import { LUMINARIES, PLANET_KEYS, bodyPosition, planetPositions } from './positions.js';
import type { EngineWarning } from '@findme/engine-core';
import type { SignKey } from './zodiac.js';
import { normalizeDegrees, signFromLongitude, wrap180 } from './zodiac.js';

export const ENGINE_ID = 'astro';
export const ENGINE_VERSION = '0.1.0';

export interface NatalChartInput {
  /** Birth instant as a UTC Date (resolve civil time + tz upstream via engine-calendar). */
  utc: Date;
  lat: number;
  lng: number;
  houseSystem?: HouseSystem;
}

export interface ChartPlanet extends BodyPosition {
  sign: SignKey;
  degree: number;
  minute: number;
  /** 1–12 */
  house: number;
}

export type AspectType = 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';

export interface AspectDef {
  type: AspectType;
  angle: number;
}

export const MAJOR_ASPECTS: ReadonlyArray<AspectDef> = [
  { type: 'conjunction', angle: 0 },
  { type: 'opposition', angle: 180 },
  { type: 'trine', angle: 120 },
  { type: 'square', angle: 90 },
  { type: 'sextile', angle: 60 },
];

export const ORB_LUMINARY = 8;
export const ORB_DEFAULT = 6;

export interface Aspect {
  a: BodyKey;
  b: BodyKey;
  type: AspectType;
  angle: number;
  /** Deviation from exact, degrees ≥ 0 */
  orb: number;
  /** Maximum orb allowed for this pair */
  maxOrb: number;
  /** True when the orb is shrinking (bodies moving towards exactness). */
  applying: boolean;
}

export interface NatalChart {
  input: { utc: string; lat: number; lng: number; houseSystem: HouseSystem };
  planets: ChartPlanet[];
  angles: Angles;
  /** 12 cusps, index 0 = house 1, absolute longitudes */
  houses: Cusps;
  /** House system actually used (Placidus may fall back to whole sign near the poles). */
  houseSystem: HouseSystem;
  aspects: Aspect[];
  sun: SignKey;
  moon: SignKey;
  rising: SignKey;
  warnings: EngineWarning[];
}

/** Orb allowance for a pair: 8° when either is a luminary, else 6°. */
export function orbFor(a: BodyKey, b: BodyKey): number {
  return LUMINARIES.has(a) || LUMINARIES.has(b) ? ORB_LUMINARY : ORB_DEFAULT;
}

/**
 * Major aspects among the given positions (default: the 10 planets; the node is excluded).
 * `applying` is derived from the bodies' daily speeds (orb one hour later < orb now).
 */
export function findAspects(
  positions: ReadonlyArray<BodyPosition>,
  bodies: ReadonlyArray<BodyKey> = PLANET_KEYS,
): Aspect[] {
  const list = positions.filter((p) => bodies.includes(p.body));
  const out: Aspect[] = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i] as BodyPosition;
      const b = list[j] as BodyPosition;
      const maxOrb = orbFor(a.body, b.body);
      const sepNow = Math.abs(wrap180(a.lon - b.lon));
      const dt = 1 / 24; // one hour, in days
      const sepNext = Math.abs(wrap180(a.lon + a.speed * dt - (b.lon + b.speed * dt)));
      let best: Aspect | undefined;
      for (const def of MAJOR_ASPECTS) {
        const orb = Math.abs(sepNow - def.angle);
        if (orb <= maxOrb && (!best || orb < best.orb)) {
          const orbNext = Math.abs(sepNext - def.angle);
          best = { a: a.body, b: b.body, type: def.type, angle: def.angle, orb, maxOrb, applying: orbNext < orb };
        }
      }
      if (best) out.push(best);
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

export function computeNatalChart(input: NatalChartInput): NatalChart {
  const houseSystem: HouseSystem = input.houseSystem ?? 'placidus';
  const h = houses(houseSystem, input.utc, input.lat, input.lng);
  const positions = planetPositions(input.utc);
  const planets: ChartPlanet[] = positions.map((p) => {
    const sp = signFromLongitude(p.lon);
    return { ...p, sign: sp.sign, degree: sp.degree, minute: sp.minute, house: houseOf(p.lon, h.cusps) };
  });
  const byBody = (k: BodyKey): ChartPlanet => planets.find((p) => p.body === k) as ChartPlanet;
  return {
    input: { utc: input.utc.toISOString(), lat: input.lat, lng: input.lng, houseSystem },
    planets,
    angles: h.angles,
    houses: h.cusps,
    houseSystem: h.effectiveSystem,
    aspects: findAspects(positions),
    sun: byBody('sun').sign,
    moon: byBody('moon').sign,
    rising: signFromLongitude(h.angles.asc).sign,
    warnings: [...h.warnings],
  };
}

export function sunSign(dateUTC: Date): SignKey {
  return signFromLongitude(bodyPosition('sun', dateUTC).lon).sign;
}

export function moonSign(dateUTC: Date): SignKey {
  return signFromLongitude(bodyPosition('moon', dateUTC).lon).sign;
}

export function risingSign(dateUTC: Date, lat: number, lng: number): SignKey {
  return signFromLongitude(houses('whole', dateUTC, lat, lng).angles.asc).sign;
}

/** Degrees from `from` forward to `to` along the zodiac, [0, 360). */
export function forwardArc(from: number, to: number): number {
  return normalizeDegrees(to - from);
}
