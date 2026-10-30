import { toSingleDigit } from './reduce.js';
import type { CompatibilityReason, CompatibilityResult, NumerologyResult } from './types.js';

/**
 * Symmetric Life Path affinity matrix (index 1..9; masters are folded: 11→2, 22→4, 33→6).
 * Built from the classic "natural match" triads {1,5,7} (mind), {2,4,8} (business),
 * {3,6,9} (creative) plus the usual cross-group pairings (1–3, 2–6, 4–7 …). Scale 45–85.
 * Row i / column j must equal row j / column i (checked by a unit test).
 */
export const LIFE_PATH_AFFINITY: ReadonlyArray<ReadonlyArray<number>> = [
  //  1   2   3   4   5   6   7   8   9
  [70, 60, 80, 55, 85, 65, 75, 60, 70], // 1
  [60, 75, 65, 85, 50, 85, 60, 80, 70], // 2
  [80, 65, 75, 50, 80, 85, 60, 55, 85], // 3
  [55, 85, 50, 75, 45, 75, 80, 85, 55], // 4
  [85, 50, 80, 45, 70, 55, 80, 60, 75], // 5
  [65, 85, 85, 75, 55, 80, 50, 75, 85], // 6
  [75, 60, 60, 80, 80, 50, 75, 55, 65], // 7
  [60, 80, 55, 85, 60, 75, 55, 70, 65], // 8
  [70, 70, 85, 55, 75, 85, 65, 65, 75], // 9
];

const LIFE_PATH_WEIGHT = 0.65;
const EXPRESSION_WEIGHT = 0.35;
const SAME_EXPRESSION_SCORE = 90;
const MASTER_PAIR_BONUS = 5;

export function pairAffinity(a: number, b: number): number {
  const i = toSingleDigit(a);
  const j = toSingleDigit(b);
  return LIFE_PATH_AFFINITY[i - 1]?.[j - 1] ?? 50;
}

function pairKey(prefix: string, a: number, b: number): string {
  const [x, y] = a <= b ? [a, b] : [b, a];
  return `${prefix}.${x}-${y}`;
}

/**
 * score = 0.65 × lifePathAffinity + 0.35 × expressionAffinity (expression part is dropped and the
 * lifePath part scaled to 100% when either side has no name), +5 when both life paths are masters.
 * Reasons carry atom-style keys with their point contribution so the composer can explain the score.
 */
export function compatibility(a: NumerologyResult, b: NumerologyResult): CompatibilityResult {
  const reasons: CompatibilityReason[] = [];
  const lpA = toSingleDigit(a.lifePath.value);
  const lpB = toSingleDigit(b.lifePath.value);
  const lpScore = pairAffinity(lpA, lpB);

  let score: number;
  if (a.expression && b.expression) {
    const exA = toSingleDigit(a.expression.value);
    const exB = toSingleDigit(b.expression.value);
    const same = exA === exB;
    const exScore = same ? SAME_EXPRESSION_SCORE : pairAffinity(exA, exB);
    const lpPart = lpScore * LIFE_PATH_WEIGHT;
    const exPart = exScore * EXPRESSION_WEIGHT;
    reasons.push({ key: pairKey('numerology.compat.lifepath', lpA, lpB), weight: round1(lpPart) });
    reasons.push({
      key: same ? 'numerology.compat.expression.same' : pairKey('numerology.compat.expression', exA, exB),
      weight: round1(exPart),
    });
    score = lpPart + exPart;
  } else {
    reasons.push({ key: pairKey('numerology.compat.lifepath', lpA, lpB), weight: round1(lpScore) });
    score = lpScore;
  }

  if (a.lifePath.isMaster && b.lifePath.isMaster) {
    reasons.push({ key: 'numerology.compat.master.both', weight: MASTER_PAIR_BONUS });
    score += MASTER_PAIR_BONUS;
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
