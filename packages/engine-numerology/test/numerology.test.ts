import { describe, expect, it } from 'vitest';
import {
  CHALDEAN,
  LIFE_PATH_AFFINITY,
  PYTHAGOREAN,
  atomKeysForNumerology,
  birthday,
  capstone,
  challenges,
  compatibility,
  computeNumerology,
  cornerstone,
  expression,
  hiddenPassion,
  lifePath,
  normalizeName,
  personalDay,
  personalMonth,
  personalYear,
  personality,
  pinnacles,
  reduce,
  soulUrge,
  toEngineOutput,
  vowelMask,
} from '../src/index.js';

describe('reduce', () => {
  it('keeps masters by default, folds them when asked', () => {
    expect(reduce(29)).toBe(11); // 2+9 = 11
    expect(reduce(29, { keepMasters: false })).toBe(2);
    expect(reduce(38)).toBe(11); // 3+8
    expect(reduce(33)).toBe(33);
    expect(reduce(44)).toBe(8); // 44 is not a master here
    expect(reduce(17)).toBe(8);
    expect(reduce(0)).toBe(0);
    expect(reduce(7)).toBe(7);
  });
});

describe('letter maps', () => {
  it('Pythagorean is position mod 9; Chaldean has no 9', () => {
    expect(PYTHAGOREAN.A).toBe(1);
    expect(PYTHAGOREAN.I).toBe(9);
    expect(PYTHAGOREAN.J).toBe(1);
    expect(PYTHAGOREAN.S).toBe(1);
    expect(PYTHAGOREAN.Z).toBe(8);
    expect(Object.keys(PYTHAGOREAN)).toHaveLength(26);
    expect(Object.keys(CHALDEAN)).toHaveLength(26);
    expect(Object.values(CHALDEAN)).not.toContain(9);
    expect(CHALDEAN.F).toBe(8);
    expect(CHALDEAN.O).toBe(7);
  });
});

describe('normalizeName', () => {
  it('"Nguyễn Văn An" → NGUYENVANAN (NFD strip + đ→d)', () => {
    const n = normalizeName('Nguyễn Văn An');
    expect(n.letters).toBe('NGUYENVANAN');
    expect(n.words).toEqual(['NGUYEN', 'VAN', 'AN']);
    expect(n.warnings).toEqual([]);
  });
  it('maps đ/Đ, ß, æ, ø, ç, ñ, ã', () => {
    expect(normalizeName('Đặng Đình Đức').letters).toBe('DANGDINHDUC');
    expect(normalizeName('Jörg Straße').letters).toBe('JORGSTRASSE');
    expect(normalizeName('Søren Kjær').letters).toBe('SORENKJAER');
    expect(normalizeName('João Peña Çelik').words).toEqual(['JOAO', 'PENA', 'CELIK']);
  });
  it('splits on hyphen/apostrophe, drops digits and punctuation', () => {
    expect(normalizeName("Mary-Jane O'Neil").words).toEqual(['MARY', 'JANE', 'O', 'NEIL']);
    expect(normalizeName('  john   smith 2nd ').letters).toBe('JOHNSMITHND');
  });
  it('CJK / Thai / Devanagari → empty letters + NAME_SCRIPT_UNSUPPORTED', () => {
    for (const name of ['王小明', '田中太郎', '김민수', 'สมชาย', 'राम']) {
      const n = normalizeName(name);
      expect(n.letters).toBe('');
      expect(n.warnings.map((w) => w.code)).toContain('NAME_SCRIPT_UNSUPPORTED');
    }
  });
  it('warns NAME_EMPTY when nothing survives', () => {
    expect(normalizeName('123 !!').warnings.map((w) => w.code)).toContain('NAME_EMPTY');
  });
});

