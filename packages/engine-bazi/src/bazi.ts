import {
  BRANCH_ELEMENT,
  STEM_ELEMENT,
  ganzhiFromIndex,
  ganzhiOfYear,
  type BirthInput,
  type Confidence,
  type EngineWarning,
  type GanZhi,
  type Locale,
  type ReadingEngineOutput,
} from '@findme/engine-core';
import { resolveBirth, solarTermsOfYear, type PillarOptions, type ResolvedBirth } from '@findme/engine-calendar';
import {
  BRANCH_TERMS,
  CHANGSHENG_START,
  ELEMENT_TERMS,
  HIDDEN_STEMS,
  NAYIN_TERMS,
  STAGE_TERMS,
  STEM_TERMS,
  TEN_GOD_KEYS,
  TEN_GOD_TERMS,
  label,
  type TenGodKey,
} from './terms.js';

export type Element = 0 | 1 | 2 | 3 | 4; // wood fire earth metal water

export interface PillarView {
  key: 'year' | 'month' | 'day' | 'hour';
  ganzhi: GanZhi;
  stemLabel: string;
  branchLabel: string;
  stemElement: Element;
  branchElement: Element;
  /** Ten God of the stem relative to day master (null for the day stem itself) */
  tenGod: TenGodKey | null;
  tenGodLabel: string | null;
  hiddenStems: Array<{ stem: number; label: string; tenGod: TenGodKey; tenGodLabel: string }>;
  nayin: { han: string; label: string };
  /** 十二長生 stage of the day master on this branch */
  stage: { index: number; han: string; label: string };
}

export interface LuckPeriod {
  index: number;
  ganzhi: GanZhi;
  label: string;
  startAge: number;
  startYear: number;
  endYear: number;
  tenGodStem: TenGodKey;
}

export interface AnnualLuck {
  year: number;
  age: number;
  ganzhi: GanZhi;
  label: string;
  tenGodStem: TenGodKey;
  luckPeriodIndex: number | null;
}

export interface BaziChart {
  locale: Locale;
  gender: BirthInput['gender'];
  pillars: PillarView[];
  dayMaster: { stem: number; label: string; element: Element; elementLabel: string; yin: boolean };
  elementCounts: Record<Element, number>;
  elementScores: Record<Element, number>;
  strength: { verdict: 'strong' | 'weak' | 'balanced'; score: number; method: string };
  favorable: { useful: Element[]; unfavorable: Element[]; rationale: string };
  luck: { direction: 'forward' | 'backward'; startAgeYears: number; startAgeMonths: number; startYear: number; periods: LuckPeriod[] };
  annual: AnnualLuck[];
  taiYuan: GanZhi;
  mingGong: GanZhi;
  /** underlying resolution (lunar date per standard, moment) */
  resolved: Pick<ResolvedBirth, 'lunar' | 'pillars'> & { moment: Pick<ResolvedBirth['moment'], 'zone' | 'solarCorrectionMinutes' | 'dstApplied' | 'timeUnknown'> };
  confidence: Confidence;
  warnings: EngineWarning[];
}

export interface BaziOptions extends PillarOptions {
  locale?: Locale;
  /** How many annual luck years around now to include (default ±5) */
  annualWindow?: number;
  /** Reference date for "now" (ISO), default today */
  now?: string;
}

const yinOf = (stem: number) => stem % 2 === 1;
const generates = (a: Element, b: Element) => (a + 1) % 5 === b; // wood→fire→earth→metal→water→wood
const controls = (a: Element, b: Element) => (a + 2) % 5 === b; // wood→earth, fire→metal, earth→water, metal→wood, water→fire

/** Ten God of `stem` relative to `dayStem`. */
export function tenGod(dayStem: number, stem: number): TenGodKey {
  const de = STEM_ELEMENT[dayStem] as Element;
  const se = STEM_ELEMENT[stem] as Element;
  const samePolarity = yinOf(dayStem) === yinOf(stem);
  if (de === se) return samePolarity ? 'bijian' : 'jiecai';
  if (generates(de, se)) return samePolarity ? 'shishen' : 'shangguan';
  if (controls(de, se)) return samePolarity ? 'piancai' : 'zhengcai';
  if (controls(se, de)) return samePolarity ? 'qisha' : 'zhengguan';
  return samePolarity ? 'pianyin' : 'zhengyin';
}

