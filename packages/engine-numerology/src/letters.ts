import type { NumerologySystem } from './types.js';

/** Pythagorean: A=1 … I=9, J=1 … R=9, S=1 … Z=8 (letter position mod 9). */
export const PYTHAGOREAN: Readonly<Record<string, number>> = Object.freeze({
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
});

/** Chaldean: no letter maps to 9. */
export const CHALDEAN: Readonly<Record<string, number>> = Object.freeze({
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 7, P: 8, Q: 1, R: 2,
  S: 3, T: 4, U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7,
});

export function letterMap(system: NumerologySystem): Readonly<Record<string, number>> {
  return system === 'chaldean' ? CHALDEAN : PYTHAGOREAN;
}

export function letterValue(letter: string, system: NumerologySystem = 'pythagorean'): number {
  const v = letterMap(system)[letter.toUpperCase()];
  if (v === undefined) throw new Error(`Not an A–Z letter: ${JSON.stringify(letter)}`);
  return v;
}

const PLAIN_VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

/**
 * Vowel classification for a word of A–Z letters.
 *
 * Rule: A E I O U are always vowels. Y is a vowel when it is NOT adjacent (within the same
 * word) to another A/E/I/O/U; otherwise it is a consonant. Examples:
 *   MARY   → Y after R          → vowel      (soul urge A+Y)
 *   YVONNE → Y before V         → vowel
 *   KAY    → Y after A          → consonant
 *   NGUYEN → Y between U and E  → consonant
 * Word boundaries break adjacency: in "AMY ANN" the Y of AMY is only compared with M.
 */
export function vowelMask(word: string): boolean[] {
  const out: boolean[] = [];
  for (let i = 0; i < word.length; i++) {
    const ch = word[i] ?? '';
    if (PLAIN_VOWELS.has(ch)) {
      out.push(true);
    } else if (ch === 'Y') {
      const prev = i > 0 ? word[i - 1] ?? '' : '';
      const next = i + 1 < word.length ? word[i + 1] ?? '' : '';
      out.push(!PLAIN_VOWELS.has(prev) && !PLAIN_VOWELS.has(next));
    } else {
      out.push(false);
    }
  }
  return out;
}
