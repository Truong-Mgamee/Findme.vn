import * as iztroNs from 'iztro';
import * as i18nNs from 'iztro/lib/i18n/index.js';
import type FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe';
import type { IFunctionalPalace } from 'iztro/lib/astro/FunctionalPalace';
import type FunctionalStar from 'iztro/lib/star/FunctionalStar';
import { BRANCHES_HAN, STEMS_HAN, type BirthInput, type Confidence, type EngineWarning, type Locale, type ReadingEngineOutput } from '@findme/engine-core';
import { resolveBirth, type PillarOptions, type ResolvedBirth } from '@findme/engine-calendar';
import { KHAM_THIEN_MUTAGENS, KHAM_THIEN_VERIFIED, QUANSHU_MUTAGENS } from './schools/khamThien.js';

// iztro ships CommonJS; resolve exports robustly across Node/Vitest/Metro interop shapes.
type IztroModule = typeof import('iztro');
type I18nModule = typeof import('iztro/lib/i18n/index.js');
const iztroMod = ((iztroNs as unknown as { default?: IztroModule }).default?.astro ? (iztroNs as unknown as { default: IztroModule }).default : (iztroNs as unknown as IztroModule));
const astro = iztroMod.astro;
const i18nMod = ((i18nNs as unknown as { kot?: unknown }).kot ? (i18nNs as unknown as I18nModule) : (i18nNs as unknown as { default: I18nModule }).default);
const kot = i18nMod.kot as <T = string>(value: string, k?: string) => T;

/** default = iztro 通行 (flying-star 四化); zhongzhou = 中州派 star placement; quanshu = 全書/Nam Phái 四化 (庚壬科→天府); khamThienTuHoa = flying-star table (alias of default mutagens) */
export type ZiweiSchool = 'default' | 'zhongzhou' | 'quanshu' | 'khamThienTuHoa';
export type IztroLang = 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP' | 'ko-KR' | 'vi-VN';

export interface ZiweiOptions extends PillarOptions {
  locale?: Locale;
  school?: ZiweiSchool;
  /** 立春 vs 正月初一 as year divide (iztro yearDivide) */
  yearDivide?: 'normal' | 'exact';
  /** adjust leap month: after 15th counts as next month */
  fixLeap?: boolean;
}

export interface StarView {
  key: string;
  name: string;
  type: string;
  brightness: { key: string; name: string } | null;
  mutagen: { key: string; name: string } | null;
}

export interface PalaceView {
  index: number;
  key: string;
  name: string;
  stem: { index: number; han: string; name: string };
  branch: { index: number; han: string; name: string };
  isBodyPalace: boolean;
  isOriginalPalace: boolean;
  majorStars: StarView[];
  minorStars: StarView[];
  adjectiveStars: StarView[];
  changsheng12: string;
  boshi12: string;
  jiangqian12: string;
  suiqian12: string;
  decadal: { range: [number, number]; stem: string; branch: string };
  ages: number[];
}

export interface ZiweiPattern {
  key: string;
  palaceKey: string;
  stars: string[];
}

export interface ZiweiChart {
  locale: Locale;
  iztroLanguage: IztroLang;
  school: ZiweiSchool;
  schoolVerified: boolean;
  gender: BirthInput['gender'];
  input: { lunarDate: string; isLeapMonth: boolean; timeIndex: number; standard: BirthInput['calendarStandard'] };
  solarDate: string;
  lunarDateLabel: string;
  chineseDate: string;
  time: string;
  timeRange: string;
  sign: string;
  zodiac: string;
  soul: { key: string; name: string };
  body: { key: string; name: string };
  soulPalaceBranch: { key: string; name: string };
  bodyPalaceBranch: { key: string; name: string };
  fiveElementsClass: { key: string; name: string };
  palaces: PalaceView[];
  patterns: ZiweiPattern[];
  confidence: Confidence;
  warnings: EngineWarning[];
}

export interface HoroscopeItemView {
  index: number;
  name: string;
  stem: string;
  branch: string;
  palaceNames: string[];
  mutagen: Array<{ key: string; name: string }>;
}
export interface ZiweiHoroscope {
  date: string;
  lunarDate: string;
  decadal: HoroscopeItemView;
  age: HoroscopeItemView & { nominalAge: number };
  yearly: HoroscopeItemView;
  monthly: HoroscopeItemView;
  daily: HoroscopeItemView;
  hourly: HoroscopeItemView;
}