describe('lifePath / birthday (hand verified)', () => {
  it('1997-12-24 → 8  (year 1+9+9+7=26→8, month 12→3, day 24→6; 8+3+6=17→8)', () => {
    expect(lifePath('1997-12-24')).toEqual({ value: 8, unreduced: 17, isMaster: false });
    expect(birthday('1997-12-24')).toEqual({ value: 6, unreduced: 24, isMaster: false });
  });
  it('2011-11-29 → 8  (year 2+0+1+1=4, month 11 stays, day 29→11; 4+11+11=26→8); birthday 29→11 master', () => {
    expect(lifePath('2011-11-29')).toEqual({ value: 8, unreduced: 26, isMaster: false });
    expect(birthday('2011-11-29')).toEqual({ value: 11, unreduced: 29, isMaster: true });
  });
  it('1980-11-09 → 11 (year 1+9+8+0=18→9, month 11, day 9; 9+11+9=29→11 kept as master)', () => {
    expect(lifePath('1980-11-09')).toEqual({ value: 11, unreduced: 29, isMaster: true });
    // 1980-11-27: day 27→9, same total 29→11
    expect(lifePath('1980-11-27').value).toBe(11);
    // 1980-11-18: day 18→9 → 11 as well; 1980-11-10: day 10→1 → 9+11+1=21→3
    expect(lifePath('1980-11-18').value).toBe(11);
    expect(lifePath('1980-11-10').value).toBe(3);
  });
  it('rejects malformed / impossible dates', () => {
    expect(() => lifePath('24/12/1997')).toThrow();
    expect(() => lifePath('2023-02-30')).toThrow();
    expect(() => lifePath('2024-02-29')).not.toThrow();
  });
});

describe('name numbers (Pythagorean)', () => {
  it('JOHN expression = J1+O6+H8+N5 = 20 → 2; soul urge O=6; personality 1+8+5=14→5', () => {
    expect(expression('John')).toEqual({ value: 2, unreduced: 20, isMaster: false });
    expect(soulUrge('John')).toEqual({ value: 6, unreduced: 6, isMaster: false });
    expect(personality('John')).toEqual({ value: 5, unreduced: 14, isMaster: false });
  });
  it('NGUYENVANAN: expression 48→12→3, soul urge U3+E5+A1+A1=10→1 (Y between U,E is consonant), personality 38→11', () => {
    const name = 'Nguyễn Văn An';
    expect(expression(name)).toEqual({ value: 3, unreduced: 48, isMaster: false });
    expect(soulUrge(name)).toEqual({ value: 1, unreduced: 10, isMaster: false });
    expect(personality(name)).toEqual({ value: 11, unreduced: 38, isMaster: true });
    // value 5 appears 5 times (N×4 + E×1) → hidden passion 5
    expect(hiddenPassion(name)).toEqual({ value: 5, count: 5, ties: [5] });
  });
  it('DAVID = 4+1+4+9+4 = 22 → master expression', () => {
    expect(expression('David')).toEqual({ value: 22, unreduced: 22, isMaster: true });
  });
  it('hidden passion reports ties ascending and picks the lowest', () => {
    // AB: A=1 once, B=2 once → tie between 1 and 2
    expect(hiddenPassion('AB')).toEqual({ value: 1, count: 1, ties: [1, 2] });
  });
});

describe('soul urge Y rule', () => {
  it('Y is a vowel only when not adjacent to A/E/I/O/U within the word', () => {
    expect(vowelMask('MARY')).toEqual([false, true, false, true]); // Y after R → vowel
    expect(vowelMask('KAY')).toEqual([false, true, false]); // Y after A → consonant
    expect(vowelMask('YVONNE')).toEqual([true, false, true, false, false, true]); // Y before V → vowel
    expect(vowelMask('NGUYEN')).toEqual([false, false, true, false, true, false]); // between U,E → consonant
    expect(vowelMask('LYNN')).toEqual([false, true, false, false]);
  });
  it('MARY soul urge A1+Y7 = 8; KAY soul urge A = 1, personality K2+Y7 = 9; YVONNE soul urge 7+6+5=18→9', () => {
    expect(soulUrge('Mary').value).toBe(8);
    expect(soulUrge('Kay').value).toBe(1);
    expect(personality('Kay').value).toBe(9);
    expect(soulUrge('Yvonne').value).toBe(9);
  });
  it('word boundaries break adjacency: "AMY ANN" → Y of AMY is a vowel (1+7) + A(1) = 9', () => {
    expect(soulUrge('Amy Ann').unreduced).toBe(9);
    // concatenated AMYANN would make Y a consonant (followed by A) → 1+1 = 2
    expect(soulUrge('Amyann').unreduced).toBe(2);
  });
});

