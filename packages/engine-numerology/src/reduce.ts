import type { NumerologyNumber } from './types.js';

export const MASTER_NUMBERS: ReadonlySet<number> = new Set([11, 22, 33]);

export interface ReduceOptions {
  /** Stop at 11/22/33 instead of reducing them. Default true. */
  keepMasters?: boolean;
}

export function isMaster(n: number): boolean {
  return MASTER_NUMBERS.has(n);
}

export function digitSum(n: number): number {
  let x = Math.abs(Math.trunc(n));
  let s = 0;
  while (x > 0) {
    s += x % 10;
    x = Math.trunc(x / 10);
  }
  return s;
}

/**
 * Reduce an integer by repeated digit summing until it is a single digit (0–9),
 * or until it hits a master number (11/22/33) when keepMasters is true.
 * Note: a master number is only kept when it appears as an intermediate total
 * (e.g. 29 → 11 stays 11), never produced from a single digit.
 */
export function reduce(n: number, opts: ReduceOptions = {}): number {
  const keep = opts.keepMasters ?? true;
  let x = Math.abs(Math.trunc(n));
  while (x > 9) {
    if (keep && isMaster(x)) return x;
    x = digitSum(x);
  }
  return x;
}

/** Reduce to 1–9 only (used for challenges and the lifePath-based age split). */
export function toSingleDigit(n: number): number {
  return reduce(n, { keepMasters: false });
}

/** Wrap an unreduced total into {value, unreduced, isMaster}. */
export function toNumber(unreduced: number, opts: ReduceOptions = {}): NumerologyNumber {
  const value = reduce(unreduced, opts);
  return { value, unreduced, isMaster: isMaster(value) };
}
