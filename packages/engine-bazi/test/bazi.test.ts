import { describe, expect, it } from 'vitest';
import type { BirthInput } from '@findme/engine-core';
import { atomKeysForBazi, computeBazi, stageOf, tenGod } from '../src/index.js';

const HANOI = { name: 'Hà Nội', lat: 21.0285, lng: 105.8542, tz: 'Asia/Ho_Chi_Minh', country: 'VN' };
const base = (o: Partial<BirthInput> = {}): BirthInput => ({ date: '1997-12-24', time: '12:00', timeUnknown: false, gender: 'female', place: HANOI, calendarStandard: 'vn', ...o });

describe('tenGod', () => {
  // day master 庚 (6, yang metal)
  it('matches lunar-typescript for 1997-12-24: year 丁→正官, month 壬→食神, hour 壬→食神', () => {
    expect(tenGod(6, 3)).toBe('zhengguan');
    expect(tenGod(6, 8)).toBe('shishen');
    expect(tenGod(6, 6)).toBe('bijian');
    expect(tenGod(6, 7)).toBe('jiecai');
    expect(tenGod(6, 0)).toBe('piancai'); // 甲 wood controlled by metal, same polarity
    expect(tenGod(6, 1)).toBe('zhengcai');
    expect(tenGod(6, 2)).toBe('qisha'); // 丙 fire controls metal, same polarity
    expect(tenGod(6, 4)).toBe('pianyin'); // 戊 earth generates metal
    expect(tenGod(6, 5)).toBe('zhengyin');
    expect(tenGod(6, 9)).toBe('shangguan');
  });
});

describe('stageOf (十二長生)', () => {
  it('甲 long-life at 亥, 帝旺 at 卯; 乙 (yin) long-life at 午 counting backward', () => {
    expect(stageOf(0, 11)).toBe(0);
    expect(stageOf(0, 3)).toBe(4);
    expect(stageOf(1, 6)).toBe(0);
    expect(stageOf(1, 5)).toBe(1); // 乙 沐浴 at 巳
  });
});

describe('computeBazi', () => {
  it('1997-12-24 12:00 Hanoi female → 丁丑 壬子 庚子 壬午, nayin day 壁上土, start luck ≈ 4y, 2002 癸丑, 2012 甲寅, 2022 乙卯 (matches lunar-typescript)', () => {
    const c = computeBazi(base(), { locale: 'vi', now: '2026-10-10' });
    expect(c.pillars.map((p) => p.ganzhi.han)).toEqual(['丁丑', '壬子', '庚子', '壬午']);
    expect(c.pillars[2]!.nayin.han).toBe('壁上土');
    expect(c.dayMaster.label).toBe('Canh');
    expect(c.pillars[0]!.tenGodLabel).toBe('Chính Quan');
    expect(c.luck.direction).toBe('forward'); // 丁 yin year + female → forward
  });
  it('luck direction: yin year + female → forward; yang year + female → backward', () => {
    const f = computeBazi(base(), { now: '2026-10-10' }); // 1997 丁 (yin), female
    expect(f.luck.direction).toBe('forward');
    const m = computeBazi(base({ gender: 'male' }), { now: '2026-10-10' });
    expect(m.luck.direction).toBe('backward');
  });
  it('forward luck from 壬子 month: first period 癸丑 starting ~age 4 → year ≈ 2001-2002', () => {
    const c = computeBazi(base(), { now: '2026-10-10' });
    expect(c.luck.periods[0]!.ganzhi.han).toBe('癸丑');
    expect(c.luck.periods[1]!.ganzhi.han).toBe('甲寅');
    expect(c.luck.startAgeYears).toBe(4);
    expect(c.luck.periods[0]!.startYear).toBeGreaterThanOrEqual(2001);
    expect(c.luck.periods[0]!.startYear).toBeLessThanOrEqual(2002);
  });
  it('annual luck window and strength/favorable are populated', () => {
    const c = computeBazi(base(), { now: '2026-10-10', annualWindow: 2 });
    expect(c.annual).toHaveLength(5);
    expect(c.annual.find((a) => a.year === 2026)!.ganzhi.han).toBe('丙午');
    expect(['strong', 'weak', 'balanced']).toContain(c.strength.verdict);
    expect(c.favorable.useful.length).toBeGreaterThan(0);
    expect(c.confidence).toBe('high');
  });
  it('time unknown → 3 pillars, medium confidence, warning', () => {
    const c = computeBazi(base({ time: undefined, timeUnknown: true }));
    expect(c.pillars).toHaveLength(3);
    expect(c.confidence).toBe('medium');
    expect(c.warnings.some((w) => w.code === 'HOUR_PILLAR_MISSING')).toBe(true);
  });
  it('atom keys include day master, ten gods per pillar and useful elements', () => {
    const keys = atomKeysForBazi(computeBazi(base(), { now: '2026-10-10' }));
    expect(keys).toContain('bazi.daymaster.6');
    expect(keys).toContain('bazi.shishen.zhengguan.year');
    expect(keys).toContain('bazi.shishen.shishen.month');
    expect(keys.some((k) => k.startsWith('bazi.useful.'))).toBe(true);
  });
  it('same instant in two zones gives identical year/month pillars; day/hour follow local clock', () => {
    const hn = computeBazi(base({ date: '2026-02-04', time: '03:30', useTrueSolarTime: false }));
    const la = computeBazi(base({ date: '2026-02-03', time: '12:30', useTrueSolarTime: false, place: { name: 'LA', lat: 34.05, lng: -118.24, tz: 'America/Los_Angeles' }, calendarStandard: 'cn' }));
    expect(la.pillars[0]!.ganzhi.han).toBe(hn.pillars[0]!.ganzhi.han);
    expect(la.pillars[1]!.ganzhi.han).toBe(hn.pillars[1]!.ganzhi.han);
    expect(la.pillars[2]!.ganzhi.han).not.toBe(hn.pillars[2]!.ganzhi.han);
  });
});
