import { Solar } from 'lunar-typescript';
import {
  BRANCHES_VI,
  BRANCH_ELEMENT,
  STEM_ELEMENT,
  ZODIAC_EN,
  ZODIAC_VI,
  ganzhiFromHan,
  type CalendarStandard,
  type GanZhi,
  type Locale,
  type LunarDate,
  type ReadingEngineOutput,
} from '@findme/engine-core';
import { civilToLunar, currentJie, currentSolarTerm, JIE_NAMES } from '@findme/engine-calendar';
import { DIRECTION_TERMS, ELEMENT_COLORS, XIU_TERMS, YIJI_TERMS, ZHIXING_TERMS, tl } from './terms.js';

export interface AlmanacItem {
  code: string;
  label: string;
}
export interface HourSlot {
  ganzhi: GanZhi;
  branch: number;
  label: string;
  from: string;
  to: string;
  auspicious: boolean;
}
export interface DayAlmanac {
  date: string;
  locale: Locale;
  standard: CalendarStandard;
  lunar: LunarDate & { yearGanzhi: GanZhi; approximation: boolean };
  dayGanzhi: GanZhi;
  /** month ganzhi by solar terms */
  monthGanzhi: GanZhi;
  /** 黄道 (true) / 黑道 (false) */
  huangdao: boolean;
  tianshen: AlmanacItem;
  zhixing: AlmanacItem & { good: boolean };
  xiu: AlmanacItem & { auspicious: boolean; animal: string };
  yi: AlmanacItem[];
  ji: AlmanacItem[];
  jishen: string[];
  xiongsha: string[];
  pengzu: { stem: string; branch: string };
  positions: { joy: AlmanacItem; wealth: AlmanacItem; blessing: AlmanacItem };
  clash: { branch: number; zodiacLabel: string; ganzhiHan: string; shaDirection: AlmanacItem };
  nineStar: { number: number; han: string; color: string; element: string };
  solarTerm: { current: string; next: string; nextDate: string };
  moonPhase: string;
  hours: HourSlot[];
  dayElement: number;
}

export interface ProfileCore {
  /** branch index of the person's birth year (lunar/solar-term depending on tradition) */
  yearBranch: number;
  yearStem?: number;
  /** elements the person's Bazi favours (0..4) */
  usefulElements?: number[];
  dayMasterElement?: number;
}

export interface PersonalizedAlmanac extends DayAlmanac {
  personal: {
    clashesWithUser: boolean;
    harmsUser: boolean;
    favorableElementDay: boolean | null;
    score: number;
    luckyNumbers: number[];
    luckyColor: { label: string; hex: string };
    reasons: string[];
  };
}

const HARM_PAIRS: Array<[number, number]> = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]]; // 六害

function zodiacLabel(branch: number, locale: Locale): string {
  return locale === 'vi' ? (ZODIAC_VI[branch] as string) : (ZODIAC_EN[branch] as string);
}

function parseDate(date: string): [number, number, number] {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) throw new Error(`bad date ${date}`);
  return [y, m, d];
}

function toLocalDate(utc: Date, offsetMinutes: number): string {
  const d = new Date(utc.getTime() + offsetMinutes * 60000);
  return d.toISOString().slice(0, 10);
}

const STD_OFFSET: Record<CalendarStandard, number> = { vn: 420, cn: 480, kr: 540, jp: 540 };

