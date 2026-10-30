import { describe, expect, it } from 'vitest';
import { resolveBirth } from '@findme/engine-calendar';
import { computeBazi } from '@findme/engine-bazi';
import { computeZiwei, computeZiweiHoroscope } from '@findme/engine-ziwei';
import { getDayAlmanac, personalizeAlmanac, pickDates } from '@findme/engine-almanac';
import { computeNumerology } from '@findme/engine-numerology';
import { computeNatalChart, dailySky } from '@findme/engine-astro';
import { dailyCard, drawCards } from '@findme/engine-tarot';
import { castHexagram } from '@findme/engine-iching';
import { PROFILES } from '../src/profiles.js';

const NOW = '2026-10-10';

describe('golden: calendar + bazi + ziwei per profile', () => {
  for (const p of PROFILES) {
    it(`${p.id} — ${p.note}`, () => {
      const rb = resolveBirth(p.input);
      const bazi = computeBazi(p.input, { locale: 'vi', now: NOW, annualWindow: 1 });
      const zw = computeZiwei(p.input, { locale: 'vi' });
      const h = computeZiweiHoroscope(p.input, NOW, { locale: 'vi' });
      const snap = {
        zone: rb.moment.zone,
        dst: rb.moment.dstApplied,
        solarCorrectionMin: rb.moment.solarCorrectionMinutes,
        lunar: `${rb.lunar.year}/${rb.lunar.isLeapMonth ? 'L' : ''}${rb.lunar.month}/${rb.lunar.day}`,
        lunarForChart: `${rb.lunarForChart.year}/${rb.lunarForChart.isLeapMonth ? 'L' : ''}${rb.lunarForChart.month}/${rb.lunarForChart.day}`,
        pillars: [rb.pillars.year.han, rb.pillars.month.han, rb.pillars.day.han, rb.pillars.hour?.han ?? null],
        bazi: { dayMaster: bazi.dayMaster.label, strength: bazi.strength.verdict, useful: bazi.favorable.useful, luckDir: bazi.luck.direction, luckStart: `${bazi.luck.startAgeYears}y${bazi.luck.startAgeMonths}m`, firstPeriods: bazi.luck.periods.slice(0, 3).map((x) => `${x.startYear}:${x.ganzhi.han}`) },
        ziwei: { soul: zw.soul.key, body: zw.body.key, five: zw.fiveElementsClass.key, soulBranch: zw.soulPalaceBranch.key, patterns: zw.patterns.map((x) => x.key), palaces: zw.palaces.map((pl) => `${pl.key}:${pl.branch.han}:${pl.majorStars.map((s) => s.key + (s.mutagen ? '*' + s.mutagen.key : '')).join('+')}`), timeIndex: zw.input.timeIndex, confidence: zw.confidence },
        horoscope: { decadal: `${h.decadal.stem}${h.decadal.branch}@${h.decadal.index}`, yearly: `${h.yearly.stem}${h.yearly.branch}`, age: h.age.nominalAge },
        warnings: [...rb.moment.warnings, ...rb.lunar.warnings].map((w) => w.code),
      };
      expect(snap).toMatchSnapshot();
    });
  }
});

describe('golden: western engines per profile', () => {
  for (const p of PROFILES) {
    it(`${p.id}`, () => {
      const rb = resolveBirth(p.input);
      const num = computeNumerology({ birthDate: p.input.date, fullName: 'Nguyen Van An', refDate: NOW });
      const chart = computeNatalChart({ utc: rb.moment.utc, lat: p.input.place.lat, lng: p.input.place.lng, houseSystem: 'placidus' });
      const snap = {
        lifePath: num.lifePath,
        personalDay: num.personalDay,
        sun: chart.sun,
        moon: chart.moon,
        rising: p.input.timeUnknown ? null : chart.rising,
        asc: Math.round(chart.angles.asc * 100) / 100,
        mc: Math.round(chart.angles.mc * 100) / 100,
        retro: chart.planets.filter((x) => x.retrograde).map((x) => x.body),
        aspects: chart.aspects.length,
        warnings: chart.warnings,
      };
      expect(snap).toMatchSnapshot();
    });
  }
});

describe('golden: daily content determinism (2026-10-10)', () => {
  it('almanac vn/cn, tarot daily, iching cast, sky', () => {
    const vn = getDayAlmanac(NOW, 'vn', 'vi');
    const cn = getDayAlmanac(NOW, 'cn', 'en');
    const snap = {
      vn: { lunar: `${vn.lunar.year}/${vn.lunar.month}/${vn.lunar.day}`, day: vn.dayGanzhi.han, huangdao: vn.huangdao, zhixing: vn.zhixing.code, xiu: vn.xiu.code, yi: vn.yi.map((x) => x.code), ji: vn.ji.map((x) => x.code), goodHours: vn.hours.filter((x) => x.auspicious).map((x) => x.ganzhi.han) },
      cnLunar: `${cn.lunar.year}/${cn.lunar.month}/${cn.lunar.day}`,
      personalOx: personalizeAlmanac(vn, { yearBranch: 1, usefulElements: [1] }).personal,
      pick: pickDates({ task: 'wedding', from: '2026-10-01', to: '2026-10-31', profiles: [{ yearBranch: 1 }], standard: 'vn', limit: 5 }).map((d) => `${d.date}:${d.score}`),
      tarotCommon: dailyCard(NOW, 'w:common').cards.map((c) => `${c.card.id}${c.reversed ? 'r' : ''}`),
      tarotThree: drawCards({ spread: 'three', seed: `${NOW}:demo` }).cards.map((c) => `${c.position}:${c.card.id}${c.reversed ? 'r' : ''}`),
      iching: (() => {
        const c = castHexagram({ method: 'coins', seed: `${NOW}:demo` });
        return { lines: c.lines, primary: c.primary.number, changing: c.changingLines, relating: c.relating?.number ?? null };
      })(),
      sky: (() => {
        const s = dailySky(new Date(`${NOW}T05:00:00Z`));
        return { sun: s.sun.sign, moon: s.moon.sign, phase: s.moon.phase.name, retro: s.retrogrades };
      })(),
    };
    expect(snap).toMatchSnapshot();
  });
});