export const LOCALE_TO_IZTRO: Record<Locale, IztroLang> = {
  vi: 'vi-VN', en: 'en-US', es: 'en-US', 'pt-BR': 'en-US', ja: 'ja-JP', ko: 'ko-KR', 'zh-TW': 'zh-TW', 'zh-CN': 'zh-CN', hi: 'en-US', th: 'en-US', id: 'en-US', fr: 'en-US', de: 'en-US',
};

function applySchool(school: ZiweiSchool, yearDivide: 'normal' | 'exact', dayBoundary: PillarOptions['dayBoundary']) {
  const dayDivide = dayBoundary === '00:00' ? 'current' : 'forward';
  const mutagens = school === 'khamThienTuHoa' ? KHAM_THIEN_MUTAGENS : school === 'quanshu' ? QUANSHU_MUTAGENS : {};
  astro.config({ mutagens: mutagens as never, algorithm: school === 'zhongzhou' ? 'zhongzhou' : 'default', yearDivide, horoscopeDivide: yearDivide, dayDivide });
}

function starView(s: FunctionalStar): StarView {
  return {
    key: kot(s.name),
    name: s.name,
    type: s.type,
    brightness: s.brightness ? { key: kot(s.brightness), name: s.brightness } : null,
    mutagen: s.mutagen ? { key: kot(s.mutagen), name: s.mutagen } : null,
  };
}

function stemIndex(key: string): number {
  return ['jia', 'yi', 'bing', 'ding', 'wu', 'ji', 'geng', 'xin', 'ren', 'gui'].indexOf(key.replace('Heavenly', ''));
}
function branchIndex(key: string): number {
  return ['zi', 'chou', 'yin', 'mao', 'chen', 'si', 'wu', 'wei', 'shen', 'you', 'xu', 'hai'].indexOf(key.replace('Earthly', ''));
}

function palaceView(p: IFunctionalPalace): PalaceView {
  const sk = kot(p.heavenlyStem);
  const bk = kot(p.earthlyBranch);
  const si = stemIndex(sk);
  const bi = branchIndex(bk);
  return {
    index: p.index,
    key: kot(p.name),
    name: p.name,
    stem: { index: si, han: STEMS_HAN[si] ?? '', name: p.heavenlyStem },
    branch: { index: bi, han: BRANCHES_HAN[bi] ?? '', name: p.earthlyBranch },
    isBodyPalace: p.isBodyPalace,
    isOriginalPalace: p.isOriginalPalace,
    majorStars: p.majorStars.map(starView),
    minorStars: p.minorStars.map(starView),
    adjectiveStars: p.adjectiveStars.map(starView),
    changsheng12: p.changsheng12,
    boshi12: p.boshi12,
    jiangqian12: p.jiangqian12,
    suiqian12: p.suiqian12,
    decadal: { range: p.decadal.range, stem: p.decadal.heavenlyStem, branch: p.decadal.earthlyBranch },
    ages: p.ages,
  };
}

