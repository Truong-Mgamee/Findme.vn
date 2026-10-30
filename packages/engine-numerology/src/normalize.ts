import type { EngineWarning } from '@findme/engine-core';
import type { NormalizedName } from './types.js';

export const WARN_NAME_SCRIPT_UNSUPPORTED = 'NAME_SCRIPT_UNSUPPORTED';
export const WARN_NAME_EMPTY = 'NAME_EMPTY';
export const WARN_NAME_MISSING = 'NAME_MISSING';
export const WARN_NAME_BIRTH_MISSING_USING_CURRENT = 'NAME_BIRTH_MISSING_USING_CURRENT';

/**
 * Scripts that have no Latin-letter numerology mapping. Han/Kana/Hangul, Thai, Devanagari.
 * (Explicit ranges rather than \p{Script=…} so the regex also works on older RN/Hermes builds.)
 */
const UNSUPPORTED_SCRIPT =
  /[ᄀ-ᇿ⺀-⿟぀-ヿ㄰-㆏㐀-䶿一-鿿ꥠ-꥿가-퟿豈-﫿฀-๿ऀ-ॿ]/;

/** Surrogate pairs covering CJK Extension B+ (U+20000–U+2FA1F). */
const UNSUPPORTED_SUPPLEMENTARY = /[\uD840-\uD87F][\uDC00-\uDFFF]/;

/** Letters that NFD does not decompose into base + combining mark. */
const SPECIAL: Readonly<Record<string, string>> = Object.freeze({
  đ: 'd', Đ: 'D',
  ß: 'ss', ẞ: 'SS',
  æ: 'ae', Æ: 'AE',
  ø: 'o', Ø: 'O',
  œ: 'oe', Œ: 'OE',
  ł: 'l', Ł: 'L',
  þ: 'th', Þ: 'TH',
  ð: 'd', Ð: 'D',
  ı: 'i',
});

/**
 * Normalize a personal name to A–Z letters.
 * 1. Unicode NFD, drop combining marks (U+0300–U+036F): ễ→e, ç→c, ñ→n, ü→u …
 * 2. Map letters NFD cannot decompose: đ/Đ→d, ß→ss, æ→ae, ø→o, œ→oe, ł→l, þ→th, ð→d.
 * 3. Uppercase; keep A–Z only. Whitespace / hyphen / apostrophe / period split words; everything else is dropped.
 * If the input contains CJK, Kana, Hangul, Thai or Devanagari characters, letters is '' with
 * warning NAME_SCRIPT_UNSUPPORTED (those names need a different method — wave 2).
 */
export function normalizeName(name: string): NormalizedName {
  const warnings: EngineWarning[] = [];
  const raw = name ?? '';

  if (UNSUPPORTED_SCRIPT.test(raw) || UNSUPPORTED_SUPPLEMENTARY.test(raw)) {
    warnings.push({
      code: WARN_NAME_SCRIPT_UNSUPPORTED,
      message: 'Name contains CJK/Thai/Devanagari characters; Latin-letter numerology does not apply.',
    });
    return { letters: '', words: [], warnings };
  }

  let s = '';
  for (const ch of raw) s += SPECIAL[ch] ?? ch;
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

  const words = s
    .split(/[\s\-'’.·,]+/)
    .map((w) => w.replace(/[^A-Z]/g, ''))
    .filter((w) => w.length > 0);
  const letters = words.join('');

  if (letters.length === 0) {
    warnings.push({ code: WARN_NAME_EMPTY, message: 'Name contains no A–Z letters after normalization.' });
  }
  return { letters, words, warnings };
}
