/**
 * Engine orchestration: everything here is pure (no I/O) and deterministic given `now`.
 *  - computeCore()      → profiles.core_json (facts + 3 LLM-free insights)
 *  - runReadingEngine() → ReadingEngineOutput for POST /readings
 *  - per-route helpers for /profiles/:id/{ziwei,bazi,numerology,astro}
 */
import {
  ELEMENTS_EN,
  ELEMENTS_VI,
  ganzhiLabel,
  type BirthInput,
  type Locale,
  type ReadingEngineOutput,
  type TraditionPack,
} from '@findme/engine-core';
import { resolveBirthMoment } from '@findme/engine-calendar';
import { computeBazi, toEngineOutput as baziOutput, type BaziChart } from '@findme/engine-bazi';
import { computeZiwei, computeZiweiHoroscope, toEngineOutput as ziweiOutput, type ZiweiChart, type ZiweiSchool } from '@findme/engine-ziwei';
import { computeNumerologyFromBirth, compatibility as numerologyCompatibility, toEngineOutput as numerologyOutput, type NumerologyResult } from '@findme/engine-numerology';
import { computeNatalChart, moonSign, risingSign, sunSign, toEngineOutput as astroOutput, type HouseSystem, type NatalChart } from '@findme/engine-astro';
import { getDayAlmanac, personalizeAlmanac, pickDates, TASK_YI, type ProfileCore, type TaskKey } from '@findme/engine-almanac';
import type { CoreEastAsia, CoreInsight, CoreJson, CoreWestern } from './core-types.js';
import { badRequest, notImplemented } from '../lib/errors.js';

/** What we decrypt from profiles.birth_enc */
export interface StoredBirth extends BirthInput {
  fullName?: string;
}

export interface CoreOptions {
  traditionPack: TraditionPack;
  locale: Locale;
  /** YYYY-MM-DD in the user's zone, drives numerology personal day */
  today: string;
  fullName?: string;
  ziweiSchool?: ZiweiSchool;
}

const vi = (locale: Locale) => locale === 'vi';
const elementLabel = (e: number, locale: Locale) => (vi(locale) ? ELEMENTS_VI[e] : ELEMENTS_EN[e]) ?? String(e);

// ---------------------------------------------------------------------------------------------
// core_json
// ---------------------------------------------------------------------------------------------

export function computeCore(birth: BirthInput, opts: CoreOptions): CoreJson {
  const warnings: CoreJson['warnings'] = [];
  const core: CoreJson = {
    version: 1,
    computedAt: new Date().toISOString(),
    locale: opts.locale,
    traditionPack: opts.traditionPack,
    calendarStandard: birth.calendarStandard,
    timeKnown: !birth.timeUnknown,
    insights: [],
    warnings,
  };
  const wantEast = opts.traditionPack === 'eastAsia' || opts.traditionPack === 'both';
  const wantWest = opts.traditionPack === 'western' || opts.traditionPack === 'both';

  if (wantEast) {
    const bazi = computeBazi(birth, { locale: opts.locale, now: opts.today, annualWindow: 1 });
    const ziwei = computeZiwei(birth, { locale: opts.locale, school: opts.ziweiSchool ?? 'default' });
    core.eastAsia = eastAsiaSummary(bazi, ziwei, opts.locale);
    for (const w of [...bazi.warnings, ...ziwei.warnings]) if (!warnings.some((x) => x.code === w.code)) warnings.push(w);
  }
  if (wantWest) {
    const num = computeNumerologyFromBirth(birth, { fullName: opts.fullName, refDate: opts.today, nameOrder: vi(opts.locale) ? 'family-first' : 'given-first' });
    const moment = resolveBirthMoment(birth);
    const timeKnown = !birth.timeUnknown;
    core.western = {
      numerology: {
        lifePath: num.lifePath.value,
        lifePathMaster: num.lifePath.isMaster,
        birthday: num.birthday.value,
        expression: num.expression?.value ?? null,
        soulUrge: num.soulUrge?.value ?? null,
        personalDay: { date: opts.today, value: num.personalDay.value },
        personalYear: num.personalYear.value,
        nameSupported: num.nameSupported,
      },
      astro: {
        sun: sunSign(moment.utc),
        moon: moonSign(moment.utc),
        rising: timeKnown ? risingSign(moment.utc, birth.place.lat, birth.place.lng) : null,
        timeKnown,
        moonApproximate: !timeKnown,
      },
    };
    for (const w of [...num.warnings, ...moment.warnings]) if (!warnings.some((x) => x.code === w.code)) warnings.push(w);
  }
  core.insights = buildInsights(core, opts.locale);
  return core;
}