/** Build the iztro astrolabe for a birth input (shared by chart + horoscope). */
function buildAstrolabe(input: BirthInput, opts: ZiweiOptions): { a: FunctionalAstrolabe; rb: ResolvedBirth; timeIndex: number; warnings: EngineWarning[]; lang: IztroLang } {
  const locale = opts.locale ?? 'vi';
  const lang = LOCALE_TO_IZTRO[locale];
  const rb = resolveBirth(input, { pillars: { clock: opts.clock, dayBoundary: opts.dayBoundary ?? '23:00' } });
  const warnings: EngineWarning[] = [...rb.moment.warnings, ...rb.lunarForChart.warnings];
  const lunar = rb.lunarForChart;
  // iztro time index: 0 = early 子 (00:00-00:59), 1..11 = 丑..亥, 12 = late 子 (23:00-23:59)
  const c = rb.pillars.options.clock === 'solar' ? rb.moment.solar : rb.moment.local;
  let timeIndex = 6;
  if (!rb.moment.timeUnknown) {
    const hb = lunar.hourBranch ?? 6;
    timeIndex = c.hour === 23 ? 12 : hb;
  } else warnings.push({ code: 'ZIWEI_TIME_ASSUMED', message: 'Birth hour unknown: 午 (noon) assumed; palaces and 命宮 may be wrong.' });
  if (input.calendarStandard === 'vn' && lunar.year !== rb.lunar.year && false) void 0;
  applySchool(opts.school ?? 'default', opts.yearDivide ?? 'normal', opts.dayBoundary ?? '23:00');
  const gender = input.gender === 'male' ? 'male' : 'female';
  if (input.gender === 'other') warnings.push({ code: 'GENDER_ASSUMED', message: 'Zi Wei requires yin/yang gender for 大限 direction; female assumed.' });
  // Pass the national-standard lunar date straight in: stars depend only on lunar y/m/d + hour.
  // NOTE: when the day pillar rolled to the next day (late 子), lunarForChart already reflects that.
  const a = astro.byLunar(`${lunar.year}-${lunar.month}-${lunar.day}`, timeIndex, gender, lunar.isLeapMonth, opts.fixLeap ?? true, lang);
  return { a, rb, timeIndex, warnings, lang };
}

const MAJOR = {
  ziwei: 'ziweiMaj', tianfu: 'tianfuMaj', qisha: 'qishaMaj', pojun: 'pojunMaj', tanlang: 'tanlangMaj', tianji: 'tianjiMaj', taiyin: 'taiyinMaj', tiantong: 'tiantongMaj', tianliang: 'tianliangMaj', taiyang: 'taiyangMaj', tianxiang: 'tianxiangMaj', jumen: 'jumenMaj', wuqu: 'wuquMaj', lianzhen: 'lianzhenMaj',
} as const;
const MINOR = { wenchang: 'wenchangMin', wenqu: 'wenquMin', zuofu: 'zuofuMin', youbi: 'youbiMin', lucun: 'lucunMin', tianma: 'tianmaMin', huoxing: 'huoxingMin', lingxing: 'lingxingMin', qingyang: 'qingyangMin', tuoluo: 'tuoluoMin', dikong: 'dikongMin', dijie: 'dijieMin' } as const;

