/**
 * Pythagorean numerology. Pure functions, table-driven, no dependencies.
 * Master numbers 11, 22, 33 are preserved where tradition keeps them.
 */

export const MASTER_NUMBERS = new Set([11, 22, 33]);
export const KARMIC_DEBT = new Set([13, 14, 16, 19]);

const PYTHAGOREAN: Record<string, number> = {
  a: 1, j: 1, s: 1, b: 2, k: 2, t: 2, c: 3, l: 3, u: 3, d: 4, m: 4, v: 4,
  e: 5, n: 5, w: 5, f: 6, o: 6, x: 6, g: 7, p: 7, y: 7, h: 8, q: 8, z: 8, i: 9, r: 9,
};
const VOWELS = new Set(["a", "e", "i", "o", "u"]);

/** Strip diacritics (Vietnamese incl. Đ), keep a–z only. Non-Latin scripts must be romanized by the caller. */
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Reduce to a single digit, keeping master numbers when `keepMaster`. */
export function reduce(n: number, keepMaster = true): number {
  let v = Math.abs(Math.trunc(n));
  while (v > 9) {
    if (keepMaster && MASTER_NUMBERS.has(v)) return v;
    v = String(v).split("").reduce((a, d) => a + Number(d), 0);
  }
  return v;
}

function digitSum(n: number): number {
  return String(Math.abs(Math.trunc(n))).split("").reduce((a, d) => a + Number(d), 0);
}

function letterValues(name: string, filter?: (ch: string, isY: boolean, prev: string, next: string) => boolean): number[] {
  const n = normalizeName(name);
  const out: number[] = [];
  for (let i = 0; i < n.length; i++) {
    const ch = n[i]!;
    if (ch === " ") continue;
    const v = PYTHAGOREAN[ch];
    if (v === undefined) continue;
    if (filter && !filter(ch, ch === "y", n[i - 1] ?? " ", n[i + 1] ?? " ")) continue;
    out.push(v);
  }
  return out;
}

/** "y" is a vowel when not adjacent to another vowel (common Pythagorean convention). */
function isVowel(ch: string, isY: boolean, prev: string, next: string): boolean {
  if (VOWELS.has(ch)) return true;
  if (isY) return !VOWELS.has(prev) && !VOWELS.has(next);
  return false;
}

export interface NumerologyInput {
  /** Full birth name as on the birth certificate (Latin letters; romanize other scripts). */
  fullName: string;
  day: number;
  month: number;
  year: number;
}

export interface NumerologyProfile {
  lifePath: number;
  lifePathKarmicDebt: number | null;
  birthday: number;
  expression: number;
  soulUrge: number;
  personality: number;
  maturity: number;
  attitude: number;
  challenges: [number, number, number, number];
  pinnacles: [number, number, number, number];
  pinnacleAges: [number, number, number, number];
  personalYear: (year: number) => number;
  personalMonth: (year: number, month: number) => number;
  personalDay: (year: number, month: number, day: number) => number;
}

/** Life Path: reduce month, day, year separately, then sum (keeps 11/22/33). */
export function lifePath(day: number, month: number, year: number): number {
  const m = reduce(month);
  const d = reduce(day);
  const y = reduce(digitSum(year));
  return reduce(m + d + y);
}

export function lifePathKarmicDebt(day: number, month: number, year: number): number | null {
  const total = reduce(month) + reduce(day) + reduce(digitSum(year));
  return KARMIC_DEBT.has(total) ? total : null;
}

export function expressionNumber(fullName: string): number {
  return reduce(letterValues(fullName).reduce((a, b) => a + b, 0));
}
export function soulUrgeNumber(fullName: string): number {
  return reduce(letterValues(fullName, isVowel).reduce((a, b) => a + b, 0));
}
export function personalityNumber(fullName: string): number {
  return reduce(letterValues(fullName, (c, y, p, n) => !isVowel(c, y, p, n)).reduce((a, b) => a + b, 0));
}
export function birthdayNumber(day: number): number {
  return reduce(day);
}
export function attitudeNumber(day: number, month: number): number {
  return reduce(reduce(day) + reduce(month));
}
export function maturityNumber(lp: number, expr: number): number {
  return reduce(lp + expr);
}

export function personalYear(day: number, month: number, year: number): number {
  return reduce(reduce(day) + reduce(month) + reduce(digitSum(year)), false);
}
export function personalMonth(day: number, month: number, year: number, targetMonth: number): number {
  return reduce(personalYear(day, month, year) + reduce(targetMonth), false);
}
export function personalDay(day: number, month: number, year: number, targetMonth: number, targetDay: number): number {
  return reduce(personalMonth(day, month, year, targetMonth) + reduce(targetDay), false);
}

export function challenges(day: number, month: number, year: number): [number, number, number, number] {
  const m = reduce(month, false), d = reduce(day, false), y = reduce(digitSum(year), false);
  const c1 = Math.abs(m - d);
  const c2 = Math.abs(d - y);
  const c3 = Math.abs(c1 - c2);
  const c4 = Math.abs(m - y);
  return [c1, c2, c3, c4];
}

export function pinnacles(day: number, month: number, year: number): { values: [number, number, number, number]; ages: [number, number, number, number] } {
  const m = reduce(month), d = reduce(day), y = reduce(digitSum(year));
  const p1 = reduce(m + d);
  const p2 = reduce(d + y);
  const p3 = reduce(p1 + p2);
  const p4 = reduce(m + y);
  const lp = lifePath(day, month, year);
  const firstEnd = 36 - reduce(lp, false);
  return { values: [p1, p2, p3, p4], ages: [firstEnd, firstEnd + 9, firstEnd + 18, firstEnd + 27] };
}

export function numerologyProfile(input: NumerologyInput): NumerologyProfile {
  const { fullName, day, month, year } = input;
  const lp = lifePath(day, month, year);
  const expr = expressionNumber(fullName);
  const pin = pinnacles(day, month, year);
  return {
    lifePath: lp,
    lifePathKarmicDebt: lifePathKarmicDebt(day, month, year),
    birthday: birthdayNumber(day),
    expression: expr,
    soulUrge: soulUrgeNumber(fullName),
    personality: personalityNumber(fullName),
    maturity: maturityNumber(lp, expr),
    attitude: attitudeNumber(day, month),
    challenges: challenges(day, month, year),
    pinnacles: pin.values,
    pinnacleAges: pin.ages,
    personalYear: (y) => personalYear(day, month, y),
    personalMonth: (y, m) => personalMonth(day, month, y, m),
    personalDay: (y, m, d) => personalDay(day, month, y, m, d),
  };
}