function eastAsiaSummary(bazi: BaziChart, ziwei: ZiweiChart, locale: Locale): CoreEastAsia {
  const lunar = bazi.resolved.lunar;
  return {
    pillars: bazi.pillars.map((p) => ({ key: p.key, han: p.ganzhi.han, label: `${p.stemLabel} ${p.branchLabel}`, stem: p.ganzhi.stem, branch: p.ganzhi.branch })),
    lunar: {
      year: lunar.year,
      month: lunar.month,
      day: lunar.day,
      isLeapMonth: lunar.isLeapMonth,
      standard: lunar.standard,
      yearGanzhi: { han: lunar.yearGanzhi.han, label: ganzhiLabel(lunar.yearGanzhi, locale), index: lunar.yearGanzhi.index },
    },
    yearBranch: lunar.yearGanzhi.branch,
    yearStem: lunar.yearGanzhi.stem,
    bazi: {
      dayMaster: bazi.dayMaster,
      strength: { verdict: bazi.strength.verdict, score: bazi.strength.score },
      useful: bazi.favorable.useful,
      unfavorable: bazi.favorable.unfavorable,
      confidence: bazi.confidence,
    },
    ziwei: {
      school: ziwei.school,
      soul: ziwei.soul,
      body: ziwei.body,
      fiveElementsClass: ziwei.fiveElementsClass,
      soulPalaceBranch: { ...ziwei.soulPalaceBranch, index: ziwei.palaces.find((p) => p.key === 'soulPalace')?.branch.index ?? -1 },
      patterns: ziwei.patterns.map((p) => p.key),
      warnings: ziwei.warnings.map((w) => w.code),
      confidence: ziwei.confidence,
    },
  };
}

const SIGN_LABELS: Record<string, { en: string; vi: string }> = {
  aries: { en: 'Aries', vi: 'Bạch Dương' },
  taurus: { en: 'Taurus', vi: 'Kim Ngưu' },
  gemini: { en: 'Gemini', vi: 'Song Tử' },
  cancer: { en: 'Cancer', vi: 'Cự Giải' },
  leo: { en: 'Leo', vi: 'Sư Tử' },
  virgo: { en: 'Virgo', vi: 'Xử Nữ' },
  libra: { en: 'Libra', vi: 'Thiên Bình' },
  scorpio: { en: 'Scorpio', vi: 'Bọ Cạp' },
  sagittarius: { en: 'Sagittarius', vi: 'Nhân Mã' },
  capricorn: { en: 'Capricorn', vi: 'Ma Kết' },
  aquarius: { en: 'Aquarius', vi: 'Bảo Bình' },
  pisces: { en: 'Pisces', vi: 'Song Ngư' },
};
const signLabel = (k: string, locale: Locale) => (vi(locale) ? SIGN_LABELS[k]?.vi : SIGN_LABELS[k]?.en) ?? k;
const VERDICT: Record<string, { en: string; vi: string }> = {
  strong: { en: 'strong', vi: 'vượng' },
  weak: { en: 'weak', vi: 'nhược' },
  balanced: { en: 'balanced', vi: 'trung hòa' },
};

/**
 * Exactly 3 facts, derived without an LLM, keyed by content_atoms so the composer can
 * attach copy later. Priority depends on the tradition pack.
 */