describe('cornerstone / capstone', () => {
  it('reads the given name: first word by default, last word for family-first order', () => {
    expect(cornerstone('Nguyễn Văn An')).toEqual({ letter: 'N', value: 5 });
    expect(capstone('Nguyễn Văn An')).toEqual({ letter: 'N', value: 5 });
    expect(cornerstone('Nguyễn Văn An', { nameOrder: 'family-first' })).toEqual({ letter: 'A', value: 1 });
    expect(capstone('Nguyễn Văn An', { nameOrder: 'family-first' })).toEqual({ letter: 'N', value: 5 });
    expect(cornerstone('John Smith')).toEqual({ letter: 'J', value: 1 });
    expect(capstone('John Smith', { system: 'chaldean' })).toEqual({ letter: 'N', value: 5 });
  });
});

describe('Chaldean vs Pythagorean', () => {
  it('JOHN: Pythagorean 20→2, Chaldean J1+O7+H5+N5 = 18→9', () => {
    expect(expression('John', 'pythagorean').value).toBe(2);
    expect(expression('John', 'chaldean')).toEqual({ value: 9, unreduced: 18, isMaster: false });
  });
  it('computeNumerology honours system', () => {
    const p = computeNumerology({ birthDate: '1997-12-24', fullName: 'John', refDate: '2026-10-10' });
    const c = computeNumerology({ birthDate: '1997-12-24', fullName: 'John', system: 'chaldean', refDate: '2026-10-10' });
    expect(p.expression?.value).toBe(2);
    expect(c.expression?.value).toBe(9);
    expect(p.lifePath).toEqual(c.lifePath); // date numbers do not depend on the system
  });
});

describe('personal cycles', () => {
  it('1997-12-24 in 2026: PY = 3 + 6 + (2+0+2+6=10→1) = 10 → 1', () => {
    expect(personalYear('1997-12-24', 2026)).toEqual({ value: 1, unreduced: 10, isMaster: false });
  });
  it('personal month 2026-10 = 1 + (10→1) = 2; personal day changes with refDate', () => {
    expect(personalMonth('1997-12-24', '2026-10-10').value).toBe(2);
    expect(personalDay('1997-12-24', '2026-10-10').value).toBe(3); // 2 + 1
    expect(personalDay('1997-12-24', '2026-10-11').value).toBe(4); // 2 + 2
    expect(personalDay('1997-12-24', '2026-10-19').value).toBe(3); // 2 + (19→1)
    expect(personalDay('1997-12-24', '2026-11-01').value).toBe(4); // PM(Nov) = 1 + (11→2) = 3; PD = 3 + 1 = 4
  });
});

describe('challenges / pinnacles (1997-12-24: m=3, d=6, y=8, LP 8)', () => {
  it('challenges |3-6|=3, |6-8|=2, |3-2|=1, |3-8|=5', () => {
    const c = challenges('1997-12-24', 8);
    expect(c.map((x) => x.value)).toEqual([3, 2, 1, 5]);
  });
  it('pinnacles 3+6=9, 6+8=14→5, 9+5=14→5, 3+8=11 (master)', () => {
    const p = pinnacles('1997-12-24', 8);
    expect(p.map((x) => x.value)).toEqual([9, 5, 5, 11]);
    expect(p[1].unreduced).toBe(14);
    expect(p[3].isMaster).toBe(true);
  });
  it('age ranges: first ends at 36 − 8 = 28, then +9, +9, open', () => {
    const p = pinnacles('1997-12-24', 8);
    expect(p.map((x) => x.ages)).toEqual([
      { from: 0, to: 28 },
      { from: 29, to: 37 },
      { from: 38, to: 46 },
      { from: 47, to: null },
    ]);
    // master life path 11 folds to 2 → first period ends at 34
    expect(pinnacles('1980-11-09', 11)[0].ages.to).toBe(34);
  });
});

