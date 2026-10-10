/**
 * Mutagen (四化) tables by school. Order per stem: [祿 lu, 權 quan, 科 ke, 忌 ji].
 *
 * Probing iztro 2.6.1 (see test) shows its DEFAULT table already matches the 飛星/欽天四化 convention
 * (庚: 太陽 武曲 太陰 天同; 壬: 天梁 紫微 左輔 武曲). The other widespread convention — 全書 /
 * "Nam Phái" as used by many Vietnamese almanacs — differs in the 科 star of 庚 and 壬 (天府).
 *
 * STATUS: transcribed from commonly published tables; MUST be verified by a practitioner before
 * marketing either name. `schoolVerified` is reported false until then.
 */
export const FLYING_STAR_MUTAGENS = {
  jiaHeavenly: ['lianzhenMaj', 'pojunMaj', 'wuquMaj', 'taiyangMaj'],
  yiHeavenly: ['tianjiMaj', 'tianliangMaj', 'ziweiMaj', 'taiyinMaj'],
  bingHeavenly: ['tiantongMaj', 'tianjiMaj', 'wenchangMin', 'lianzhenMaj'],
  dingHeavenly: ['taiyinMaj', 'tiantongMaj', 'tianjiMaj', 'jumenMaj'],
  wuHeavenly: ['tanlangMaj', 'taiyinMaj', 'youbiMin', 'tianjiMaj'],
  jiHeavenly: ['wuquMaj', 'tanlangMaj', 'tianliangMaj', 'wenquMin'],
  gengHeavenly: ['taiyangMaj', 'wuquMaj', 'taiyinMaj', 'tiantongMaj'],
  xinHeavenly: ['jumenMaj', 'taiyangMaj', 'wenquMin', 'wenchangMin'],
  renHeavenly: ['tianliangMaj', 'ziweiMaj', 'zuofuMin', 'wuquMaj'],
  guiHeavenly: ['pojunMaj', 'jumenMaj', 'taiyinMaj', 'tanlangMaj'],
} as const;

/** 全書 variant: only 庚 and 壬 科 differ (天府). */
export const QUANSHU_MUTAGENS = {
  gengHeavenly: ['taiyangMaj', 'wuquMaj', 'tianfuMaj', 'tiantongMaj'],
  renHeavenly: ['tianliangMaj', 'ziweiMaj', 'tianfuMaj', 'wuquMaj'],
} as const;

/** Khâm Thiên Tứ Hoá uses the flying-star table. */
export const KHAM_THIEN_MUTAGENS = FLYING_STAR_MUTAGENS;
export const KHAM_THIEN_VERIFIED = false;