export function buildInsights(core: CoreJson, locale: Locale): CoreInsight[] {
  const out: CoreInsight[] = [];
  const ea = core.eastAsia;
  const w = core.western;
  const v = vi(locale);
  const candidates: Array<() => CoreInsight | null> = [];

  const soulStar = () =>
    ea ? { key: `ziwei.soulstar.${ea.ziwei.soul.key}`, title: v ? `Mệnh: ${ea.ziwei.soul.name}` : `Soul star: ${ea.ziwei.soul.name}`, body: v ? `Cung Mệnh tại ${ea.ziwei.soulPalaceBranch.name}, ${ea.ziwei.fiveElementsClass.name}` : `Soul palace in ${ea.ziwei.soulPalaceBranch.name}, ${ea.ziwei.fiveElementsClass.name}` } : null;
  const dayMaster = () =>
    ea
      ? {
          key: `bazi.daymaster.${ea.bazi.dayMaster.stem}.${ea.bazi.strength.verdict}`,
          title: v ? `Nhật chủ ${ea.bazi.dayMaster.label} (${ea.bazi.dayMaster.elementLabel}) – ${VERDICT[ea.bazi.strength.verdict]?.vi}` : `Day master ${ea.bazi.dayMaster.label} (${ea.bazi.dayMaster.elementLabel}) – ${VERDICT[ea.bazi.strength.verdict]?.en}`,
          body: v ? `Dụng thần: ${ea.bazi.useful.map((e) => elementLabel(e, locale)).join(', ')}` : `Useful elements: ${ea.bazi.useful.map((e) => elementLabel(e, locale)).join(', ')}`,
        }
      : null;
  const fiveClass = () => (ea ? { key: `ziwei.fiveclass.${ea.ziwei.fiveElementsClass.key}`, title: v ? `Cục: ${ea.ziwei.fiveElementsClass.name}` : `Five-element class: ${ea.ziwei.fiveElementsClass.name}` } : null);
  const pattern = () => (ea && ea.ziwei.patterns[0] ? { key: `ziwei.pattern.${ea.ziwei.patterns[0]}`, title: v ? `Cách cục: ${ea.ziwei.patterns[0]}` : `Pattern: ${ea.ziwei.patterns[0]}` } : null);
  const lifePath = () => (w ? { key: `numerology.lifepath.${w.numerology.lifePath}`, title: v ? `Số chủ đạo ${w.numerology.lifePath}` : `Life Path ${w.numerology.lifePath}`, body: w.numerology.lifePathMaster ? (v ? 'Số bậc thầy' : 'Master number') : undefined } : null);
  const sun = () => (w ? { key: `astro.sun.${w.astro.sun}`, title: v ? `Mặt Trời ở ${signLabel(w.astro.sun, locale)}` : `Sun in ${signLabel(w.astro.sun, locale)}` } : null);
  const rising = () => (w && w.astro.rising ? { key: `astro.rising.${w.astro.rising}`, title: v ? `Cung Mọc ${signLabel(w.astro.rising, locale)}` : `Rising ${signLabel(w.astro.rising, locale)}` } : null);
  const moon = () => (w ? { key: `astro.moon.${w.astro.moon}`, title: v ? `Mặt Trăng ở ${signLabel(w.astro.moon, locale)}` : `Moon in ${signLabel(w.astro.moon, locale)}`, body: w.astro.moonApproximate ? (v ? 'Gần đúng (chưa rõ giờ sinh)' : 'Approximate (birth time unknown)') : undefined } : null);
  const expression = () => (w && w.numerology.expression ? { key: `numerology.expression.${w.numerology.expression}`, title: v ? `Số sứ mệnh ${w.numerology.expression}` : `Expression ${w.numerology.expression}` } : null);

  switch (core.traditionPack) {
    case 'eastAsia':
      candidates.push(soulStar, dayMaster, pattern, fiveClass);
      break;
    case 'western':
      candidates.push(lifePath, sun, rising, moon, expression);
      break;
    default:
      candidates.push(soulStar, lifePath, sun, dayMaster, rising, moon);
  }
  for (const c of candidates) {
    const i = c();
    if (i && !out.some((x) => x.key === i.key)) out.push(i);
    if (out.length === 3) break;
  }
  return out.slice(0, 3);
}

/** ProfileCore for engine-almanac personalisation from a stored core_json. */
export function profileCoreOf(core: CoreJson): ProfileCore | null {
  if (!core.eastAsia) return null;
  return { yearBranch: core.eastAsia.yearBranch, yearStem: core.eastAsia.yearStem, usefulElements: core.eastAsia.bazi.useful, dayMasterElement: core.eastAsia.bazi.dayMaster.element };
}

// ---------------------------------------------------------------------------------------------
// per-route engines
// ---------------------------------------------------------------------------------------------

