import { parseDate } from './date.js';
import { reduce, toNumber, toSingleDigit } from './reduce.js';
import type { AgeRange, CycleNumber, NumerologyNumber } from './types.js';

type DateLike = string | { year: number; month: number; day: number };
function ymd(d: DateLike) {
  return typeof d === 'string' ? parseDate(d) : d;
}

/**
 * Personal Year = reduce(reduce(birthMonth) + reduce(birthDay) + reduce(refYear)).
 * Uses the calendar year of the reference date (Jan 1 – Dec 31 convention, not birthday-to-birthday).
 * Personal cycles are reduced to a single digit 1–9 (no masters) so they map to 9 content atoms.
 */
export function personalYear(birth: DateLike, refYear: number): NumerologyNumber {
  const b = ymd(birth);
  const total = toSingleDigit(b.month) + toSingleDigit(b.day) + toSingleDigit(refYear);
  return toNumber(total, { keepMasters: false });
}

/** Personal Month = reduce(personalYear + refMonth). */
export function personalMonth(birth: DateLike, ref: DateLike): NumerologyNumber {
  const r = ymd(ref);
  const py = personalYear(birth, r.year);
  return toNumber(py.value + toSingleDigit(r.month), { keepMasters: false });
}

/** Personal Day = reduce(personalMonth + refDay). */
export function personalDay(birth: DateLike, ref: DateLike): NumerologyNumber {
  const r = ymd(ref);
  const pm = personalMonth(birth, ref);
  return toNumber(pm.value + toSingleDigit(r.day), { keepMasters: false });
}

/**
 * Age ranges shared by pinnacles and challenges: the first period ends at age
 * 36 − (lifePath reduced to a single digit: 11→2, 22→4, 33→6); the next two last 9 years each;
 * the fourth is open ended.
 */
export function cycleAgeRanges(lifePathValue: number): [AgeRange, AgeRange, AgeRange, AgeRange] {
  const end1 = 36 - toSingleDigit(lifePathValue);
  return [
    { from: 0, to: end1 },
    { from: end1 + 1, to: end1 + 9 },
    { from: end1 + 10, to: end1 + 18 },
    { from: end1 + 19, to: null },
  ];
}

/**
 * Pinnacles (masters kept, inputs = month/day/year each reduced keeping masters):
 *   P1 = m + d, P2 = d + y, P3 = P1 + P2 (unreduced values of P1/P2 are reduced first), P4 = m + y.
 */
export function pinnacles(birth: DateLike, lifePathValue: number): [CycleNumber, CycleNumber, CycleNumber, CycleNumber] {
  const b = ymd(birth);
  const m = reduce(b.month);
  const d = reduce(b.day);
  const y = reduce(b.year);
  const ages = cycleAgeRanges(lifePathValue);
  const p1 = toNumber(m + d);
  const p2 = toNumber(d + y);
  const p3 = toNumber(p1.value + p2.value);
  const p4 = toNumber(m + y);
  return [
    { ...p1, index: 1, ages: ages[0] },
    { ...p2, index: 2, ages: ages[1] },
    { ...p3, index: 3, ages: ages[2] },
    { ...p4, index: 4, ages: ages[3] },
  ];
}

/**
 * Challenges (single-digit inputs, result 0–8, no masters):
 *   C1 = |m − d|, C2 = |d − y|, C3 = |C1 − C2|, C4 = |m − y|.
 */
export function challenges(birth: DateLike, lifePathValue: number): [CycleNumber, CycleNumber, CycleNumber, CycleNumber] {
  const b = ymd(birth);
  const m = toSingleDigit(b.month);
  const d = toSingleDigit(b.day);
  const y = toSingleDigit(b.year);
  const ages = cycleAgeRanges(lifePathValue);
  const c1 = Math.abs(m - d);
  const c2 = Math.abs(d - y);
  const c3 = Math.abs(c1 - c2);
  const c4 = Math.abs(m - y);
  const mk = (n: number, index: 1 | 2 | 3 | 4, a: AgeRange): CycleNumber => ({
    value: n,
    unreduced: n,
    isMaster: false,
    index,
    ages: a,
  });
  return [mk(c1, 1, ages[0]), mk(c2, 2, ages[1]), mk(c3, 3, ages[2]), mk(c4, 4, ages[3])];
}
