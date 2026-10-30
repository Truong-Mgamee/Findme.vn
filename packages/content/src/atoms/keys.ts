/**
 * Full atom-key space per tradition, enumerated from the engines' PUBLIC constants (never by
 * running charts). The grammar mirrors each engine's `atomKeysFor*` helper; when an engine does
 * not export the constant it uses (e.g. iztro star keys inside engine-ziwei) the list is mirrored
 * here with a comment and cross-checked by test/keys.test.ts against real engine output.
 */
import { TEN_GOD_KEYS, NAYIN_TERMS, STEM_TERMS, ELEMENT_TERMS } from '@findme/engine-bazi';
import { YIJI_TERMS, ZHIXING_TERMS, XIU_TERMS } from '@findme/engine-almanac';
import { MASTER_NUMBERS, KARMIC_DEBT_NUMBERS } from '@findme/engine-numerology';
import { SIGN_KEYS, MOON_PHASE_NAMES, PLANET_KEYS } from '@findme/engine-astro';
import deckJson from '../../tarot/deck-classic-1909.json' with { type: 'json' };
import { TRADITIONS, type Tradition } from './schema.js';

/* ------------------------------- Zi Wei ------------------------------- */
// iztro `kot()` keys (engine-ziwei MAJOR/MINOR maps, not exported).
export const ZIWEI_MAJOR_STARS = [
  'ziweiMaj', 'tianjiMaj', 'taiyangMaj', 'wuquMaj', 'tiantongMaj', 'lianzhenMaj', 'tianfuMaj',
  'taiyinMaj', 'tanlangMaj', 'jumenMaj', 'tianxiangMaj', 'tianliangMaj', 'qishaMaj', 'pojunMaj',
] as const;
/** 身主: 火星 鈴星 祿存 文昌 文曲 天機 天相 天梁 天同 */
export const ZIWEI_BODY_STARS = ['huoxingMin', 'lingxingMin', 'lucunMin', 'wenchangMin', 'wenquMin', 'tianjiMaj', 'tianxiangMaj', 'tianliangMaj', 'tiantongMaj'] as const;
/** Stars that can carry 四化 (yearly mutagen keys): 14 majors + 昌曲輔弼 */
export const ZIWEI_MUTAGEN_STARS = [...ZIWEI_MAJOR_STARS, 'wenchangMin', 'wenquMin', 'zuofuMin', 'youbiMin'] as const;
// Mirror of engine-ziwei FOCUS_PALACES (13 entries; `bodyPalace` is kept for parity with the engine list).
export const ZIWEI_FOCUS_PALACES = [
  'soulPalace', 'bodyPalace', 'spousePalace', 'wealthPalace', 'careerPalace', 'healthPalace', 'surfacePalace',
  'friendsPalace', 'parentsPalace', 'childrenPalace', 'propertyPalace', 'spiritPalace', 'siblingsPalace',
] as const;
export const ZIWEI_KEY_PALACES = ['soulPalace', 'spousePalace', 'wealthPalace', 'careerPalace'] as const;
export const ZIWEI_FIVE_CLASSES = ['water2nd', 'wood3rd', 'metal4th', 'earth5th', 'fire6th'] as const;
/** iztro kot() keys for 化祿/化權/化科/化忌 as emitted at runtime (StarView.mutagen.key). */
export const ZIWEI_MUTAGENS = ['sihuaLu', 'sihuaQuan', 'sihuaKe', 'sihuaJi'] as const;
/** Every `add('<key>', …)` in engine-ziwei detectPatterns, in source order. */
export const ZIWEI_PATTERNS = [
  'mingWuZhengYao', 'ziFuTongGong', 'ziFuChaoYuan', 'shaPoLang', 'jiYueTongLiang', 'riYueTongGong', 'fuXiangChaoYuan',
  'juJiTongGong', 'wuTanTongGong', 'lianTanTongGong', 'changQuTongGong', 'changQuJiaMing', 'luMaJiaoChi', 'huoLingTan',
  'yangTuoJiaMing', 'kongJieTongGong', 'ziXiangTongGong', 'ziPoTongGong', 'tongLiangTongGong',
] as const;