/** Detect common 格局 using stable star keys; 三方四正 = soul, opposite, wealth, career. */
export function detectPatterns(palaces: PalaceView[]): ZiweiPattern[] {
  const soulIdx = palaces.findIndex((p) => p.key === 'soulPalace');
  if (soulIdx < 0) return [];
  const at = (i: number) => palaces[((i % 12) + 12) % 12]!;
  const soul = at(soulIdx);
  const trio = [soul, at(soulIdx + 6), at(soulIdx + 4), at(soulIdx + 8)]; // 命 迁 财 官 (palace indices run anti-clockwise in iztro order)
  const flank = [at(soulIdx - 1), at(soulIdx + 1)];
  const keys = (p: PalaceView) => new Set([...p.majorStars, ...p.minorStars].map((s) => s.key));
  const soulKeys = keys(soul);
  const trioKeys = new Set<string>();
  trio.forEach((p) => keys(p).forEach((k) => trioKeys.add(k)));
  const flankKeys = flank.map(keys);
  const has = (set: Set<string>, ...ks: string[]) => ks.every((k) => set.has(k));
  const out: ZiweiPattern[] = [];
  const add = (key: string, stars: string[], palaceKey = soul.key) => out.push({ key, palaceKey, stars });

  if (soul.majorStars.length === 0) add('mingWuZhengYao', []);
  if (has(soulKeys, MAJOR.ziwei, MAJOR.tianfu)) add('ziFuTongGong', [MAJOR.ziwei, MAJOR.tianfu]);
  else if (has(trioKeys, MAJOR.ziwei, MAJOR.tianfu)) add('ziFuChaoYuan', [MAJOR.ziwei, MAJOR.tianfu]);
  if ([MAJOR.qisha, MAJOR.pojun, MAJOR.tanlang].some((k) => soulKeys.has(k)) && has(trioKeys, MAJOR.qisha, MAJOR.pojun, MAJOR.tanlang)) add('shaPoLang', [MAJOR.qisha, MAJOR.pojun, MAJOR.tanlang]);
  if (has(trioKeys, MAJOR.tianji, MAJOR.taiyin, MAJOR.tiantong, MAJOR.tianliang)) add('jiYueTongLiang', [MAJOR.tianji, MAJOR.taiyin, MAJOR.tiantong, MAJOR.tianliang]);
  if (has(soulKeys, MAJOR.taiyang, MAJOR.taiyin)) add('riYueTongGong', [MAJOR.taiyang, MAJOR.taiyin]);
  if (!soulKeys.has(MAJOR.tianfu) && !soulKeys.has(MAJOR.tianxiang) && has(trioKeys, MAJOR.tianfu, MAJOR.tianxiang)) add('fuXiangChaoYuan', [MAJOR.tianfu, MAJOR.tianxiang]);
  if (has(soulKeys, MAJOR.jumen, MAJOR.tianji)) add('juJiTongGong', [MAJOR.jumen, MAJOR.tianji]);
  if (has(soulKeys, MAJOR.wuqu, MAJOR.tanlang)) add('wuTanTongGong', [MAJOR.wuqu, MAJOR.tanlang]);
  if (has(soulKeys, MAJOR.lianzhen, MAJOR.tanlang)) add('lianTanTongGong', [MAJOR.lianzhen, MAJOR.tanlang]);
  if (has(soulKeys, MINOR.wenchang, MINOR.wenqu)) add('changQuTongGong', [MINOR.wenchang, MINOR.wenqu]);
  if (flankKeys[0]!.has(MINOR.wenchang) && flankKeys[1]!.has(MINOR.wenqu) || flankKeys[0]!.has(MINOR.wenqu) && flankKeys[1]!.has(MINOR.wenchang)) add('changQuJiaMing', [MINOR.wenchang, MINOR.wenqu]);
  if (trioKeys.has(MINOR.tianma) && (trioKeys.has(MINOR.lucun) || trio.some((p) => p.majorStars.some((s) => s.mutagen?.key === 'luMutagen' || s.mutagen?.name === '祿' || s.mutagen?.name === '禄')))) add('luMaJiaoChi', [MINOR.lucun, MINOR.tianma]);
  if (soulKeys.has(MAJOR.tanlang) && (soulKeys.has(MINOR.huoxing) || soulKeys.has(MINOR.lingxing))) add('huoLingTan', [MAJOR.tanlang, soulKeys.has(MINOR.huoxing) ? MINOR.huoxing : MINOR.lingxing]);
  if (flankKeys[0]!.has(MINOR.qingyang) && flankKeys[1]!.has(MINOR.tuoluo) || flankKeys[0]!.has(MINOR.tuoluo) && flankKeys[1]!.has(MINOR.qingyang)) add('yangTuoJiaMing', [MINOR.qingyang, MINOR.tuoluo]);
  if (has(soulKeys, MINOR.dikong, MINOR.dijie)) add('kongJieTongGong', [MINOR.dikong, MINOR.dijie]);
  if (has(soulKeys, MAJOR.ziwei, MAJOR.tianxiang)) add('ziXiangTongGong', [MAJOR.ziwei, MAJOR.tianxiang]);
  if (has(soulKeys, MAJOR.ziwei, MAJOR.pojun)) add('ziPoTongGong', [MAJOR.ziwei, MAJOR.pojun]);
  if (has(soulKeys, MAJOR.tiantong, MAJOR.tianliang)) add('tongLiangTongGong', [MAJOR.tiantong, MAJOR.tianliang]);
  return out;
}

