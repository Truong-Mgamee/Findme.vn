/**
 * Angles (ASC/MC) and house cusps: Whole Sign and Placidus.
 *
 * Conventions: longitudes are tropical, true ecliptic of date, degrees [0, 360).
 * `lng` is geographic longitude, east positive; `lat` geodetic latitude, north positive.
 */
import * as Astronomy from 'astronomy-engine';
import type { EngineWarning } from '@findme/engine-core';
import { assertDate } from './positions.js';
import { normalizeDegrees, signFromLongitude, wrap180 } from './zodiac.js';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

export type HouseSystem = 'placidus' | 'whole';

/** Placidus is undefined inside the polar circles; we fall back to Whole Sign beyond this. */
export const PLACIDUS_MAX_LAT = 66;

/** True obliquity of the ecliptic (mean obliquity + nutation in obliquity), degrees. */
export function obliquity(dateUTC: Date): number {
  assertDate(dateUTC);
  return Astronomy.e_tilt(Astronomy.MakeTime(dateUTC)).tobl;
}

/** Mean obliquity of the ecliptic, degrees (no nutation). */
export function meanObliquity(dateUTC: Date): number {
  assertDate(dateUTC);
  return Astronomy.e_tilt(Astronomy.MakeTime(dateUTC)).mobl;
}

/**
 * Local apparent sidereal time in degrees [0, 360).
 * astronomy-engine's `SiderealTime` returns Greenwich *apparent* sidereal time in hours;
 * LST = GAST + λ_east / 15 (hours) → ×15 for degrees. This is also the RAMC.
 */
export function localSiderealTime(dateUTC: Date, lng: number): number {
  assertDate(dateUTC);
  assertLngLat(0, lng);
  return normalizeDegrees(Astronomy.SiderealTime(dateUTC) * 15 + lng);
}

export interface Angles {
  asc: number;
  mc: number;
  dsc: number;
  ic: number;
  /** Right ascension of the MC (= local sidereal time), degrees */
  ramc: number;
  /** True obliquity used, degrees */
  obliquity: number;
}

/**
 * Ecliptic longitude of the point of the ecliptic whose right ascension is `ra`
 * (used for the MC and for Placidus cusps): tan λ = tan α / cos ε, quadrant-safe via atan2.
 */
export function eclipticLongitudeAtRA(ra: number, eps: number): number {
  const a = ra * DEG;
  return normalizeDegrees(Math.atan2(Math.sin(a), Math.cos(a) * Math.cos(eps * DEG)) * RAD);
}

/**
 * Standard ascendant formula (Meeus / textbook):
 *
 *   ASC = atan2( cos RAMC , −( sin RAMC · cos ε + tan φ · sin ε ) )
 *
 * `atan2` resolves the quadrant so the ASC always lies in the half-circle following the MC
 * (0° < ASC − MC < 180°) for |φ| < 90° − ε. Inside the polar circles the ecliptic can be
 * entirely above/below the horizon for part of the day and the ASC is still defined by this
 * formula but may jump; callers get a warning from `placidus()`.
 */
export function ascendant(ramc: number, lat: number, eps: number): number {
  const r = ramc * DEG;
  const e = eps * DEG;
  const phi = lat * DEG;
  const y = Math.cos(r);
  const x = -(Math.sin(r) * Math.cos(e) + Math.tan(phi) * Math.sin(e));
  return normalizeDegrees(Math.atan2(y, x) * RAD);
}

/** MC: ecliptic longitude culminating on the meridian = ecliptic point at RA = RAMC. */
export function midheaven(ramc: number, eps: number): number {
  return eclipticLongitudeAtRA(ramc, eps);
}

export function ascendantAndMC(dateUTC: Date, lat: number, lng: number): Angles {
  assertDate(dateUTC);
  assertLngLat(lat, lng);
  const eps = obliquity(dateUTC);
  const ramc = localSiderealTime(dateUTC, lng);
  let asc = ascendant(ramc, lat, eps);
  const mc = midheaven(ramc, eps);
  // Enforce the eastern-horizon convention (only ever needed at extreme latitudes).
  if (normalizeDegrees(asc - mc) >= 180) asc = normalizeDegrees(asc + 180);
  return {
    asc,
    mc,
    dsc: normalizeDegrees(asc + 180),
    ic: normalizeDegrees(mc + 180),
    ramc,
    obliquity: eps,
  };
}

/** 12 cusps (index 0 = house 1) as absolute longitudes in degrees. */
export type Cusps = readonly [
  number, number, number, number, number, number,
  number, number, number, number, number, number,
];

export interface HouseResult {
  system: HouseSystem;
  /** The system actually used (Placidus may fall back to whole sign). */
  effectiveSystem: HouseSystem;
  cusps: Cusps;
  angles: Angles;
  warnings: EngineWarning[];
}

/** Whole Sign houses: house 1 = the whole sign containing the ASC. */
export function wholeSign(asc: number): Cusps {
  const start = signFromLongitude(asc).signIndex * 30;
  return Array.from({ length: 12 }, (_, i) => normalizeDegrees(start + i * 30)) as unknown as Cusps;
}