export function ziweiFor(birth: BirthInput, locale: Locale, school: ZiweiSchool, date: string) {
  const chart = computeZiwei(birth, { locale, school });
  const horoscope = computeZiweiHoroscope(birth, date, { locale, school });
  return { chart, horoscope, atomKeys: ziweiOutput(chart, horoscope).atomKeys };
}

export function baziFor(birth: BirthInput, locale: Locale, today: string): ReadingEngineOutput<BaziChart> {
  return baziOutput(computeBazi(birth, { locale, now: today }));
}

export function numerologyFor(birth: StoredBirth, locale: Locale, today: string): ReadingEngineOutput<NumerologyResult> {
  return numerologyOutput(computeNumerologyFromBirth(birth, { fullName: birth.fullName, refDate: today, nameOrder: vi(locale) ? 'family-first' : 'given-first' }));
}

export function astroFor(birth: BirthInput, houses: HouseSystem): ReadingEngineOutput<NatalChart> {
  const moment = resolveBirthMoment(birth);
  const chart = computeNatalChart({ utc: moment.utc, lat: birth.place.lat, lng: birth.place.lng, houseSystem: houses });
  if (birth.timeUnknown) chart.warnings.push({ code: 'TIME_UNKNOWN', message: 'Birth time unknown: houses, rising sign and Moon position are approximate (noon assumed).' });
  return astroOutput(chart, birth.timeUnknown ? 'low' : undefined);
}

// ---------------------------------------------------------------------------------------------
// readings
// ---------------------------------------------------------------------------------------------

export const DEEP_READING_KINDS = ['ziwei_full', 'bazi_luck', 'numerology_full', 'compatibility', 'almanac_pick', 'tarot_spread', 'iching'] as const;
export type DeepReadingKind = (typeof DEEP_READING_KINDS)[number];

export interface ReadingContext {
  kind: DeepReadingKind;
  locale: Locale;
  today: string;
  birth: StoredBirth;
  profileCore: CoreJson;
  partner?: { birth: StoredBirth; core: CoreJson };
  params: Record<string, unknown>;
}

const SIX_HARMONY: Array<[number, number]> = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
const SIX_CLASH = (a: number, b: number) => (a + 6) % 12 === b;
const TRINE = (a: number, b: number) => a !== b && (a - b + 12) % 4 === 0;

