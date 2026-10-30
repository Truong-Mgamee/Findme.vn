import { describe, expect, it } from 'vitest';
import { HexagramSetSchema } from '@findme/content/schemas';
import hexJson from '@findme/content/iching/hexagrams.json' with { type: 'json' };
import { mulberry32 } from '@findme/engine-core';
import {
  HEXAGRAMS,
  TRIGRAMS,
  atomKeysForIching,
  castHexagram,
  castLineCoins,
  castLineYarrow,
  decomposeTrigrams,
  getHexagram,
  hexagramFromBinary,
  resolveLines,
  toEngineOutput,
  type LineValue,
  type TrigramName,
} from '../src/index.js';

const ORDER: TrigramName[] = ['qian', 'dui', 'li', 'zhen', 'xun', 'kan', 'gen', 'kun'];
/** Standard King Wen grid: rows = upper trigram, columns = lower trigram (order above). */
const KING_WEN_GRID: Record<TrigramName, number[]> = {
  qian: [1, 10, 13, 25, 44, 6, 33, 12],
  dui: [43, 58, 49, 17, 28, 47, 31, 45],
  li: [14, 38, 30, 21, 50, 64, 56, 35],
  zhen: [34, 54, 55, 51, 32, 40, 62, 16],
  xun: [9, 61, 37, 42, 57, 59, 53, 20],
  kan: [5, 60, 63, 3, 48, 29, 39, 8],
  gen: [26, 41, 22, 27, 18, 4, 52, 23],
  kun: [11, 19, 36, 24, 46, 7, 15, 2],
};

describe('hexagram dataset', () => {
  it('validates against the zod schema', () => {
    const r = HexagramSetSchema.safeParse(hexJson);
    if (!r.success) console.error(r.error.issues.slice(0, 10));
    expect(r.success).toBe(true);
  });

  it('has 64 unique binaries and numbers 1..64 in order', () => {
    expect(HEXAGRAMS.hexagrams).toHaveLength(64);
    expect(new Set(HEXAGRAMS.hexagrams.map((h) => h.lines_binary)).size).toBe(64);
    HEXAGRAMS.hexagrams.forEach((h, i) => expect(h.number).toBe(i + 1));
  });

  it('spot-checks known hexagrams by binary (bottom→top)', () => {
    const known: Array<[number, string, string]> = [
      [1, '111111', 'Qián'],
      [2, '000000', 'Kūn'],
      [3, '100010', 'Zhūn'],
      [4, '010001', 'Méng'],
      [11, '111000', 'Tài'],
      [12, '000111', 'Pǐ'],
      [24, '100000', 'Fù'],
      [29, '010010', 'Kǎn'],
      [30, '101101', 'Lí'],
      [44, '011111', 'Gòu'],
      [51, '100100', 'Zhèn'],
      [52, '001001', 'Gèn'],
      [63, '101010', 'Jì Jì'],
      [64, '010101', 'Wèi Jì'],
    ];
    for (const [n, bin, pinyin] of known) {
      expect(hexagramFromBinary(bin).number).toBe(n);
      expect(getHexagram(n).lines_binary).toBe(bin);
      expect(getHexagram(n).name_pinyin).toBe(pinyin);
    }
  });

  it('matches the full 8x8 King Wen trigram grid', () => {
    for (const upper of ORDER) {
      ORDER.forEach((lower, i) => {
        const h = hexagramFromBinary(TRIGRAMS[lower].binary + TRIGRAMS[upper].binary);
        expect(h.number).toBe(KING_WEN_GRID[upper][i]);
        expect(h.upper_trigram).toBe(upper);
        expect(h.lower_trigram).toBe(lower);
      });
    }
  });

  it('decomposes trigrams correctly', () => {
    expect(decomposeTrigrams('100010')).toMatchObject({ lower: { name: 'zhen' }, upper: { name: 'kan' } });
    expect(decomposeTrigrams('101010')).toMatchObject({ lower: { name: 'li' }, upper: { name: 'kan' } });
    expect(decomposeTrigrams([7, 9, 8, 6, 7, 7])).toMatchObject({ lower: { name: 'dui' }, upper: { name: 'xun' } });
    for (const h of HEXAGRAMS.hexagrams) {
      const { lower, upper } = decomposeTrigrams(h.lines_binary);
      expect(lower.name).toBe(h.lower_trigram);
      expect(upper.name).toBe(h.upper_trigram);
    }
  });

  it('has 6 ordered lines, judgment and image per hexagram, and empty vi fields', () => {
    for (const h of HEXAGRAMS.hexagrams) {
      expect(h.lines.map((l) => l.position)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(h.judgment_en.length).toBeGreaterThan(10);
      expect(h.image_en.length).toBeGreaterThan(10);
      expect(h.name_vi).toBe('');
      expect(h.text_vi).toBe('');
    }
    expect(getHexagram(1).name_en).toBe('Khien');
    expect(getHexagram(1).name_en_modern).toBe('The Creative');
    expect(() => getHexagram(0)).toThrow(RangeError);
    expect(() => getHexagram(65)).toThrow(RangeError);
    expect(() => hexagramFromBinary('10101')).toThrow();
  });
});

describe('casting', () => {
  it('coin probabilities are within ±1% over 100k lines', () => {
    const rnd = mulberry32(12345);
    const counts: Record<LineValue, number> = { 6: 0, 7: 0, 8: 0, 9: 0 };
    const N = 100_000;
    for (let i = 0; i < N; i++) counts[castLineCoins(rnd)]++;
    expect(Math.abs(counts[6] / N - 1 / 8)).toBeLessThan(0.01);
    expect(Math.abs(counts[7] / N - 3 / 8)).toBeLessThan(0.01);
    expect(Math.abs(counts[8] / N - 3 / 8)).toBeLessThan(0.01);
    expect(Math.abs(counts[9] / N - 1 / 8)).toBeLessThan(0.01);
  });

  it('yarrow probabilities are within ±1% over 100k lines', () => {
    const rnd = mulberry32(777);
    const counts: Record<LineValue, number> = { 6: 0, 7: 0, 8: 0, 9: 0 };
    const N = 100_000;
    for (let i = 0; i < N; i++) counts[castLineYarrow(rnd)]++;
    expect(Math.abs(counts[6] / N - 1 / 16)).toBeLessThan(0.01);
    expect(Math.abs(counts[7] / N - 5 / 16)).toBeLessThan(0.01);
    expect(Math.abs(counts[8] / N - 7 / 16)).toBeLessThan(0.01);
    expect(Math.abs(counts[9] / N - 3 / 16)).toBeLessThan(0.01);
  });

  it('is deterministic per seed and differs across seeds', () => {
    const a = castHexagram({ method: 'coins', seed: '2026-10-10:u1' });
    const b = castHexagram({ method: 'coins', seed: '2026-10-10:u1' });
    expect(a.lines).toEqual(b.lines);
    expect(a.primary.number).toBe(b.primary.number);
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) seen.add(castHexagram({ seed: `s${i}` }).lines.join(''));
    expect(seen.size).toBeGreaterThan(20);
    expect(castHexagram({ seed: 99 }).method).toBe('coins');
  });

  it('computes changing lines and the relating hexagram for a seeded cast', () => {
    // find a seeded cast with at least one changing line, then verify against a manual computation
    let cast = castHexagram({ method: 'coins', seed: 'relating-check' });
    for (let i = 0; cast.changingLines.length === 0 && i < 50; i++) cast = castHexagram({ method: 'coins', seed: `relating-check-${i}` });
    expect(cast.changingLines.length).toBeGreaterThan(0);
    const primaryBits = cast.lines.map((v) => (v === 7 || v === 9 ? '1' : '0')).join('');
    const relatingBits = cast.lines.map((v) => (v === 7 ? '1' : v === 8 ? '0' : v === 9 ? '0' : '1')).join('');
    expect(cast.primary.lines_binary).toBe(primaryBits);
    expect(cast.relating?.lines_binary).toBe(relatingBits);
    expect(cast.changingLines).toEqual(cast.lines.flatMap((v, i) => (v === 6 || v === 9 ? [i + 1] : [])));
  });

  it('resolveLines: known examples (11 Tai → 46 Sheng; 11 Tai → 1 Qian)', () => {
    // lines bottom→top: 9 (old yang), 7, 7, 8, 8, 8 → primary 111000 = 11 Tai; flip line 1 → 011000 = 46 Sheng
    const r = resolveLines([9, 7, 7, 8, 8, 8]);
    expect(r.primary.number).toBe(11);
    expect(r.changingLines).toEqual([1]);
    expect(r.relating?.number).toBe(46);
    // 7,7,7,6,6,6 → primary 111000 (11 Tai); flip 4,5,6 → 111111 = 1 Qian
    const r2 = resolveLines([7, 7, 7, 6, 6, 6]);
    expect(r2.primary.number).toBe(11);
    expect(r2.changingLines).toEqual([4, 5, 6]);
    expect(r2.relating?.number).toBe(1);
  });

  it('no changing lines → relating null', () => {
    const r = resolveLines([7, 8, 7, 8, 7, 8]);
    expect(r.primary.number).toBe(63); // 7,8,7,8,7,8 → 101010 = 63 Ji Ji
    expect(r.relating).toBeNull();
    expect(r.changingLines).toEqual([]);
  });
});

