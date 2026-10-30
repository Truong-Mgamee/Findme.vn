import { describe, expect, it } from 'vitest';
import type { BirthInput } from '@findme/engine-core';
import { atomKeysForZiwei, computeZiwei, computeZiweiHoroscope, detectPatterns } from '../src/index.js';

const HANOI = { name: 'Hà Nội', lat: 21.0285, lng: 105.8542, tz: 'Asia/Ho_Chi_Minh', country: 'VN' };
const base = (o: Partial<BirthInput> = {}): BirthInput => ({ date: '1997-12-24', time: '12:00', timeUnknown: false, gender: 'female', place: HANOI, calendarStandard: 'vn', ...o });

describe('computeZiwei (snapshot vs iztro demo output in docs/03 §6.1)', () => {
  const c = computeZiwei(base(), { locale: 'vi' });
  it('soul 破軍 / body 天相 / 水二局 / zodiac Trâu, 12 palaces, vi-VN names', () => {
    expect(c.soul).toEqual({ key: 'pojunMaj', name: 'Phá Quân' });
    expect(c.body.name).toBe('Thiên Tướng');
    expect(c.fiveElementsClass).toEqual({ key: 'water2nd', name: 'Thủy Nhị Cục' });
    expect(c.zodiac).toBe('Trâu');
    expect(c.palaces).toHaveLength(12);
    expect(c.input).toEqual({ lunarDate: '1997-11-25', isLeapMonth: false, timeIndex: 6, standard: 'vn' });
    expect(c.chineseDate).toBe('Đinh Sửu - Nhâm Tý - Canh Tý - Nhâm Ngọ');
    expect(c.confidence).toBe('high');
  });
  it('palace keys are stable across languages while names localize', () => {
    const en = computeZiwei(base(), { locale: 'en' });
    expect(en.palaces.map((p) => p.key)).toEqual(c.palaces.map((p) => p.key));
    expect(en.palaces[0]!.name).toBe('wealth');
    expect(c.palaces[0]!.name).toBe('Tài Bạch');
    expect(c.palaces[0]!.stem).toMatchObject({ han: '壬', name: 'Nhâm' });
    expect(c.palaces[0]!.branch).toMatchObject({ han: '寅', name: 'Dần' });
  });
  it('spouse palace has 太陰 with 祿 mutagen (丁 stem: 太陰化祿)', () => {
    const spouse = c.palaces.find((p) => p.key === 'spousePalace')!;
    const taiyin = spouse.majorStars.find((s) => s.key === 'taiyinMaj')!;
    expect(taiyin.mutagen?.name).toBe('Lộc');
    expect(taiyin.brightness?.name).toBe('Hạn');
  });
  it('命宮 at 午 holds 巨門 + 祿存 → 羊陀夾命 detected; no 殺破狼 (三方 = 巨門/天機/太陽)', () => {
    const soul = c.palaces.find((p) => p.key === 'soulPalace')!;
    expect(soul.branch.han).toBe('午');
    expect(soul.majorStars.map((s) => s.key)).toEqual(['jumenMaj']);
    const keys = c.patterns.map((p) => p.key);
    expect(keys).toContain('yangTuoJiaMing');
    expect(keys).not.toContain('shaPoLang');
  });
  it('atom keys reference soul star, palaces and patterns', () => {
    const keys = atomKeysForZiwei(c);
    expect(keys).toContain('ziwei.soulstar.pojunMaj');
    expect(keys).toContain('ziwei.fiveclass.water2nd');
    expect(keys).toContain('ziwei.star.taiyinMaj.palace.spousePalace');
    expect(keys).toContain('ziwei.pattern.yangTuoJiaMing');
    expect(keys).toContain('ziwei.star.jumenMaj.palace.soulPalace');
  });
});

describe('national calendar standard matters for Zi Wei', () => {
  it('1985-01-21: VN chart is year 乙丑 month 1, CN chart is 甲子 month 12 — different charts', () => {
    const vn = computeZiwei(base({ date: '1985-01-21', time: '10:00' }), { locale: 'vi' });
    const cn = computeZiwei(base({ date: '1985-01-21', time: '10:00', calendarStandard: 'cn' }), { locale: 'vi' });
    expect(vn.input.lunarDate).toBe('1985-1-1');
    expect(cn.input.lunarDate).toBe('1984-12-1');
    expect(vn.chineseDate.split(' - ')[0]).toBe('Ất Sửu');
    expect(cn.chineseDate.split(' - ')[0]).toBe('Giáp Tý');
    expect(vn.soulPalaceBranch.key).not.toBe(cn.soulPalaceBranch.key);
  });
});