/** 十二長生 stage index of a stem on a branch */
export function stageOf(stem: number, branch: number): number {
  const start = CHANGSHENG_START[stem] as number;
  return yinOf(stem) ? ((start - branch) % 12 + 12) % 12 : ((branch - start) % 12 + 12) % 12;
}

function nayinOf(gz: GanZhi) {
  const t = NAYIN_TERMS[Math.floor(gz.index / 2)]!;
  return t;
}

function pillarView(key: PillarView['key'], gz: GanZhi, dayStem: number, locale: Locale): PillarView {
  const tg = key === 'day' ? null : tenGod(dayStem, gz.stem);
  const stage = stageOf(dayStem, gz.branch);
  return {
    key,
    ganzhi: gz,
    stemLabel: label(STEM_TERMS[gz.stem]!, locale),
    branchLabel: label(BRANCH_TERMS[gz.branch]!, locale),
    stemElement: STEM_ELEMENT[gz.stem] as Element,
    branchElement: BRANCH_ELEMENT[gz.branch] as Element,
    tenGod: tg,
    tenGodLabel: tg ? label(TEN_GOD_TERMS[tg], locale) : null,
    hiddenStems: (HIDDEN_STEMS[gz.branch] ?? []).map((s) => ({ stem: s, label: label(STEM_TERMS[s]!, locale), tenGod: tenGod(dayStem, s), tenGodLabel: label(TEN_GOD_TERMS[tenGod(dayStem, s)], locale) })),
    nayin: { han: nayinOf(gz).han, label: label(nayinOf(gz), locale) },
    stage: { index: stage, han: STAGE_TERMS[stage]!.han, label: label(STAGE_TERMS[stage]!, locale) },
  };
}

/**
 * Element scoring (simplified 子平 method, documented): stems 1.0 each; hidden stems weighted
 * 1.0 / 0.5 / 0.3 (main/middle/residual); month branch main qi ×2 (月令). Strength verdict compares
 * the day master's "support" (same element + resource) against the rest.
 */
function scoreElements(pillars: GanZhi[], hourKnown: boolean) {
  const scores: Record<Element, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  const counts: Record<Element, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  const weights = [1, 0.5, 0.3];
  pillars.forEach((gz, i) => {
    if (i === 3 && !hourKnown) return;
    scores[STEM_ELEMENT[gz.stem] as Element] += 1;
    counts[STEM_ELEMENT[gz.stem] as Element] += 1;
    counts[BRANCH_ELEMENT[gz.branch] as Element] += 1;
    (HIDDEN_STEMS[gz.branch] ?? []).forEach((s, j) => {
      const w = (weights[j] ?? 0.3) * (i === 1 && j === 0 ? 2 : 1);
      scores[STEM_ELEMENT[s] as Element] += w;
    });
  });
  return { scores, counts };
}

function strengthVerdict(dayElement: Element, scores: Record<Element, number>) {
  const resource = ((dayElement + 4) % 5) as Element; // element that generates day master
  const support = scores[dayElement] + scores[resource];
  const total = (Object.values(scores) as number[]).reduce((a, b) => a + b, 0);
  const ratio = total ? support / total : 0.5;
  const verdict: 'strong' | 'weak' | 'balanced' = ratio >= 0.55 ? 'strong' : ratio <= 0.4 ? 'weak' : 'balanced';
  return { verdict, score: Math.round(ratio * 100) / 100, method: 'support ratio = (self + resource) / all; stems 1.0, hidden stems 1/0.5/0.3, month main qi ×2' };
}

function favorableElements(dayElement: Element, verdict: 'strong' | 'weak' | 'balanced') {
  const output = ((dayElement + 1) % 5) as Element;
  const wealth = ((dayElement + 2) % 5) as Element;
  const officer = ((dayElement + 3) % 5) as Element;
  const resource = ((dayElement + 4) % 5) as Element;
  if (verdict === 'strong') return { useful: [output, wealth, officer], unfavorable: [dayElement, resource], rationale: 'Strong day master: drain (output), spend (wealth) or discipline (officer).' };
  if (verdict === 'weak') return { useful: [resource, dayElement], unfavorable: [officer, wealth], rationale: 'Weak day master: nourish with resource and companions.' };
  return { useful: [output, resource], unfavorable: [], rationale: 'Balanced: keep flow; mild output and resource both help.' };
}