export function computeZiwei(input: BirthInput, opts: ZiweiOptions = {}): ZiweiChart {
  const { a, rb, timeIndex, warnings, lang } = buildAstrolabe(input, opts);
  const palaces = a.palaces.map(palaceView);
  const patterns = detectPatterns(palaces);
  const school = opts.school ?? 'default';
  if ((school === 'khamThienTuHoa' || school === 'quanshu') && !KHAM_THIEN_VERIFIED) warnings.push({ code: 'SCHOOL_UNVERIFIED', message: `${school} mutagen table pending expert verification.` });
  const confidence: Confidence = rb.moment.timeUnknown ? 'low' : rb.moment.warnings.some((w) => w.code === 'TZ_ESTIMATED') ? 'medium' : 'high';
  return {
    locale: opts.locale ?? 'vi',
    iztroLanguage: lang,
    school,
    schoolVerified: school === 'default' || school === 'zhongzhou' || KHAM_THIEN_VERIFIED,
    gender: input.gender,
    input: { lunarDate: `${rb.lunarForChart.year}-${rb.lunarForChart.month}-${rb.lunarForChart.day}`, isLeapMonth: rb.lunarForChart.isLeapMonth, timeIndex, standard: input.calendarStandard },
    solarDate: a.solarDate,
    lunarDateLabel: a.lunarDate,
    chineseDate: a.chineseDate,
    time: a.time,
    timeRange: a.timeRange,
    sign: a.sign,
    zodiac: a.zodiac,
    soul: { key: kot(a.soul), name: a.soul },
    body: { key: kot(a.body), name: a.body },
    soulPalaceBranch: { key: kot(a.earthlyBranchOfSoulPalace), name: a.earthlyBranchOfSoulPalace },
    bodyPalaceBranch: { key: kot(a.earthlyBranchOfBodyPalace), name: a.earthlyBranchOfBodyPalace },
    fiveElementsClass: { key: kot(a.fiveElementsClass), name: a.fiveElementsClass },
    palaces,
    patterns,
    confidence,
    warnings,
  };
}

function itemView(h: { index: number; name: string; heavenlyStem: string; earthlyBranch: string; palaceNames: string[]; mutagen: string[] }): HoroscopeItemView {
  return { index: h.index, name: h.name, stem: h.heavenlyStem, branch: h.earthlyBranch, palaceNames: h.palaceNames, mutagen: h.mutagen.map((m) => ({ key: kot(m), name: m })) };
}

/** Horoscope (大限/小限/流年/流月/流日/流時) for a target date. */
export function computeZiweiHoroscope(input: BirthInput, date: string, opts: ZiweiOptions = {}): ZiweiHoroscope {
  const { a } = buildAstrolabe(input, opts);
  const h = a.horoscope(date);
  return {
    date,
    lunarDate: h.lunarDate,
    decadal: itemView(h.decadal),
    age: { ...itemView(h.age), nominalAge: h.age.nominalAge },
    yearly: itemView(h.yearly),
    monthly: itemView(h.monthly),
    daily: itemView(h.daily),
    hourly: itemView(h.hourly),
  };
}

const FOCUS_PALACES = ['soulPalace', 'bodyPalace', 'spousePalace', 'wealthPalace', 'careerPalace', 'healthPalace', 'surfacePalace', 'friendsPalace', 'parentsPalace', 'childrenPalace', 'propertyPalace', 'spiritPalace', 'siblingsPalace'];

export function atomKeysForZiwei(c: ZiweiChart, h?: ZiweiHoroscope): string[] {
  const keys = new Set<string>();
  keys.add(`ziwei.soulstar.${c.soul.key}`);
  keys.add(`ziwei.bodystar.${c.body.key}`);
  keys.add(`ziwei.fiveclass.${c.fiveElementsClass.key}`);
  for (const p of c.palaces) {
    if (!FOCUS_PALACES.includes(p.key)) continue;
    if (p.majorStars.length === 0) keys.add(`ziwei.palace.${p.key}.empty`);
    for (const s of p.majorStars) {
      keys.add(`ziwei.star.${s.key}.palace.${p.key}`);
      if (s.mutagen) keys.add(`ziwei.mutagen.${s.key}.${s.mutagen.key}.palace.${p.key}`);
    }
    if (p.isBodyPalace) keys.add(`ziwei.bodypalace.${p.key}`);
  }
  for (const pt of c.patterns) keys.add(`ziwei.pattern.${pt.key}`);
  if (h) {
    keys.add(`ziwei.decadal.palace.${h.decadal.index}`);
    for (const m of h.yearly.mutagen) keys.add(`ziwei.yearly.mutagen.${m.key}`);
  }
  return [...keys];
}

export function toEngineOutput(c: ZiweiChart, h?: ZiweiHoroscope): ReadingEngineOutput<{ chart: ZiweiChart; horoscope?: ZiweiHoroscope }> {
  return { engine: 'ziwei', engineVersion: '1.0.0', facts: { chart: c, horoscope: h }, atomKeys: atomKeysForZiwei(c, h), confidence: c.confidence, warnings: c.warnings };
}
