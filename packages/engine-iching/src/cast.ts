import { hashSeed, mulberry32 } from '@findme/engine-core';
import { hexagramFromBinary, type Hexagram } from './lookup.js';

export type CastMethod = 'coins' | 'yarrow';
/** 6 = old yin (changing), 7 = young yang, 8 = young yin, 9 = old yang (changing) */
export type LineValue = 6 | 7 | 8 | 9;

export interface CastOptions {
  method?: CastMethod;
  seed: string | number;
}

export interface Cast {
  method: CastMethod;
  seed: string | number;
  /** bottom→top */
  lines: LineValue[];
  primary: Hexagram;
  /** 1-based positions (bottom = 1) whose line is 6 or 9 */
  changingLines: number[];
  /** hexagram after flipping the changing lines, or null when nothing changes */
  relating: Hexagram | null;
}

export function seedToNumber(seed: string | number): number {
  return typeof seed === 'number' ? seed >>> 0 : hashSeed(seed);
}

/** Three-coin method: heads = 3, tails = 2, sum ∈ {6,7,8,9} with probabilities 1/8, 3/8, 3/8, 1/8. */
export function castLineCoins(rnd: () => number): LineValue {
  let sum = 0;
  for (let i = 0; i < 3; i++) sum += rnd() < 0.5 ? 3 : 2;
  return sum as LineValue;
}

/** Yarrow-stalk probabilities: 6 → 1/16, 7 → 5/16, 8 → 7/16, 9 → 3/16. */
export function castLineYarrow(rnd: () => number): LineValue {
  const r = Math.floor(rnd() * 16);
  if (r < 1) return 6;
  if (r < 6) return 7;
  if (r < 13) return 8;
  return 9;
}

export function castLine(method: CastMethod, rnd: () => number): LineValue {
  return method === 'yarrow' ? castLineYarrow(rnd) : castLineCoins(rnd);
}

export function isChanging(v: LineValue): boolean {
  return v === 6 || v === 9;
}

export function isYang(v: LineValue): boolean {
  return v === 7 || v === 9;
}

/** Derive primary / changing / relating from six line values (bottom→top). */
export function resolveLines(lines: readonly LineValue[]): Pick<Cast, 'primary' | 'changingLines' | 'relating'> {
  if (lines.length !== 6) throw new Error('A hexagram needs exactly 6 lines');
  const primaryBits = lines.map((v) => (isYang(v) ? '1' : '0')).join('');
  const changingLines = lines.flatMap((v, i) => (isChanging(v) ? [i + 1] : []));
  const primary = hexagramFromBinary(primaryBits);
  if (changingLines.length === 0) return { primary, changingLines, relating: null };
  const relatingBits = lines.map((v) => (isChanging(v) ? (isYang(v) ? '0' : '1') : isYang(v) ? '1' : '0')).join('');
  return { primary, changingLines, relating: hexagramFromBinary(relatingBits) };
}

export function castHexagram(opts: CastOptions): Cast {
  const method: CastMethod = opts.method ?? 'coins';
  const rnd = mulberry32(seedToNumber(opts.seed));
  const lines: LineValue[] = [];
  for (let i = 0; i < 6; i++) lines.push(castLine(method, rnd));
  return { method, seed: opts.seed, lines, ...resolveLines(lines) };
}