/** Luck period start: distance to next/previous Jie in days ÷ 3 → years (1 day ≈ 4 months). */
function luckStart(rb: ResolvedBirth, forward: boolean) {
  const utc = rb.moment.utc.getTime();
  const y = rb.moment.utc.getUTCFullYear();
  const jies = [...solarTermsOfYear(y - 1), ...solarTermsOfYear(y), ...solarTermsOfYear(y + 1)].filter((t) => t.isJie).map((t) => t.utc.getTime());
  const target = forward ? jies.find((t) => t > utc)! : [...jies].reverse().find((t) => t <= utc)!;
  const days = Math.abs(target - utc) / 86400000;
  const totalMonths = Math.round(days * 4); // 3 days = 1 year = 12 months
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
}

export function computeBazi(input: BirthInput, opts: BaziOptions = {}): BaziChart {
  const locale = opts.locale ?? 'en';
  const rb = resolveBirth(input, { pillars: { clock: opts.clock, dayBoundary: opts.dayBoundary } });
  const warnings: EngineWarning[] = [...rb.moment.warnings, ...rb.lunar.warnings];
  const p = rb.pillars;
  const hourKnown = p.hour !== null;
  const dayStem = p.day.stem;
  const dayElement = STEM_ELEMENT[dayStem] as Element;

  const gzList: GanZhi[] = [p.year, p.month, p.day, p.hour ?? p.day];
  const pillars: PillarView[] = [
    pillarView('year', p.year, dayStem, locale),
    pillarView('month', p.month, dayStem, locale),
    pillarView('day', p.day, dayStem, locale),
  ];
  if (p.hour) pillars.push(pillarView('hour', p.hour, dayStem, locale));

  const { scores, counts } = scoreElements(gzList, hourKnown);
  const strength = strengthVerdict(dayElement, scores);
  const favorable = favorableElements(dayElement, strength.verdict);

  // Luck direction: yang year + male, or yin year + female → forward
  const yangYear = p.year.stem % 2 === 0;
  const male = input.gender === 'male';
  const forward = (yangYear && male) || (!yangYear && !male);
  const start = luckStart(rb, forward);
  const birthYear = rb.moment.local.year;
  const startYear = birthYear + start.years + (start.months >= 6 ? 1 : 0);
  const periods: LuckPeriod[] = [];
  for (let i = 0; i < 10; i++) {
    const gz = ganzhiFromIndex(p.month.index + (forward ? i + 1 : -(i + 1)));
    const sy = startYear + i * 10;
    periods.push({ index: i, ganzhi: gz, label: `${label(STEM_TERMS[gz.stem]!, locale)} ${label(BRANCH_TERMS[gz.branch]!, locale)}`, startAge: start.years + i * 10, startYear: sy, endYear: sy + 9, tenGodStem: tenGod(dayStem, gz.stem) });
  }

  const nowYear = opts.now ? Number(opts.now.slice(0, 4)) : new Date().getUTCFullYear();
  const window = opts.annualWindow ?? 5;
  const annual: AnnualLuck[] = [];
  for (let y = nowYear - window; y <= nowYear + window; y++) {
    const gz = ganzhiOfYear(y);
    const period = periods.find((lp) => y >= lp.startYear && y <= lp.endYear);
    annual.push({ year: y, age: y - birthYear + 1, ganzhi: gz, label: `${label(STEM_TERMS[gz.stem]!, locale)} ${label(BRANCH_TERMS[gz.branch]!, locale)}`, tenGodStem: tenGod(dayStem, gz.stem), luckPeriodIndex: period ? period.index : null });
  }

  // 胎元: month stem +1, month branch +3 ; 命宮 simplified: from month branch & hour branch (寅 counting)
  const taiYuan = ganzhiFromIndexSafe((p.month.stem + 1) % 10, (p.month.branch + 3) % 12);
  const hb = p.hourBranch ?? 6;
  const mingBranch = ((2 - ((p.month.branch - 2 + 12) % 12) - ((hb - 2 + 12) % 12)) % 12 + 24) % 12;
  const mingStemIdx = ((p.year.stem % 5) * 2 + 2 + ((mingBranch - 2 + 12) % 12)) % 10;
  const mingGong = ganzhiFromIndexSafe(mingStemIdx, mingBranch);

  if (!hourKnown) warnings.push({ code: 'HOUR_PILLAR_MISSING', message: 'Birth time unknown: hour pillar omitted; strength and 命宮 approximate.' });

  return {
    locale,
    gender: input.gender,
    pillars,
    dayMaster: { stem: dayStem, label: label(STEM_TERMS[dayStem]!, locale), element: dayElement, elementLabel: label(ELEMENT_TERMS[dayElement]!, locale), yin: yinOf(dayStem) },
    elementCounts: counts,
    elementScores: Object.fromEntries((Object.entries(scores) as Array<[string, number]>).map(([k, v]) => [k, Math.round(v * 100) / 100])) as Record<Element, number>,
    strength,
    favorable,
    luck: { direction: forward ? 'forward' : 'backward', startAgeYears: start.years, startAgeMonths: start.months, startYear, periods },
    annual,
    taiYuan,
    mingGong,
    resolved: { lunar: rb.lunar, pillars: rb.pillars, moment: { zone: rb.moment.zone, solarCorrectionMinutes: rb.moment.solarCorrectionMinutes, dstApplied: rb.moment.dstApplied, timeUnknown: rb.moment.timeUnknown } },
    confidence: hourKnown ? (rb.moment.warnings.some((w) => w.code === 'TZ_ESTIMATED') ? 'medium' : 'high') : 'medium',
    warnings,
  };
}