describe('karmic debt', () => {
  it('birthday 19 → karmic 19 (1990-01-19: LP 1+1+1 = 3, no LP debt)', () => {
    const r = computeNumerology({ birthDate: '1990-01-19', refDate: '2026-10-10' });
    expect(r.lifePath.value).toBe(3);
    expect(r.karmicDebt).toEqual([{ number: 19, source: 'birthday' }]);
  });
  it('life path total 14 → karmic 14 (1980-01-04: 1 + 4 + 9 = 14 → 5)', () => {
    const r = computeNumerology({ birthDate: '1980-01-04', refDate: '2026-10-10' });
    expect(r.lifePath).toEqual({ value: 5, unreduced: 14, isMaster: false });
    expect(r.karmicDebt).toEqual([{ number: 14, source: 'lifePath' }]);
  });
  it('expression total 13 → karmic 13 (LEE = 3+5+5)', () => {
    const r = computeNumerology({ birthDate: '1997-12-24', fullName: 'Lee', refDate: '2026-10-10' });
    expect(r.expression).toEqual({ value: 4, unreduced: 13, isMaster: false });
    expect(r.karmicDebt).toEqual([{ number: 13, source: 'expression' }]);
    expect(atomKeysForNumerology(r)).toContain('numerology.karmic.13');
  });
  it('1997-12-24 (LP total 17, day 24) has no karmic debt', () => {
    expect(computeNumerology({ birthDate: '1997-12-24', refDate: '2026-10-10' }).karmicDebt).toEqual([]);
  });
});

