import { describe, expect, it } from 'vitest';
import type { BirthInput } from '@findme/engine-core';
import { civilToLunar, computePillars, currentJie, dayGanzhi, equationOfTimeMinutes, hourBranchOf, lichunUtc, lunarToCivil, resolveBirth, resolveBirthMoment } from '../src/index.js';

const HANOI = { name: 'Hà Nội', lat: 21.0285, lng: 105.8542, tz: 'Asia/Ho_Chi_Minh', country: 'VN' };
const base = (o: Partial<BirthInput> = {}): BirthInput => ({
  date: '1997-12-24',
  time: '12:00',
  timeUnknown: false,
  gender: 'female',
  place: HANOI,
  calendarStandard: 'vn',
  ...o,
});

describe('VN vs CN lunar standard (golden, verified against lunar-date-vn / lunar-typescript)', () => {
  const cases: Array<[string, [number, number, number], [number, number, number]]> = [
    // date, VN (y,m,d), CN (y,m,d)  — Tết 1985: VN one month earlier than China
    ['1985-01-21', [1985, 1, 1], [1984, 12, 1]],
    ['1985-02-20', [1985, 2, 1], [1985, 1, 1]],
    ['2007-02-17', [2007, 1, 1], [2006, 12, 30]],
    ['2007-02-18', [2007, 1, 2], [2007, 1, 1]],
    ['2030-02-02', [2030, 1, 1], [2029, 12, 30]],
    ['2030-02-03', [2030, 1, 2], [2030, 1, 1]],
    // agreement cases
    ['2026-02-17', [2026, 1, 1], [2026, 1, 1]],
    ['1997-12-24', [1997, 11, 25], [1997, 11, 25]],
  ];
  for (const [date, vn, cn] of cases) {
    it(`${date}: vn=${vn.join('/')} cn=${cn.join('/')}`, () => {
      const [y, m, d] = date.split('-').map(Number) as [number, number, number];
      const a = civilToLunar(y, m, d, 'vn');
      const b = civilToLunar(y, m, d, 'cn');
      expect([a.year, a.month, a.day]).toEqual(vn);
      expect([b.year, b.month, b.day]).toEqual(cn);
    });
  }
  it('leap month 2023 (nhuận tháng 2) flagged in both standards', () => {
    expect(civilToLunar(2023, 3, 25, 'vn')).toMatchObject({ year: 2023, month: 2, day: 4, isLeapMonth: true });
    expect(civilToLunar(2023, 3, 25, 'cn')).toMatchObject({ year: 2023, month: 2, day: 4, isLeapMonth: true });
  });
  it('kr/jp are flagged as approximations', () => {
    const r = civilToLunar(2026, 10, 10, 'kr');
    expect(r.approximation).toBe(true);
    expect(r.warnings[0]?.code).toBe('LUNAR_STD_APPROX');
  });
  it('round-trips lunar → civil', () => {
    expect(lunarToCivil(1985, 1, 1, false, 'vn')).toBe('1985-01-21');
    expect(lunarToCivil(1985, 1, 1, false, 'cn')).toBe('1985-02-20');
    expect(lunarToCivil(2023, 2, 4, true, 'vn')).toBe('2023-03-25');
  });
});

describe('resolveBirthMoment', () => {
  it('computes true solar correction for Hanoi (105.85°E vs 105°E meridian ≈ +3.4 min + EoT)', () => {
    const m = resolveBirthMoment(base());
    expect(m.zone).toBe('Asia/Ho_Chi_Minh');
    expect(m.zoneOffsetMinutes).toBe(420);
    expect(m.dstApplied).toBe(false);
    expect(m.solarCorrectionMinutes).toBeGreaterThan(2);
    expect(m.solarCorrectionMinutes).toBeLessThan(6);
    expect(m.utc.toISOString()).toBe('1997-12-24T05:00:00.000Z');
  });
  it('detects DST (New York, July)', () => {
    const m = resolveBirthMoment(base({ date: '2024-07-04', place: { name: 'New York', lat: 40.71, lng: -74.0, tz: 'America/New_York' } }));
    expect(m.dstApplied).toBe(true);
    expect(m.zoneOffsetMinutes).toBe(-240);
  });
  it('estimates zone from longitude when tz missing', () => {
    const m = resolveBirthMoment(base({ place: { name: 'x', lat: 10, lng: 106 } }));
    expect(m.zone).toBe('UTC+7');
    expect(m.warnings.some((w) => w.code === 'TZ_ESTIMATED')).toBe(true);
  });
  it('time unknown → noon + warning', () => {
    const m = resolveBirthMoment(base({ time: undefined, timeUnknown: true }));
    expect(m.local.time).toBe('12:00');
    expect(m.warnings.some((w) => w.code === 'TIME_UNKNOWN')).toBe(true);
  });
  it('equation of time is near zero at Dec 24 and ~ -14 min mid-February', () => {
    expect(Math.abs(equationOfTimeMinutes(new Date('1997-12-24T05:00:00Z')))).toBeLessThan(1.5);
    expect(equationOfTimeMinutes(new Date('2024-02-11T12:00:00Z'))).toBeLessThan(-13);
  });
});

