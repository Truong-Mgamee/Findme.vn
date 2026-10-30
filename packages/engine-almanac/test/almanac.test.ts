import { describe, expect, it } from 'vitest';
import { atomKeysForAlmanac, getDayAlmanac, personalizeAlmanac, pickDates } from '../src/index.js';

describe('getDayAlmanac (verified against lunar-typescript for 2026-10-10)', () => {
  const a = getDayAlmanac('2026-10-10', 'cn', 'vi');
  it('day 丁巳, 明堂 黄道, trực 危, tú 柳 (hung), 宜 includes 嫁娶, 忌 includes 上梁', () => {
    expect(a.dayGanzhi.han).toBe('丁巳');
    expect(a.huangdao).toBe(true);
    expect(a.zhixing).toMatchObject({ code: '危', label: 'Nguy', good: true });
    expect(a.xiu).toMatchObject({ code: '柳', auspicious: false });
    expect(a.yi.map((i) => i.code)).toContain('嫁娶');
    expect(a.yi.find((i) => i.code === '嫁娶')!.label).toBe('Cưới hỏi');
    expect(a.ji.map((i) => i.code)).toContain('上梁');
    expect(a.clash).toMatchObject({ branch: 11, zodiacLabel: 'Lợn', ganzhiHan: '(辛亥)猪' });
    expect(a.nineStar.number).toBe(4);
    expect(a.solarTerm.next).toBe('霜降');
    expect(a.solarTerm.nextDate).toBe('2026-10-23');
    expect(a.hours).toHaveLength(13);
    expect(a.hours[1]).toMatchObject({ from: '01:00', to: '02:59', auspicious: true });
  });
  it('lunar display follows the standard (CN 9/1 vs VN)', () => {
    expect(a.lunar).toMatchObject({ month: 9, day: 1 });
    const vn = getDayAlmanac('1985-01-21', 'vn', 'vi');
    const cn = getDayAlmanac('1985-01-21', 'cn', 'vi');
    expect(vn.lunar).toMatchObject({ year: 1985, month: 1, day: 1 });
    expect(cn.lunar).toMatchObject({ year: 1984, month: 12, day: 1 });
    expect(vn.dayGanzhi.han).toBe(cn.dayGanzhi.han); // day ganzhi is standard-independent
  });
  it('english labels', () => {
    const e = getDayAlmanac('2026-10-10', 'cn', 'en');
    expect(e.yi[0]!.label).toBe('Wedding');
    expect(e.zhixing.label).toBe('Danger');
    expect(e.clash.zodiacLabel).toBe('Pig');
  });
});

describe('personalizeAlmanac', () => {
  const a = getDayAlmanac('2026-10-10', 'vn', 'vi'); // day branch 巳 → clashes 亥
  it('flags clash for a 亥 (Hợi) person and not for a 丑 person', () => {
    expect(personalizeAlmanac(a, { yearBranch: 11 }).personal.clashesWithUser).toBe(true);
    const ox = personalizeAlmanac(a, { yearBranch: 1, usefulElements: [1] });
    expect(ox.personal.clashesWithUser).toBe(false);
    expect(ox.personal.favorableElementDay).toBe(true); // 丁 fire day
    expect(ox.personal.luckyColor.hex).toBe('#D64545');
    expect(ox.personal.luckyNumbers.length).toBeGreaterThan(0);
  });
  it('harm pair 子-未', () => {
    const z = getDayAlmanac('2026-10-05', 'vn', 'vi'); // find a 子 day in window
    const sub = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'].map((d) => getDayAlmanac(d, 'vn', 'vi'));
    const ziDay = sub.find((x) => x.dayGanzhi.branch === 0)!;
    expect(personalizeAlmanac(ziDay, { yearBranch: 7 }).personal.harmsUser).toBe(true);
    void z;
  });
});

describe('pickDates', () => {
  it('ranks wedding days in Oct 2026 for a 丁丑 (Sửu) person and never returns a clashing day on top', () => {
    const r = pickDates({ task: 'wedding', from: '2026-10-01', to: '2026-10-31', profiles: [{ yearBranch: 1 }], standard: 'vn', locale: 'vi', limit: 5 });
    expect(r).toHaveLength(5);
    expect(r[0]!.score).toBeGreaterThanOrEqual(r[4]!.score);
    for (const d of r) expect((d.almanac.dayGanzhi.branch + 6) % 12).not.toBe(1);
    expect(r[0]!.reasons.some((x) => x.key === 'yi_match')).toBe(true);
  });
  it('includes 2026-10-10 as a strong wedding candidate (嫁娶 + 黄道 + 危)', () => {
    const r = pickDates({ task: 'wedding', from: '2026-10-08', to: '2026-10-12', profiles: [], standard: 'cn' });
    expect(r.map((x) => x.date)).toContain('2026-10-10');
  });
});

describe('atom keys', () => {
  it('produces stable keys', () => {
    const a = getDayAlmanac('2026-10-10', 'cn');
    const keys = atomKeysForAlmanac(a, personalizeAlmanac(a, { yearBranch: 11 }).personal);
    expect(keys).toContain('almanac.tianshen.huangdao');
    expect(keys).toContain('almanac.zhixing.危');
    expect(keys).toContain('almanac.personal.clash');
  });
});