export function ziweiKeys(): string[] {
  const out: string[] = [];
  for (const s of ZIWEI_MAJOR_STARS) for (const p of ZIWEI_FOCUS_PALACES) out.push(`ziwei.star.${s}.palace.${p}`);
  for (const s of ZIWEI_MAJOR_STARS) out.push(`ziwei.soulstar.${s}`);
  for (const s of ZIWEI_BODY_STARS) out.push(`ziwei.bodystar.${s}`);
  for (const c of ZIWEI_FIVE_CLASSES) out.push(`ziwei.fiveclass.${c}`);
  for (const p of ZIWEI_PATTERNS) out.push(`ziwei.pattern.${p}`);
  for (const p of ZIWEI_FOCUS_PALACES) out.push(`ziwei.palace.${p}.empty`);
  for (const p of ZIWEI_FOCUS_PALACES) out.push(`ziwei.bodypalace.${p}`);
  for (const s of ZIWEI_MAJOR_STARS) for (const m of ZIWEI_MUTAGENS) for (const p of ZIWEI_KEY_PALACES) out.push(`ziwei.mutagen.${s}.${m}.palace.${p}`);
  for (let i = 0; i < 12; i++) out.push(`ziwei.decadal.palace.${i}`);
  for (const s of ZIWEI_MUTAGEN_STARS) out.push(`ziwei.yearly.mutagen.${s}`);
  return out;
}

/* ------------------------------- Bazi ------------------------------- */
export const BAZI_STRENGTHS = ['strong', 'weak', 'balanced'] as const;
export const BAZI_PILLARS = ['year', 'month', 'hour'] as const;

export function baziKeys(): string[] {
  const out: string[] = [];
  const stems = STEM_TERMS.length; // 10
  const elements = ELEMENT_TERMS.length; // 5 (wood fire earth metal water)
  for (let s = 0; s < stems; s++) out.push(`bazi.daymaster.${s}`);
  for (let s = 0; s < stems; s++) for (const v of BAZI_STRENGTHS) out.push(`bazi.daymaster.${s}.${v}`);
  for (const g of TEN_GOD_KEYS) for (const p of BAZI_PILLARS) out.push(`bazi.shishen.${g}.${p}`);
  for (let i = 0; i < NAYIN_TERMS.length; i++) out.push(`bazi.nayin.${i}`);
  for (const g of TEN_GOD_KEYS) out.push(`bazi.monthqi.${g}`);
  for (let e = 0; e < elements; e++) out.push(`bazi.useful.${e}`);
  for (const g of TEN_GOD_KEYS) out.push(`bazi.dayun.${g}`);
  for (let e = 0; e < elements; e++) out.push(`bazi.element.dominant.${e}`);
  return out;
}

/* ------------------------------- Almanac ------------------------------- */
export function almanacKeys(): string[] {
  const out: string[] = ['almanac.tianshen.huangdao', 'almanac.tianshen.heidao'];
  for (const z of Object.keys(ZHIXING_TERMS)) out.push(`almanac.zhixing.${z}`);
  for (const x of Object.keys(XIU_TERMS)) out.push(`almanac.xiu.${x}`);
  for (let n = 1; n <= 9; n++) out.push(`almanac.ninestar.${n}`);
  const yiji = Object.keys(YIJI_TERMS);
  for (const t of yiji) out.push(`almanac.yi.${t}`);
  for (const t of yiji) out.push(`almanac.ji.${t}`);
  out.push('almanac.personal.clash', 'almanac.personal.useful_element');
  return out;
}

/* ------------------------------- Tarot ------------------------------- */
// Mirror of engine-tarot SPREADS (engine-tarot depends on @findme/content, so it cannot be imported here).
export const TAROT_SPREAD_POSITIONS: Record<string, readonly string[]> = {
  one: ['card'],
  three: ['past', 'present', 'future'],
  five: ['situation', 'challenge', 'advice', 'outcome', 'hidden'],
  celticCross: ['present', 'challenge', 'foundation', 'recentPast', 'crown', 'nearFuture', 'self', 'environment', 'hopesFears', 'outcome'],
};
export const TAROT_CARD_IDS: readonly string[] = (deckJson as { cards: Array<{ id: string }> }).cards.map((c) => c.id);