describe('computeNumerology / atom keys / engine output', () => {
  const r = computeNumerology({ birthDate: '1997-12-24', fullName: 'Nguyễn Văn An', refDate: '2026-10-10' });

  it('assembles all numbers; maturity = reduce(8 + 3) = 11 master', () => {
    expect(r.lifePath.value).toBe(8);
    expect(r.birthday.value).toBe(6);
    expect(r.expression?.value).toBe(3);
    expect(r.soulUrge?.value).toBe(1);
    expect(r.personality?.value).toBe(11);
    expect(r.maturity).toEqual({ value: 11, unreduced: 11, isMaster: true });
    expect(r.personalYear.value).toBe(1);
    expect(r.personalMonth.value).toBe(2);
    expect(r.personalDay.value).toBe(3);
    expect(r.nameLetters).toBe('NGUYENVANAN');
    expect(r.masters).toEqual([11]);
    expect(r.nameSupported).toBe(true);
    expect(r.warnings).toEqual([]);
    expect(r.currentName).toBeNull();
  });

  it('atom keys in display order', () => {
    expect(atomKeysForNumerology(r)).toEqual([
      'numerology.lifepath.8',
      'numerology.expression.3',
      'numerology.soulurge.1',
      'numerology.personality.11',
      'numerology.birthday.6',
      'numerology.maturity.11',
      'numerology.personalyear.1',
      'numerology.personalmonth.2',
      'numerology.personalday.3',
      'numerology.master.11',
    ]);
  });

  it('toEngineOutput: id numerology / 1.0.0 / high confidence', () => {
    const out = toEngineOutput(r);
    expect(out.engine).toBe('numerology');
    expect(out.engineVersion).toBe('1.0.0');
    expect(out.confidence).toBe('high');
    expect(out.facts).toBe(r);
    expect(out.atomKeys).toEqual(atomKeysForNumerology(r));
    expect(out.warnings).toEqual([]);
  });

  it('CJK name → name numbers null, NAME_SCRIPT_UNSUPPORTED, confidence medium, date numbers still present', () => {
    const cjk = computeNumerology({ birthDate: '1997-12-24', fullName: '王小明', refDate: '2026-10-10' });
    expect(cjk.expression).toBeNull();
    expect(cjk.soulUrge).toBeNull();
    expect(cjk.maturity).toBeNull();
    expect(cjk.nameSupported).toBe(false);
    expect(cjk.lifePath.value).toBe(8);
    expect(cjk.warnings.map((w) => w.code)).toEqual(['NAME_SCRIPT_UNSUPPORTED']);
    const out = toEngineOutput(cjk);
    expect(out.confidence).toBe('medium');
    expect(out.atomKeys).not.toContain('numerology.expression.3');
    expect(out.atomKeys).toContain('numerology.lifepath.8');
  });

  it('no name at all → NAME_MISSING + medium confidence', () => {
    const none = computeNumerology({ birthDate: '1997-12-24', refDate: '2026-10-10' });
    expect(none.warnings.map((w) => w.code)).toEqual(['NAME_MISSING']);
    expect(toEngineOutput(none).confidence).toBe('medium');
  });

  it('currentName is computed separately; falls back to it when fullName is absent', () => {
    const both = computeNumerology({
      birthDate: '1997-12-24',
      fullName: 'John Smith',
      currentName: 'Johnny Smith',
      refDate: '2026-10-10',
    });
    expect(both.expression?.unreduced).toBe(20 + 1 + 4 + 9 + 2 + 8); // JOHN 20 + SMITH 24 = 44 → 8
    expect(both.expression?.value).toBe(8);
    expect(both.currentName?.letters).toBe('JOHNNYSMITH');
    expect(both.currentName?.expression.unreduced).toBe(44 + 5 + 7); // + N5 Y7 = 56 → 11
    expect(both.currentName?.expression.value).toBe(11);

    const onlyCurrent = computeNumerology({ birthDate: '1997-12-24', currentName: 'Johnny Smith', refDate: '2026-10-10' });
    expect(onlyCurrent.expression?.value).toBe(11);
    expect(onlyCurrent.currentName).toBeNull();
    expect(onlyCurrent.warnings.map((w) => w.code)).toEqual(['NAME_BIRTH_MISSING_USING_CURRENT']);
  });

  it('defaults refDate to a YYYY-MM-DD string when omitted', () => {
    const d = computeNumerology({ birthDate: '1997-12-24' });
    expect(d.refDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('compatibility', () => {
  it('affinity matrix is 9×9 and symmetric', () => {
    expect(LIFE_PATH_AFFINITY).toHaveLength(9);
    for (let i = 0; i < 9; i++) {
      expect(LIFE_PATH_AFFINITY[i]).toHaveLength(9);
      for (let j = 0; j < 9; j++) expect(LIFE_PATH_AFFINITY[i]?.[j]).toBe(LIFE_PATH_AFFINITY[j]?.[i]);
    }
  });
  it('LP 8 & 8 with the same expression: 0.65×70 + 0.35×90 = 45.5 + 31.5 = 77', () => {
    const a = computeNumerology({ birthDate: '1997-12-24', fullName: 'John', refDate: '2026-10-10' });
    const b = computeNumerology({ birthDate: '2011-11-29', fullName: 'John', refDate: '2026-10-10' });
    const ab = compatibility(a, b);
    expect(ab.score).toBe(77);
    expect(ab.reasons).toEqual([
      { key: 'numerology.compat.lifepath.8-8', weight: 45.5 },
      { key: 'numerology.compat.expression.same', weight: 31.5 },
    ]);
    expect(compatibility(b, a).score).toBe(ab.score);
  });
  it('without names only the life path pair counts (8 vs 11→2: 80); both masters get +5', () => {
    const a = computeNumerology({ birthDate: '1997-12-24', refDate: '2026-10-10' });
    const b = computeNumerology({ birthDate: '1980-11-09', refDate: '2026-10-10' });
    const ab = compatibility(a, b);
    expect(ab.score).toBe(80);
    expect(ab.reasons).toEqual([{ key: 'numerology.compat.lifepath.2-8', weight: 80 }]);

    const c = computeNumerology({ birthDate: '1980-11-27', refDate: '2026-10-10' });
    const bc = compatibility(b, c);
    expect(bc.score).toBe(75 + 5);
    expect(bc.reasons.map((x) => x.key)).toContain('numerology.compat.master.both');
  });
  it('score is clamped to 0–100', () => {
    const a = computeNumerology({ birthDate: '1980-11-09', fullName: 'David', refDate: '2026-10-10' });
    const s = compatibility(a, a).score;
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});