describe('options', () => {
  it('time unknown → noon assumed, confidence low', () => {
    const c = computeZiwei(base({ time: undefined, timeUnknown: true }));
    expect(c.confidence).toBe('low');
    expect(c.warnings.some((w) => w.code === 'ZIWEI_TIME_ASSUMED')).toBe(true);
  });
  it('late 子 (23:30) uses timeIndex 12 and next-day lunar date', () => {
    const c = computeZiwei(base({ time: '23:30', useTrueSolarTime: false }));
    expect(c.input.timeIndex).toBe(12);
    expect(c.input.lunarDate).toBe('1997-11-26');
  });
  it('全書 school changes 壬 科 from 左輔 (iztro default = flying-star) to 天府 (1992 壬申 year); config does not leak', () => {
    const inp = base({ date: '1992-06-01', time: '08:00' });
    const keOf = (c: ReturnType<typeof computeZiwei>) => c.palaces.flatMap((p) => [...p.majorStars, ...p.minorStars]).find((s) => s.mutagen?.name === '科')?.key;
    expect(keOf(computeZiwei(inp, { locale: 'zh-TW' }))).toBe('zuofuMin');
    const qs = computeZiwei(inp, { locale: 'zh-TW', school: 'quanshu' });
    expect(keOf(qs)).toBe('tianfuMaj');
    expect(qs.schoolVerified).toBe(false);
    expect(qs.warnings.some((w) => w.code === 'SCHOOL_UNVERIFIED')).toBe(true);
    expect(keOf(computeZiwei(inp, { locale: 'zh-TW', school: 'khamThienTuHoa' }))).toBe('zuofuMin');
    expect(keOf(computeZiwei(inp, { locale: 'zh-TW' }))).toBe('zuofuMin');
  });
});

describe('horoscope', () => {
  it('2026-10-10: decadal 戊申 (index 6), yearly 丙午 with 4 mutagens', () => {
    const h = computeZiweiHoroscope(base(), '2026-10-10', { locale: 'vi' });
    expect(h.decadal).toMatchObject({ index: 6, stem: 'Mậu', branch: 'Thân' });
    expect(h.yearly).toMatchObject({ stem: 'Bính', branch: 'Ngọ' });
    expect(h.yearly.mutagen.map((m) => m.key)).toEqual(['tiantongMaj', 'tianjiMaj', 'wenchangMin', 'lianzhenMaj']);
    expect(h.age.nominalAge).toBe(30);
  });
});

describe('detectPatterns unit', () => {
  const blank = (i: number, key: string, majors: string[] = []) => ({ index: i, key, name: '', stem: { index: 0, han: '', name: '' }, branch: { index: 0, han: '', name: '' }, isBodyPalace: false, isOriginalPalace: false, majorStars: majors.map((k) => ({ key: k, name: k, type: 'major', brightness: null, mutagen: null })), minorStars: [], adjectiveStars: [], changsheng12: '', boshi12: '', jiangqian12: '', suiqian12: '', decadal: { range: [0, 0] as [number, number], stem: '', branch: '' }, ages: [] });
  it('flags empty soul palace', () => {
    const palaces = Array.from({ length: 12 }, (_, i) => blank(i, i === 0 ? 'soulPalace' : `p${i}`));
    expect(detectPatterns(palaces).map((p) => p.key)).toContain('mingWuZhengYao');
  });
  it('flags 殺破狼 when 七殺 in 命 and 破軍/貪狼 in 三方 (idx +4/+8)', () => {
    const palaces = Array.from({ length: 12 }, (_, i) => blank(i, i === 0 ? 'soulPalace' : `p${i}`, i === 0 ? ['qishaMaj'] : i === 4 ? ['pojunMaj'] : i === 8 ? ['tanlangMaj'] : []));
    expect(detectPatterns(palaces).map((p) => p.key)).toContain('shaPoLang');
  });
});
