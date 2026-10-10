import { letterMap, vowelMask } from './letters.js';
import { normalizeName } from './normalize.js';
import { parseDate } from './date.js';
import { reduce, toNumber } from './reduce.js';
import type {
  HiddenPassion,
  KarmicDebt,
  KarmicDebtNumber,
  LetterNumber,
  NameNumbers,
  NameOrder,
  NumerologyNumber,
  NumerologySystem,
} from './types.js';

type DateLike = string | { year: number; month: number; day: number };
function ymd(d: DateLike) {
  return typeof d === 'string' ? parseDate(d) : d;
}

/**
 * Life Path: reduce month, day and year separately (keeping 11/22/33 at each stage), add the
 * three results, reduce again keeping masters.
 * `unreduced` is the sum of the three reduced parts (e.g. 1997-12-24 → 8+3+6 = 17 → 8), which is
 * the total karmic-debt detection inspects.
 */
export function lifePath(date: DateLike): NumerologyNumber {
  const { year, month, day } = ymd(date);
  const total = reduce(month) + reduce(day) + reduce(year);
  return toNumber(total);
}

/** Birthday number: day of month reduced, masters kept (11, 22). unreduced = day of month. */
export function birthday(date: DateLike): NumerologyNumber {
  return toNumber(ymd(date).day);
}

export interface NameNumberOptions {
  system?: NumerologySystem;
  nameOrder?: NameOrder;
}

function sumWords(words: string[], system: NumerologySystem, pick: (isVowel: boolean) => boolean): number {
  const map = letterMap(system);
  let total = 0;
  for (const w of words) {
    const mask = vowelMask(w);
    for (let i = 0; i < w.length; i++) {
      if (pick(mask[i] ?? false)) total += map[w[i] ?? ''] ?? 0;
    }
  }
  return total;
}

function wordsOf(name: string | string[]): string[] {
  return Array.isArray(name) ? name : normalizeName(name).words;
}

/** Expression / Destiny: sum of all letters of the full name, reduced keeping masters. */
export function expression(name: string | string[], system: NumerologySystem = 'pythagorean'): NumerologyNumber {
  return toNumber(sumWords(wordsOf(name), system, () => true));
}

/** Soul Urge / Heart's Desire: vowels only (see vowelMask for the Y rule). */
export function soulUrge(name: string | string[], system: NumerologySystem = 'pythagorean'): NumerologyNumber {
  return toNumber(sumWords(wordsOf(name), system, (v) => v));
}

/** Personality: consonants only (complement of soulUrge). */
export function personality(name: string | string[], system: NumerologySystem = 'pythagorean'): NumerologyNumber {
  return toNumber(sumWords(wordsOf(name), system, (v) => !v));
}

/** Maturity / Realization: reduce(lifePath + expression), using the (possibly master) values. */
export function maturity(lp: NumerologyNumber, expr: NumerologyNumber): NumerologyNumber {
  return toNumber(lp.value + expr.value);
}

/** Hidden Passion: the most frequent letter value in the name. Ties → lowest digit, all ties listed. */
export function hiddenPassion(name: string | string[], system: NumerologySystem = 'pythagorean'): HiddenPassion | null {
  const map = letterMap(system);
  const counts = new Map<number, number>();
  for (const w of wordsOf(name)) {
    for (const ch of w) {
      const v = map[ch];
      if (v === undefined) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return null;
  let best = 0;
  for (const c of counts.values()) best = Math.max(best, c);
  const ties = [...counts.entries()]
    .filter(([, c]) => c === best)
    .map(([v]) => v)
    .sort((a, b) => a - b);
  return { value: ties[0] ?? 0, count: best, ties };
}

function givenName(words: string[], order: NameOrder): string | undefined {
  return order === 'family-first' ? words[words.length - 1] : words[0];
}

/** Cornerstone: first letter of the given name. */
export function cornerstone(name: string | string[], opts: NameNumberOptions = {}): LetterNumber | null {
  const w = givenName(wordsOf(name), opts.nameOrder ?? 'given-first');
  if (!w) return null;
  const letter = w[0] ?? '';
  return { letter, value: letterMap(opts.system ?? 'pythagorean')[letter] ?? 0 };
}

/** Capstone: last letter of the given name. */
export function capstone(name: string | string[], opts: NameNumberOptions = {}): LetterNumber | null {
  const w = givenName(wordsOf(name), opts.nameOrder ?? 'given-first');
  if (!w) return null;
  const letter = w[w.length - 1] ?? '';
  return { letter, value: letterMap(opts.system ?? 'pythagorean')[letter] ?? 0 };
}

/** All name-based numbers for one name, or null when it normalizes to nothing. */
export function nameNumbers(input: string, opts: NameNumberOptions = {}): NameNumbers | null {
  const system = opts.system ?? 'pythagorean';
  const { letters, words } = normalizeName(input);
  if (letters.length === 0) return null;
  const hp = hiddenPassion(words, system);
  const cs = cornerstone(words, opts);
  const cp = capstone(words, opts);
  if (!hp || !cs || !cp) return null;
  return {
    input,
    letters,
    words,
    expression: expression(words, system),
    soulUrge: soulUrge(words, system),
    personality: personality(words, system),
    hiddenPassion: hp,
    cornerstone: cs,
    capstone: cp,
  };
}

export const KARMIC_DEBT_NUMBERS: ReadonlySet<number> = new Set([13, 14, 16, 19]);

/**
 * Karmic debt: 13/14/16/19 appearing as the unreduced total of lifePath (sum of reduced
 * month/day/year), expression (letter total) or birthday (day of month).
 */
export function karmicDebt(parts: {
  lifePath: NumerologyNumber;
  expression?: NumerologyNumber | null;
  birthday: NumerologyNumber;
}): KarmicDebt[] {
  const out: KarmicDebt[] = [];
  const check = (n: NumerologyNumber | null | undefined, source: KarmicDebt['source']) => {
    if (n && KARMIC_DEBT_NUMBERS.has(n.unreduced)) out.push({ number: n.unreduced as KarmicDebtNumber, source });
  };
  check(parts.lifePath, 'lifePath');
  check(parts.expression, 'expression');
  check(parts.birthday, 'birthday');
  return out;
}