function ganzhiFromIndexSafe(stem: number, branch: number): GanZhi {
  // stem/branch parity may mismatch for derived palaces in simplified formulas; snap to nearest valid pair
  for (let i = 0; i < 60; i++) if (i % 10 === stem && i % 12 === branch) return ganzhiFromIndex(i);
  return ganzhiFromIndex(branch % 2 === stem % 2 ? stem : (stem + 1) % 10 === branch % 2 ? stem + 1 : stem + 1);
}

export function atomKeysForBazi(c: BaziChart): string[] {
  const keys = new Set<string>();
  const dm = STEM_TERMS[c.dayMaster.stem]!.han;
  keys.add(`bazi.daymaster.${c.dayMaster.stem}.${c.strength.verdict}`);
  keys.add(`bazi.daymaster.${c.dayMaster.stem}`);
  for (const p of c.pillars) {
    if (p.tenGod) keys.add(`bazi.shishen.${p.tenGod}.${p.key}`);
    keys.add(`bazi.nayin.${Math.floor(p.ganzhi.index / 2)}`);
  }
  const month = c.pillars.find((p) => p.key === 'month');
  if (month) keys.add(`bazi.monthqi.${month.hiddenStems[0]?.tenGod ?? 'na'}`);
  for (const e of c.favorable.useful) keys.add(`bazi.useful.${e}`);
  const cur = c.annual.find((a) => a.luckPeriodIndex !== null && a.year === new Date().getUTCFullYear());
  if (cur && cur.luckPeriodIndex !== null) keys.add(`bazi.dayun.${c.luck.periods[cur.luckPeriodIndex]!.tenGodStem}`);
  keys.add(`bazi.element.dominant.${dominant(c.elementScores)}`);
  void dm;
  return [...keys];
}

function dominant(scores: Record<Element, number>): Element {
  let best: Element = 0;
  for (const k of [0, 1, 2, 3, 4] as Element[]) if (scores[k] > scores[best]) best = k;
  return best;
}

export function toEngineOutput(c: BaziChart): ReadingEngineOutput<BaziChart> {
  return { engine: 'bazi', engineVersion: '1.0.0', facts: c, atomKeys: atomKeysForBazi(c), confidence: c.confidence, warnings: c.warnings };
}

export { TEN_GOD_KEYS };
