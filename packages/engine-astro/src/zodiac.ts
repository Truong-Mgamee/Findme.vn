/**
 * Tropical zodiac: 12 signs of 30° each starting at the vernal equinox (0° Aries).
 * All longitudes in this package are tropical, geocentric, true ecliptic of date.
 */

export const SIGN_KEYS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const;
export type SignKey = (typeof SIGN_KEYS)[number];

export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Modality = 'cardinal' | 'fixed' | 'mutable';
export type Polarity = 'positive' | 'negative';

export interface ZodiacSign {
  key: SignKey;
  /** 0-based index, Aries = 0 */
  index: number;
  symbol: string;
  element: Element;
  modality: Modality;
  polarity: Polarity;
  /** Modern ruler (Uranus/Neptune/Pluto for Aquarius/Pisces/Scorpio). */
  ruler: PlanetKey;
  /** Traditional (pre-1781) ruler. */
  traditionalRuler: PlanetKey;
  /** Start longitude in degrees [0, 360). */
  start: number;
}

export type PlanetKey =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto';

const defs: ReadonlyArray<
  [SignKey, string, Element, Modality, PlanetKey, PlanetKey]
> = [
  ['aries', '♈', 'fire', 'cardinal', 'mars', 'mars'],
  ['taurus', '♉', 'earth', 'fixed', 'venus', 'venus'],
  ['gemini', '♊', 'air', 'mutable', 'mercury', 'mercury'],
  ['cancer', '♋', 'water', 'cardinal', 'moon', 'moon'],
  ['leo', '♌', 'fire', 'fixed', 'sun', 'sun'],
  ['virgo', '♍', 'earth', 'mutable', 'mercury', 'mercury'],
  ['libra', '♎', 'air', 'cardinal', 'venus', 'venus'],
  ['scorpio', '♏', 'water', 'fixed', 'pluto', 'mars'],
  ['sagittarius', '♐', 'fire', 'mutable', 'jupiter', 'jupiter'],
  ['capricorn', '♑', 'earth', 'cardinal', 'saturn', 'saturn'],
  ['aquarius', '♒', 'air', 'fixed', 'uranus', 'saturn'],
  ['pisces', '♓', 'water', 'mutable', 'neptune', 'jupiter'],
];

export const SIGNS: ReadonlyArray<ZodiacSign> = defs.map(
  ([key, symbol, element, modality, ruler, traditionalRuler], index) => ({
    key,
    index,
    symbol,
    element,
    modality,
    polarity: element === 'fire' || element === 'air' ? 'positive' : 'negative',
    ruler,
    traditionalRuler,
    start: index * 30,
  }),
);

export const SIGN_BY_KEY: Readonly<Record<SignKey, ZodiacSign>> = Object.fromEntries(
  SIGNS.map((s) => [s.key, s]),
) as Record<SignKey, ZodiacSign>;

/** Normalize an angle in degrees to [0, 360). */
export function normalizeDegrees(deg: number): number {
  const d = deg % 360;
  return d < 0 ? d + 360 : d === 0 ? 0 : d; // avoid -0
}

/** Signed difference a − b wrapped to (−180, 180]. */
export function wrap180(deg: number): number {
  const d = normalizeDegrees(deg);
  return d > 180 ? d - 360 : d;
}

export interface SignPosition {
  sign: SignKey;
  /** 0–11 */
  signIndex: number;
  /** Whole degrees inside the sign, 0–29 */
  degree: number;
  /** Whole arc-minutes, 0–59 */
  minute: number;
  /** Arc-seconds (fractional), 0–59.999 */
  second: number;
  /** Decimal degrees inside the sign [0, 30) */
  lonInSign: number;
  /** Normalized absolute ecliptic longitude [0, 360) */
  lon: number;
}

/** Convert an ecliptic longitude (degrees) into sign + degree/minute/second. */
export function signFromLongitude(longitude: number): SignPosition {
  if (!Number.isFinite(longitude)) throw new RangeError(`Invalid longitude: ${longitude}`);
  const lon = normalizeDegrees(longitude);
  const signIndex = Math.floor(lon / 30) % 12;
  const lonInSign = lon - signIndex * 30;
  const degree = Math.floor(lonInSign);
  const minFloat = (lonInSign - degree) * 60;
  const minute = Math.floor(minFloat);
  const second = (minFloat - minute) * 60;
  return { sign: SIGN_KEYS[signIndex] as SignKey, signIndex, degree, minute, second, lonInSign, lon };
}

/** Human readable "15°23' Capricorn" style string (English keys; UI localizes). */
export function formatSignPosition(p: SignPosition): string {
  const mm = String(p.minute).padStart(2, '0');
  return `${p.degree}°${mm}' ${p.sign}`;
}