/** Daily almanac for a civil date under a national calendar standard. */
export function getDayAlmanac(date: string, standard: CalendarStandard, locale: Locale = 'en'): DayAlmanac {
  const [y, m, d] = parseDate(date);
  const lunar = civilToLunar(y, m, d, standard);
  const l = Solar.fromYmd(y, m, d).getLunar();
  const dayGanzhi = ganzhiFromHan(l.getDayInGanZhi());
  const noonUtc = new Date(Date.UTC(y, m - 1, d, 12) - STD_OFFSET[standard] * 60000);
  const jie = currentJie(noonUtc);
  const monthGanzhi = ganzhiFromHan(l.getMonthInGanZhiExact());
  const terms = currentSolarTerm(noonUtc);
  const zx = l.getZhiXing();
  const xiu = l.getXiu();
  const chongBranch = (dayGanzhi.branch + 6) % 12;
  const hours: HourSlot[] = l.getTimes().map((t) => {
    const gz = ganzhiFromHan(t.getGanZhi());
    return { ganzhi: gz, branch: gz.branch, label: locale === 'vi' ? (BRANCHES_VI[gz.branch] as string) : gz.han, from: t.getMinHm(), to: t.getMaxHm(), auspicious: t.getTianShenLuck() === '吉' };
  });
  const ns = l.getDayNineStar();
  return {
    date,
    locale,
    standard,
    lunar: { year: lunar.year, month: lunar.month, isLeapMonth: lunar.isLeapMonth, day: lunar.day, hourBranch: null, standard, yearGanzhi: lunar.yearGanzhi, approximation: lunar.approximation },
    dayGanzhi,
    monthGanzhi,
    huangdao: l.getDayTianShenType() === '黄道',
    tianshen: { code: l.getDayTianShen(), label: l.getDayTianShen() },
    zhixing: { code: zx, label: tl(ZHIXING_TERMS, zx, locale), good: ZHIXING_TERMS[zx]?.good ?? false },
    xiu: { code: xiu, label: tl(XIU_TERMS, xiu, locale), auspicious: l.getXiuLuck() === '吉', animal: l.getAnimal() },
    yi: l.getDayYi().map((c) => ({ code: c, label: tl(YIJI_TERMS, c, locale) })),
    ji: l.getDayJi().map((c) => ({ code: c, label: tl(YIJI_TERMS, c, locale) })),
    jishen: l.getDayJiShen(),
    xiongsha: l.getDayXiongSha(),
    pengzu: { stem: l.getPengZuGan(), branch: l.getPengZuZhi() },
    positions: {
      joy: { code: l.getDayPositionXiDesc(), label: tl(DIRECTION_TERMS, l.getDayPositionXiDesc(), locale) },
      wealth: { code: l.getDayPositionCaiDesc(), label: tl(DIRECTION_TERMS, l.getDayPositionCaiDesc(), locale) },
      blessing: { code: l.getDayPositionFuDesc(), label: tl(DIRECTION_TERMS, l.getDayPositionFuDesc(), locale) },
    },
    clash: { branch: chongBranch, zodiacLabel: zodiacLabel(chongBranch, locale), ganzhiHan: l.getDayChongDesc(), shaDirection: { code: l.getDaySha(), label: tl(DIRECTION_TERMS, l.getDaySha(), locale) } },
    nineStar: { number: Number(ns.getNumber()) || ['一', '二', '三', '四', '五', '六', '七', '八', '九'].indexOf(ns.getNumber()) + 1, han: ns.toString(), color: ns.getColor(), element: ns.getWuXing() },
    solarTerm: { current: terms.current.name, next: terms.next.name, nextDate: toLocalDate(terms.next.utc, STD_OFFSET[standard]) },
    moonPhase: l.getYueXiang(),
    hours,
    dayElement: STEM_ELEMENT[dayGanzhi.stem] as number,
  };
  void jie;
  void JIE_NAMES;
}

/** Overlay a person's profile onto a day. */
export function personalizeAlmanac(a: DayAlmanac, p: ProfileCore): PersonalizedAlmanac {
  const reasons: string[] = [];
  let score = 0;
  const clashes = (a.dayGanzhi.branch + 6) % 12 === p.yearBranch;
  const harms = HARM_PAIRS.some(([x, y]) => (x === a.dayGanzhi.branch && y === p.yearBranch) || (y === a.dayGanzhi.branch && x === p.yearBranch));
  if (clashes) {
    score -= 5;
    reasons.push('day_clashes_year');
  }
  if (harms) {
    score -= 2;
    reasons.push('day_harms_year');
  }
  if (a.huangdao) {
    score += 2;
    reasons.push('huangdao');
  } else reasons.push('heidao');
  if (a.zhixing.good) score += 1;
  if (a.xiu.auspicious) score += 1;
  let favorableElementDay: boolean | null = null;
  if (p.usefulElements && p.usefulElements.length) {
    favorableElementDay = p.usefulElements.includes(a.dayElement) || p.usefulElements.includes(BRANCH_ELEMENT[a.dayGanzhi.branch] as number);
    if (favorableElementDay) {
      score += 2;
      reasons.push('useful_element_day');
    }
  }
  const luckyElement = p.usefulElements?.[0] ?? a.dayElement;
  const color = ELEMENT_COLORS[luckyElement]!;
  const luckyNumbers = [((a.dayGanzhi.index + p.yearBranch) % 9) + 1, a.nineStar.number].filter((v, i, arr) => arr.indexOf(v) === i);
  return {
    ...a,
    personal: { clashesWithUser: clashes, harmsUser: harms, favorableElementDay, score, luckyNumbers, luckyColor: { label: a.locale === 'vi' ? color.vi : color.en, hex: color.hex }, reasons },
  };
}