export function wholeSignHouses(dateUTC: Date, lat: number, lng: number): HouseResult {
  const angles = ascendantAndMC(dateUTC, lat, lng);
  return { system: 'whole', effectiveSystem: 'whole', cusps: wholeSign(angles.asc), angles, warnings: [] };
}

/**
 * Placidus cusp by iteration.
 *
 * A Placidus cusp is the ecliptic point whose hour angle divides its own semi-arc into
 * thirds. With H = RAMC − α and semi-diurnal arc SDA(δ) = acos(−tan φ · tan δ):
 *   cusp 11: α = RAMC +  SDA/3           cusp 12: α = RAMC + 2·SDA/3
 *   cusp  2: α = RAMC + 60 + 2·SDA/3     cusp  3: α = RAMC + 120 + SDA/3
 * (cusps 2/3 trisect the semi-*nocturnal* arc 180 − SDA measured from the IC).
 * For an ecliptic point at right ascension α, tan δ = tan ε · sin α.
 * `base` is the constant term (0, 0, 60, 120) and `fraction` the multiplier of SDA.
 * Start from the equal-RA solution and iterate to convergence (fixed point, converges in a
 * handful of steps for |φ| ≤ 66°); then convert α to ecliptic longitude.
 * Returns NaN when the point is circumpolar (|−tan φ tan δ| > 1).
 */
function placidusCusp(ramc: number, lat: number, eps: number, base: number, fraction: number): number {
  const tanPhi = Math.tan(lat * DEG);
  const tanEps = Math.tan(eps * DEG);
  // Initial guess: equal division of right ascension (exact at the equator, where SDA = 90°).
  let ra = ramc + base + fraction * 90;
  for (let i = 0; i < 100; i++) {
    const dec = Math.atan(tanEps * Math.sin(ra * DEG));
    const cosSDA = -tanPhi * Math.tan(dec);
    if (cosSDA < -1 || cosSDA > 1) return Number.NaN;
    const sda = Math.acos(cosSDA) * RAD;
    const target = ramc + base + fraction * sda;
    const delta = wrap180(target - ra);
    ra = target;
    if (Math.abs(delta) < 1e-9) break;
  }
  return eclipticLongitudeAtRA(ra, eps);
}

/**
 * Placidus houses. For |lat| > 66° (or if the iteration meets a circumpolar point) returns
 * Whole Sign cusps with a warning, since Placidus is undefined there.
 */
export function placidus(dateUTC: Date, lat: number, lng: number): HouseResult {
  const angles = ascendantAndMC(dateUTC, lat, lng);
  const warnings: EngineWarning[] = [];
  const fallback = (code: string, message: string): HouseResult => {
    warnings.push({ code, message });
    return { system: 'placidus', effectiveSystem: 'whole', cusps: wholeSign(angles.asc), angles, warnings };
  };
  if (Math.abs(lat) > PLACIDUS_MAX_LAT) {
    return fallback(
      'astro.houses.polar_fallback',
      `Placidus is undefined beyond ±${PLACIDUS_MAX_LAT}° latitude (got ${lat.toFixed(2)}°); used Whole Sign houses.`,
    );
  }
  const { ramc, obliquity: eps, asc, mc } = angles;
  const c11 = placidusCusp(ramc, lat, eps, 0, 1 / 3);
  const c12 = placidusCusp(ramc, lat, eps, 0, 2 / 3);
  const c2 = placidusCusp(ramc, lat, eps, 60, 2 / 3);
  const c3 = placidusCusp(ramc, lat, eps, 120, 1 / 3);
  if ([c11, c12, c2, c3].some((c) => !Number.isFinite(c))) {
    return fallback(
      'astro.houses.circumpolar_fallback',
      'Placidus iteration hit a circumpolar ecliptic point; used Whole Sign houses.',
    );
  }
  const cusps: Cusps = [
    asc,
    c2,
    c3,
    normalizeDegrees(mc + 180),
    normalizeDegrees(c11 + 180),
    normalizeDegrees(c12 + 180),
    normalizeDegrees(asc + 180),
    normalizeDegrees(c2 + 180),
    normalizeDegrees(c3 + 180),
    mc,
    c11,
    c12,
  ];
  return { system: 'placidus', effectiveSystem: 'placidus', cusps, angles, warnings };
}

export function houses(system: HouseSystem, dateUTC: Date, lat: number, lng: number): HouseResult {
  return system === 'placidus' ? placidus(dateUTC, lat, lng) : wholeSignHouses(dateUTC, lat, lng);
}

/** 1-based house number of a longitude given 12 cusps (house i spans [cusp_i, cusp_{i+1}) going forward). */
export function houseOf(lon: number, cusps: Cusps): number {
  const l = normalizeDegrees(lon);
  for (let i = 0; i < 12; i++) {
    const start = cusps[i] as number;
    const end = cusps[(i + 1) % 12] as number;
    const span = normalizeDegrees(end - start);
    const off = normalizeDegrees(l - start);
    if (off < span) return i + 1;
  }
  return 12; // unreachable for well-formed cusps
}

export function assertLngLat(lat: number, lng: number): void {
  if (!Number.isFinite(lat) || Math.abs(lat) > 90) throw new RangeError(`Invalid latitude: ${lat}`);
  if (!Number.isFinite(lng) || Math.abs(lng) > 180) throw new RangeError(`Invalid longitude: ${lng}`);
}