export function runReadingEngine(ctx: ReadingContext): ReadingEngineOutput<Record<string, unknown>> {
  switch (ctx.kind) {
    case 'ziwei_full': {
      const school = (typeof ctx.params.school === 'string' ? ctx.params.school : 'default') as ZiweiSchool;
      const date = typeof ctx.params.date === 'string' ? ctx.params.date : ctx.today;
      const chart = computeZiwei(ctx.birth, { locale: ctx.locale, school });
      const horoscope = computeZiweiHoroscope(ctx.birth, date, { locale: ctx.locale, school });
      return ziweiOutput(chart, horoscope) as ReadingEngineOutput<Record<string, unknown>>;
    }
    case 'bazi_luck':
      return baziFor(ctx.birth, ctx.locale, ctx.today) as unknown as ReadingEngineOutput<Record<string, unknown>>;
    case 'numerology_full':
      return numerologyFor(ctx.birth, ctx.locale, ctx.today) as unknown as ReadingEngineOutput<Record<string, unknown>>;
    case 'compatibility': {
      if (!ctx.partner) throw badRequest('partner_required', 'compatibility needs partnerProfileId');
      const a = computeNumerologyFromBirth(ctx.birth, { fullName: ctx.birth.fullName, refDate: ctx.today });
      const b = computeNumerologyFromBirth(ctx.partner.birth, { fullName: ctx.partner.birth.fullName, refDate: ctx.today });
      const num = numerologyCompatibility(a, b);
      const atomKeys = [`numerology.compat.${Math.min(a.lifePath.value, b.lifePath.value)}.${Math.max(a.lifePath.value, b.lifePath.value)}`, ...num.reasons.map((r) => `numerology.compat.reason.${r.key}`)];
      const facts: Record<string, unknown> = { numerology: { score: num.score, reasons: num.reasons, lifePaths: [a.lifePath.value, b.lifePath.value] } };
      const ea = ctx.profileCore.eastAsia;
      const eb = ctx.partner.core.eastAsia;
      if (ea && eb) {
        const relation = SIX_CLASH(ea.yearBranch, eb.yearBranch) ? 'clash' : SIX_HARMONY.some(([x, y]) => (x === ea.yearBranch && y === eb.yearBranch) || (y === ea.yearBranch && x === eb.yearBranch)) ? 'six_harmony' : TRINE(ea.yearBranch, eb.yearBranch) ? 'trine' : ea.yearBranch === eb.yearBranch ? 'same' : 'neutral';
        const dayMasters = [ea.bazi.dayMaster.element, eb.bazi.dayMaster.element] as const;
        const dmRelation = dayMasters[0] === dayMasters[1] ? 'same' : (dayMasters[0] + 1) % 5 === dayMasters[1] ? 'a_generates_b' : (dayMasters[1] + 1) % 5 === dayMasters[0] ? 'b_generates_a' : (dayMasters[0] + 2) % 5 === dayMasters[1] ? 'a_controls_b' : 'b_controls_a';
        facts.eastAsia = { yearBranches: [ea.yearBranch, eb.yearBranch], branchRelation: relation, dayMasterElements: dayMasters, dayMasterRelation: dmRelation };
        atomKeys.push(`bazi.branch.relation.${relation}`, `bazi.daymaster.relation.${dmRelation}`);
      }
      return { engine: 'compatibility', engineVersion: '1.0.0', facts, atomKeys, confidence: ea && eb ? 'medium' : 'low', warnings: [] };
    }
    case 'almanac_pick': {
      const task = ctx.params.task as TaskKey;
      if (!task || !(task in TASK_YI)) throw badRequest('invalid_task', `task must be one of ${Object.keys(TASK_YI).join(', ')}`);
      const from = typeof ctx.params.from === 'string' ? ctx.params.from : ctx.today;
      const to = typeof ctx.params.to === 'string' ? ctx.params.to : from;
      const pc = [profileCoreOf(ctx.profileCore), ctx.partner ? profileCoreOf(ctx.partner.core) : null].filter((p): p is ProfileCore => !!p);
      const ranked = pickDates({ task, from, to, profiles: pc, standard: ctx.birth.calendarStandard, locale: ctx.locale, limit: typeof ctx.params.limit === 'number' ? ctx.params.limit : 10 });
      const best = ranked[0];
      return {
        engine: 'almanac',
        engineVersion: '1.0.0',
        facts: { task, from, to, ranked: ranked.map((r) => ({ date: r.date, score: r.score, reasons: r.reasons, lunar: r.almanac.lunar, dayGanzhi: r.almanac.dayGanzhi, huangdao: r.almanac.huangdao, yi: r.almanac.yi, ji: r.almanac.ji })) },
        atomKeys: best ? [`almanac.task.${task}`, ...best.reasons.map((r) => `almanac.reason.${r.key}`)] : [`almanac.task.${task}`],
        confidence: 'high',
        warnings: [],
      };
    }
    case 'tarot_spread':
      // TODO(P6→P7): wire @findme/engine-tarot once it lands (seeded RNG, spreads).
      throw notImplemented('tarot_spread');
    case 'iching':
      // TODO(P6→P7): wire @findme/engine-iching once it lands (coin/yarrow casts, 64 hexagrams).
      throw notImplemented('iching');
  }
}

/** Almanac for a day, optionally personalised for a profile. Pure; cached by the route. */
export function almanacFor(date: string, std: BirthInput['calendarStandard'], locale: Locale, core?: CoreJson | null) {
  const day = getDayAlmanac(date, std, locale);
  const pc = core ? profileCoreOf(core) : null;
  return pc ? personalizeAlmanac(day, pc) : day;
}

/**
 * Strip fields that would leak the raw birth instant into `readings.engine_json`
 * (the encrypted profile is the only place it may live).
 */
export function redactBirth<T>(value: T): T {
  const DROP = new Set(['birthDate', 'solarDate', 'utc']);
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if (DROP.has(k) && (typeof val === 'string' || val instanceof Date)) continue;
        out[k] = walk(val);
      }
      return out;
    }
    return v;
  };
  return walk(value) as T;
}
