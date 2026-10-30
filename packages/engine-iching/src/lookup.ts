import hexJson from '@findme/content/iching/hexagrams.json' with { type: 'json' };
import { HexagramSetSchema, TRIGRAM_BINARY, TRIGRAM_NAMES, type Hexagram, type HexagramSet, type TrigramName } from '@findme/content/schemas';

export type { Hexagram, HexagramSet, TrigramName };
export { TRIGRAM_NAMES, TRIGRAM_BINARY };

export interface Trigram {
  name: TrigramName;
  name_zh: string;
  name_pinyin: string;
  name_en: string;
  /** 3 chars bottom→top, 1 = yang */
  binary: string;
  element: string;
  attribute: string;
}

export const TRIGRAMS: Record<TrigramName, Trigram> = {
  qian: { name: 'qian', name_zh: '乾', name_pinyin: 'Qián', name_en: 'Heaven', binary: '111', element: 'metal', attribute: 'the creative, strong' },
  dui: { name: 'dui', name_zh: '兌', name_pinyin: 'Duì', name_en: 'Lake', binary: '110', element: 'metal', attribute: 'the joyous, open' },
  li: { name: 'li', name_zh: '離', name_pinyin: 'Lí', name_en: 'Fire', binary: '101', element: 'fire', attribute: 'the clinging, radiant' },
  zhen: { name: 'zhen', name_zh: '震', name_pinyin: 'Zhèn', name_en: 'Thunder', binary: '100', element: 'wood', attribute: 'the arousing, moving' },
  xun: { name: 'xun', name_zh: '巽', name_pinyin: 'Xùn', name_en: 'Wind', binary: '011', element: 'wood', attribute: 'the gentle, penetrating' },
  kan: { name: 'kan', name_zh: '坎', name_pinyin: 'Kǎn', name_en: 'Water', binary: '010', element: 'water', attribute: 'the abysmal, dangerous' },
  gen: { name: 'gen', name_zh: '艮', name_pinyin: 'Gèn', name_en: 'Mountain', binary: '001', element: 'earth', attribute: 'keeping still, resting' },
  kun: { name: 'kun', name_zh: '坤', name_pinyin: 'Kūn', name_en: 'Earth', binary: '000', element: 'earth', attribute: 'the receptive, yielding' },
};

const TRIGRAM_BY_BINARY: ReadonlyMap<string, Trigram> = new Map(Object.values(TRIGRAMS).map((t) => [t.binary, t]));

/** Validated dataset (64 hexagrams in King Wen order). Throws at import time if malformed. */
export const HEXAGRAMS: HexagramSet = HexagramSetSchema.parse(hexJson);

const BY_NUMBER: readonly Hexagram[] = HEXAGRAMS.hexagrams;
const BY_BINARY: ReadonlyMap<string, Hexagram> = new Map(BY_NUMBER.map((h) => [h.lines_binary, h]));

/** Normalise a 6-line pattern: string of 0/1, array of 0/1, booleans, or line values 6/7/8/9. */
export function toBinary(lines: string | readonly (number | boolean)[]): string {
  const bits =
    typeof lines === 'string'
      ? lines.split('').map((c) => (c === '1' ? 1 : c === '0' ? 0 : NaN))
      : lines.map((v) => (typeof v === 'boolean' ? (v ? 1 : 0) : v === 7 || v === 9 || v === 1 ? 1 : v === 6 || v === 8 || v === 0 ? 0 : NaN));
  if (bits.length !== 6 || bits.some((b) => Number.isNaN(b))) throw new Error(`Invalid hexagram lines: ${String(lines)}`);
  return bits.join('');
}

export function hexagramFromBinary(bits: string | readonly (number | boolean)[]): Hexagram {
  const bin = toBinary(bits);
  const h = BY_BINARY.get(bin);
  if (!h) throw new Error(`No hexagram for binary ${bin}`);
  return h;
}

export function getHexagram(number: number): Hexagram {
  const h = BY_NUMBER[number - 1];
  if (!Number.isInteger(number) || !h) throw new RangeError(`Hexagram number must be 1..64, got ${number}`);
  return h;
}

export function trigramFromBinary(bits: string): Trigram {
  const t = TRIGRAM_BY_BINARY.get(bits);
  if (!t) throw new Error(`No trigram for binary ${bits}`);
  return t;
}

/** Split a 6-bit pattern (bottom→top) into { lower, upper } trigrams. */
export function decomposeTrigrams(bits: string | readonly (number | boolean)[]): { lower: Trigram; upper: Trigram } {
  const bin = toBinary(bits);
  return { lower: trigramFromBinary(bin.slice(0, 3)), upper: trigramFromBinary(bin.slice(3, 6)) };
}