describe('atoms + engine output', () => {
  it('builds keys for primary, changing lines and relating', () => {
    const cast = { ...castHexagram({ seed: 'x' }), ...resolveLines([9, 7, 7, 8, 8, 6]), lines: [9, 7, 7, 8, 8, 6] as LineValue[] };
    expect(cast.primary.number).toBe(11);
    expect(cast.relating?.number).toBe(hexagramFromBinary('011001').number); // 18 Gu
    expect(atomKeysForIching(cast)).toEqual(['iching.hex.11', 'iching.hex.11.line.1', 'iching.hex.11.line.6', 'iching.hex.18.relating']);
    const still = { ...cast, ...resolveLines([7, 7, 7, 7, 7, 7]), lines: [7, 7, 7, 7, 7, 7] as LineValue[] };
    expect(atomKeysForIching(still)).toEqual(['iching.hex.1']);
  });

  it('toEngineOutput exposes engine id/version and facts', () => {
    const cast = castHexagram({ method: 'yarrow', seed: 'out' });
    const out = toEngineOutput(cast);
    expect(out.engine).toBe('iching');
    expect(out.engineVersion).toBe('1.0.0');
    expect(out.facts.primary.number).toBe(cast.primary.number);
    expect(out.facts.lines).toEqual(cast.lines);
    expect(out.facts.changingLineTexts).toHaveLength(cast.changingLines.length);
    expect(out.atomKeys).toEqual(atomKeysForIching(cast));
    expect(out.facts.relating === null).toBe(cast.relating === null);
    expect(out.confidence).toBe('high');
  });
});