describe('pillars (Bazi) — verified against lunar-typescript EightChar', () => {
  it('1997-12-24 12:00 Hanoi female → 丁丑 壬子 庚子 壬午', () => {
    const p = computePillars(resolveBirthMoment(base()));
    expect([p.year.han, p.month.han, p.day.han, p.hour?.han]).toEqual(['丁丑', '壬子', '庚子', '壬午']);
    expect(p.solarYear).toBe(1997);
  });
  it('late Zi 23:30 rolls day pillar with 23:00 boundary, keeps it with 00:00 boundary', () => {
    const m = resolveBirthMoment(base({ time: '23:30', useTrueSolarTime: false }));
    const a = computePillars(m, { dayBoundary: '23:00' });
    const b = computePillars(m, { dayBoundary: '00:00' });
    expect(a.day.han).toBe('辛丑');
    expect(a.hour?.han).toBe('戊子');
    expect(b.day.han).toBe('庚子');
    expect(b.hour?.han).toBe('戊子'); // hour stem still from next day's stem
  });
  it('立春 2026 boundary in Hanoi: 02:30 → 乙巳, 03:30 → 丙午 (Lichun = 2026-02-03T20:02:08Z)', () => {
    expect(lichunUtc(2026).toISOString()).toBe('2026-02-03T20:02:08.000Z');
    const before = computePillars(resolveBirthMoment(base({ date: '2026-02-04', time: '02:30', useTrueSolarTime: false })));
    const after = computePillars(resolveBirthMoment(base({ date: '2026-02-04', time: '03:30', useTrueSolarTime: false })));
    expect(before.year.han).toBe('乙巳');
    expect(before.month.han).toBe('己丑');
    expect(after.year.han).toBe('丙午');
    expect(after.month.han).toBe('庚寅');
  });
  it('same instant, different zones → same year/month pillars (absolute solar terms)', () => {
    const hn = computePillars(resolveBirthMoment(base({ date: '2026-02-04', time: '03:30', useTrueSolarTime: false })));
    const tokyo = computePillars(resolveBirthMoment(base({ date: '2026-02-04', time: '05:30', useTrueSolarTime: false, place: { name: 'Tokyo', lat: 35.68, lng: 139.69, tz: 'Asia/Tokyo' }, calendarStandard: 'jp' })));
    expect(tokyo.year.han).toBe(hn.year.han);
    expect(tokyo.month.han).toBe(hn.month.han);
  });
  it('hour branch boundaries', () => {
    expect(hourBranchOf(23, 0)).toBe(0);
    expect(hourBranchOf(0, 59)).toBe(0);
    expect(hourBranchOf(1, 0)).toBe(1);
    expect(hourBranchOf(12, 0)).toBe(6);
    expect(hourBranchOf(22, 59)).toBe(11);
  });
  it('day ganzhi matches known dates', () => {
    expect(dayGanzhi(1997, 12, 24).han).toBe('庚子');
    expect(dayGanzhi(2026, 10, 10).han).toBe('丁巳'); // 10517 days after 庚子 (index 36) → index 53
  });
  it('currentJie for 1997-12-24 is 大雪 (index 10)', () => {
    expect(currentJie(new Date('1997-12-24T05:00:00Z')).index).toBe(10);
  });
});

describe('resolveBirth facade', () => {
  it('returns lunar date per standard and pillars together', () => {
    const r = resolveBirth(base());
    expect(r.lunar).toMatchObject({ year: 1997, month: 11, day: 25, standard: 'vn' });
    expect(r.lunar.yearGanzhi.han).toBe('丁丑');
    expect(r.pillars.hour?.han).toBe('壬午');
    expect(r.lunarForChart.hourBranch).toBe(6);
  });
  it('1985-01-21 Hanoi: lunar year differs by standard but Bazi year pillar is the same (both before 立春)', () => {
    const vn = resolveBirth(base({ date: '1985-01-21', time: '10:00' }));
    const cn = resolveBirth(base({ date: '1985-01-21', time: '10:00', calendarStandard: 'cn' }));
    expect(vn.lunar.year).toBe(1985);
    expect(cn.lunar.year).toBe(1984);
    expect(vn.pillars.year.han).toBe(cn.pillars.year.han);
    expect(vn.pillars.year.han).toBe('甲子');
  });
});
