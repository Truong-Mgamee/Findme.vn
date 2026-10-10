import { describe, expect, it } from 'vitest';
import { describeKey, glossaryFor, loadGlossary, loadGlossaryRows, parseCsv, termLabel, TRADITIONS, keysForTradition, ZIWEI_MAJOR_STARS, ZIWEI_FOCUS_PALACES, ZIWEI_MUTAGENS, ZIWEI_PATTERNS, ZIWEI_FIVE_CLASSES } from '../src/atoms/index.js';
import { TEN_GOD_KEYS } from '@findme/engine-bazi';
import { ZHIXING_TERMS } from '@findme/engine-almanac';
import { SIGN_KEYS } from '@findme/engine-astro';

describe('glossary.csv', () => {
  const rows = loadGlossaryRows();
  it('has ≥150 unique rows in all 5 locales', () => {
    expect(rows.length).toBeGreaterThanOrEqual(150);
    expect(new Set(rows.map((r) => r.term_key)).size).toBe(rows.length);
    for (const r of rows) for (const l of ['vi', 'en', 'zh-TW', 'ja', 'ko'] as const) expect(r[l], `${r.term_key}.${l}`).not.toBe('');
  });
  it('covers the term keys the engines and manifest rely on', () => {
    const keys = new Set(rows.map((r) => r.term_key));
    for (let i = 0; i < 10; i++) expect(keys.has(`stem.${i}`)).toBe(true);
    for (let i = 0; i < 12; i++) expect(keys.has(`branch.${i}`)).toBe(true);
    for (let i = 0; i < 5; i++) expect(keys.has(`element.${i}`)).toBe(true);
    for (const g of TEN_GOD_KEYS) expect(keys.has(`tengod.${g}`)).toBe(true);
    for (const s of ZIWEI_MAJOR_STARS) expect(keys.has(`star.${s}`)).toBe(true);
    for (const p of ZIWEI_FOCUS_PALACES) expect(keys.has(`palace.${p}`)).toBe(true);
    for (const m of ZIWEI_MUTAGENS) expect(keys.has(`mutagen.${m}`)).toBe(true);
    for (const p of ZIWEI_PATTERNS) expect(keys.has(`pattern.${p}`)).toBe(true);
    for (const c of ZIWEI_FIVE_CLASSES) expect(keys.has(`fiveclass.${c}`)).toBe(true);
    for (const z of Object.keys(ZHIXING_TERMS)) expect(keys.has(`zhixing.${z}`)).toBe(true);
    for (let i = 0; i <= 21; i++) expect(keys.has(`tarot.major-${String(i).padStart(2, '0')}`)).toBe(true);
    for (const s of ['wands', 'cups', 'swords', 'pentacles']) expect(keys.has(`suit.${s}`)).toBe(true);
    for (const s of SIGN_KEYS) expect(keys.has(`sign.${s}`)).toBe(true);
    for (const n of ['lifepath', 'expression', 'soulurge', 'personality', 'maturity', 'personalyear']) expect(keys.has(`numerology.${n}`)).toBe(true);
    expect(rows.filter((r) => r.term_key.startsWith('star.')).length).toBeGreaterThanOrEqual(28);
  });
  it('loader shapes: Record<locale, Record<term_key, string>>', () => {
    const g = loadGlossary();
    expect(g.vi['palace.soulPalace']).toBe('Cung Mệnh');
    expect(g['zh-TW']['palace.soulPalace']).toBe('命宮');
    expect(glossaryFor('ko')['star.ziweiMaj']).toBe('자미');
    expect(glossaryFor('fr')['star.ziweiMaj']).toBe('Zi Wei (Emperor star)'); // falls back to en
    expect(termLabel('tengod.zhengguan', 'vi')).toBe('Chính Quan (正官)');
  });
  it('parseCsv handles quotes and CRLF', () => {
    expect(parseCsv('a,b\r\n"x, y","he said ""hi"""\n')).toEqual([['a', 'b'], ['x, y', 'he said "hi"']]);
  });
});

describe('describeKey', () => {
  it('produces a localized brief with glossary terms for every manifest key', () => {
    for (const t of TRADITIONS) {
      for (const k of keysForTradition(t)) {
        const b = describeKey(k, 'vi');
        expect(b.title, k).not.toBe(k); // every key grammar is recognised
        expect(b.reference.length).toBeGreaterThan(20);
      }
    }
  });
  it('carries PD excerpts for tarot and iching', () => {
    expect(describeKey('tarot.major-00.upright', 'en').reference).toMatch(/Waite/);
    expect(describeKey('tarot.major-00.upright', 'vi').title).toContain('Chàng Khờ');
    expect(describeKey('iching.hex.1.line.3', 'en').reference).toMatch(/active all day/);
    expect(describeKey('iching.hex.2.relating', 'vi').title).toMatch(/Quẻ biến 2/);
    expect(describeKey('ziwei.star.ziweiMaj.palace.soulPalace', 'vi')).toMatchObject({ title: 'Tử Vi tại Cung Mệnh', terms: ['star.ziweiMaj', 'palace.soulPalace'] });
    expect(describeKey('bazi.shishen.zhengguan.month', 'en').title).toBe('Direct Officer on the month pillar');
  });
});