export function tarotKeys(): string[] {
  const out: string[] = [];
  for (const id of TAROT_CARD_IDS) out.push(`tarot.${id}.upright`, `tarot.${id}.reversed`);
  for (const [spread, positions] of Object.entries(TAROT_SPREAD_POSITIONS)) for (const p of positions) out.push(`tarot.position.${spread}.${p}`);
  return out;
}

/* ------------------------------- I Ching ------------------------------- */
export function ichingKeys(): string[] {
  const out: string[] = [];
  for (let n = 1; n <= 64; n++) {
    out.push(`iching.hex.${n}`);
    for (let l = 1; l <= 6; l++) out.push(`iching.hex.${n}.line.${l}`);
    out.push(`iching.hex.${n}.relating`);
  }
  return out;
}

/* ------------------------------- Numerology ------------------------------- */
export const NUMEROLOGY_CORE_SLUGS = ['lifepath', 'expression', 'soulurge', 'personality', 'birthday', 'maturity'] as const;
export const NUMEROLOGY_CYCLE_SLUGS = ['personalyear', 'personalmonth', 'personalday'] as const;
export const NUMEROLOGY_CORE_VALUES: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, ...[...MASTER_NUMBERS].sort((a, b) => a - b)];

export function numerologyKeys(): string[] {
  const out: string[] = [];
  for (const s of NUMEROLOGY_CORE_SLUGS) for (const v of NUMEROLOGY_CORE_VALUES) out.push(`numerology.${s}.${v}`);
  for (const s of NUMEROLOGY_CYCLE_SLUGS) for (let v = 1; v <= 9; v++) out.push(`numerology.${s}.${v}`);
  for (const k of [...KARMIC_DEBT_NUMBERS].sort((a, b) => a - b)) out.push(`numerology.karmic.${k}`);
  for (const m of [...MASTER_NUMBERS].sort((a, b) => a - b)) out.push(`numerology.master.${m}`);
  return out;
}

/* ------------------------------- Astro ------------------------------- */
export const ASTRO_POINTS = ['sun', 'moon', 'rising'] as const;
export const ASTRO_PLANETS = PLANET_KEYS.filter((p): p is 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' => ['mercury', 'venus', 'mars', 'jupiter', 'saturn'].includes(p));
/** Every body that can be retrograde (daily sky reports outer planets too). */
export const ASTRO_RETRO_PLANETS = PLANET_KEYS.filter((p) => p !== 'sun' && p !== 'moon');

export function astroKeys(): string[] {
  const out: string[] = [];
  for (const pt of ASTRO_POINTS) for (const s of SIGN_KEYS) out.push(`astro.${pt}.${s}`);
  for (const p of ASTRO_PLANETS) for (const s of SIGN_KEYS) out.push(`astro.${p}.${s}`);
  for (const ph of MOON_PHASE_NAMES) out.push(`astro.moon.phase.${ph}`);
  for (const p of ASTRO_RETRO_PLANETS) out.push(`astro.${p}.retrograde`); // natal (atomKeysForAstro)
  for (const p of ASTRO_RETRO_PLANETS) out.push(`astro.retrograde.${p}`); // daily sky (atomKeysForDailySky)
  return out;
}

/* ------------------------------- Manifest ------------------------------- */
export interface KeyManifest {
  generatedAt: string;
  total: number;
  traditions: Record<Tradition, { count: number; keys: string[] }>;
}

const GENERATORS: Record<Tradition, () => string[]> = {
  ziwei: ziweiKeys, bazi: baziKeys, almanac: almanacKeys, tarot: tarotKeys, iching: ichingKeys, numerology: numerologyKeys, astro: astroKeys,
};

export function keysForTradition(t: Tradition): string[] {
  return [...new Set(GENERATORS[t]())];
}

export function generateKeyManifest(now: Date = new Date()): KeyManifest {
  const traditions = {} as KeyManifest['traditions'];
  let total = 0;
  for (const t of TRADITIONS) {
    const keys = keysForTradition(t);
    traditions[t] = { count: keys.length, keys };
    total += keys.length;
  }
  return { generatedAt: now.toISOString(), total, traditions };
}