export type TaskKey = 'wedding' | 'opening' | 'moving' | 'contract' | 'travel' | 'groundbreaking' | 'haircut' | 'pray' | 'burial' | 'study';
export const TASK_YI: Record<TaskKey, string[]> = {
  wedding: ['嫁娶', '纳采', '订盟', '订婚'],
  opening: ['开市', '开业', '交易', '立券', '纳财'],
  moving: ['移徙', '入宅', '安床', '安香'],
  contract: ['立券', '交易', '纳财', '会亲友'],
  travel: ['出行'],
  groundbreaking: ['动土', '修造', '起基', '竖柱', '上梁'],
  haircut: ['理发', '沐浴'],
  pray: ['祭祀', '祈福', '求嗣', '开光'],
  burial: ['安葬', '破土', '启攒', '入殓'],
  study: ['入学', '习艺', '赴任'],
};

export interface PickDateInput {
  task: TaskKey;
  from: string;
  to: string;
  profiles: ProfileCore[];
  standard: CalendarStandard;
  locale?: Locale;
  limit?: number;
}
export interface RankedDay {
  date: string;
  score: number;
  reasons: Array<{ key: string; weight: number; detail?: string }>;
  almanac: DayAlmanac;
}

function addDay(date: string): string {
  const [y, m, d] = parseDate(date);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/** Rank days in a window for a task, penalising clashes with each profile. */
export function pickDates(input: PickDateInput): RankedDay[] {
  const locale = input.locale ?? 'en';
  const want = new Set(TASK_YI[input.task]);
  const out: RankedDay[] = [];
  for (let date = input.from; date <= input.to; date = addDay(date)) {
    const a = getDayAlmanac(date, input.standard, locale);
    const reasons: RankedDay['reasons'] = [];
    let score = 0;
    const yiHits = a.yi.filter((i) => want.has(i.code));
    const jiHits = a.ji.filter((i) => want.has(i.code));
    if (yiHits.length) {
      score += 3 * yiHits.length;
      reasons.push({ key: 'yi_match', weight: 3 * yiHits.length, detail: yiHits.map((i) => i.label).join(', ') });
    }
    if (jiHits.length) {
      score -= 6;
      reasons.push({ key: 'ji_conflict', weight: -6, detail: jiHits.map((i) => i.label).join(', ') });
    }
    if (a.yi.some((i) => i.code === '诸事不宜' || i.code === '馀事勿取')) {
      score -= 4;
      reasons.push({ key: 'nothing_advisable', weight: -4 });
    }
    if (a.huangdao) {
      score += 2;
      reasons.push({ key: 'huangdao', weight: 2 });
    }
    if (a.zhixing.good) {
      score += 1;
      reasons.push({ key: 'zhixing_good', weight: 1, detail: a.zhixing.label });
    } else if (a.zhixing.code === '破') {
      score -= 3;
      reasons.push({ key: 'zhixing_break', weight: -3 });
    }
    if (a.xiu.auspicious) {
      score += 1;
      reasons.push({ key: 'xiu_good', weight: 1, detail: a.xiu.label });
    }
    input.profiles.forEach((p, idx) => {
      const pa = personalizeAlmanac(a, p);
      if (pa.personal.clashesWithUser) {
        score -= 8;
        reasons.push({ key: 'clash_profile', weight: -8, detail: `profile ${idx + 1}` });
      } else if (pa.personal.harmsUser) {
        score -= 2;
        reasons.push({ key: 'harm_profile', weight: -2, detail: `profile ${idx + 1}` });
      }
      if (pa.personal.favorableElementDay) {
        score += 1;
        reasons.push({ key: 'useful_element', weight: 1, detail: `profile ${idx + 1}` });
      }
    });
    out.push({ date, score, reasons, almanac: a });
  }
  out.sort((x, y) => y.score - x.score || x.date.localeCompare(y.date));
  return out.slice(0, input.limit ?? 10);
}

export function atomKeysForAlmanac(a: DayAlmanac, p?: PersonalizedAlmanac['personal']): string[] {
  const keys = new Set<string>();
  keys.add(`almanac.tianshen.${a.huangdao ? 'huangdao' : 'heidao'}`);
  keys.add(`almanac.zhixing.${a.zhixing.code}`);
  keys.add(`almanac.xiu.${a.xiu.code}`);
  keys.add(`almanac.ninestar.${a.nineStar.number}`);
  for (const i of a.yi.slice(0, 4)) keys.add(`almanac.yi.${i.code}`);
  for (const i of a.ji.slice(0, 3)) keys.add(`almanac.ji.${i.code}`);
  if (p?.clashesWithUser) keys.add('almanac.personal.clash');
  if (p?.favorableElementDay) keys.add('almanac.personal.useful_element');
  return [...keys];
}

export function toEngineOutput(a: PersonalizedAlmanac): ReadingEngineOutput<PersonalizedAlmanac> {
  return { engine: 'almanac', engineVersion: '1.0.0', facts: a, atomKeys: atomKeysForAlmanac(a, a.personal), confidence: a.lunar.approximation ? 'medium' : 'high', warnings: [] };
}
