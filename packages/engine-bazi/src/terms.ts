import type { Locale } from '@findme/engine-core';

type L = Partial<Record<Locale, string>> & { han: string };

export const STEM_TERMS: L[] = [
  { han: '甲', vi: 'Giáp', en: 'Jia (Yang Wood)', ja: '甲', ko: '갑', 'zh-TW': '甲' },
  { han: '乙', vi: 'Ất', en: 'Yi (Yin Wood)', ja: '乙', ko: '을', 'zh-TW': '乙' },
  { han: '丙', vi: 'Bính', en: 'Bing (Yang Fire)', ja: '丙', ko: '병', 'zh-TW': '丙' },
  { han: '丁', vi: 'Đinh', en: 'Ding (Yin Fire)', ja: '丁', ko: '정', 'zh-TW': '丁' },
  { han: '戊', vi: 'Mậu', en: 'Wu (Yang Earth)', ja: '戊', ko: '무', 'zh-TW': '戊' },
  { han: '己', vi: 'Kỷ', en: 'Ji (Yin Earth)', ja: '己', ko: '기', 'zh-TW': '己' },
  { han: '庚', vi: 'Canh', en: 'Geng (Yang Metal)', ja: '庚', ko: '경', 'zh-TW': '庚' },
  { han: '辛', vi: 'Tân', en: 'Xin (Yin Metal)', ja: '辛', ko: '신', 'zh-TW': '辛' },
  { han: '壬', vi: 'Nhâm', en: 'Ren (Yang Water)', ja: '壬', ko: '임', 'zh-TW': '壬' },
  { han: '癸', vi: 'Quý', en: 'Gui (Yin Water)', ja: '癸', ko: '계', 'zh-TW': '癸' },
];

export const BRANCH_TERMS: L[] = [
  { han: '子', vi: 'Tý', en: 'Zi (Rat)', ja: '子', ko: '자', 'zh-TW': '子' },
  { han: '丑', vi: 'Sửu', en: 'Chou (Ox)', ja: '丑', ko: '축', 'zh-TW': '丑' },
  { han: '寅', vi: 'Dần', en: 'Yin (Tiger)', ja: '寅', ko: '인', 'zh-TW': '寅' },
  { han: '卯', vi: 'Mão', en: 'Mao (Rabbit)', ja: '卯', ko: '묘', 'zh-TW': '卯' },
  { han: '辰', vi: 'Thìn', en: 'Chen (Dragon)', ja: '辰', ko: '진', 'zh-TW': '辰' },
  { han: '巳', vi: 'Tỵ', en: 'Si (Snake)', ja: '巳', ko: '사', 'zh-TW': '巳' },
  { han: '午', vi: 'Ngọ', en: 'Wu (Horse)', ja: '午', ko: '오', 'zh-TW': '午' },
  { han: '未', vi: 'Mùi', en: 'Wei (Goat)', ja: '未', ko: '미', 'zh-TW': '未' },
  { han: '申', vi: 'Thân', en: 'Shen (Monkey)', ja: '申', ko: '신', 'zh-TW': '申' },
  { han: '酉', vi: 'Dậu', en: 'You (Rooster)', ja: '酉', ko: '유', 'zh-TW': '酉' },
  { han: '戌', vi: 'Tuất', en: 'Xu (Dog)', ja: '戌', ko: '술', 'zh-TW': '戌' },
  { han: '亥', vi: 'Hợi', en: 'Hai (Pig)', ja: '亥', ko: '해', 'zh-TW': '亥' },
];

export const ELEMENT_TERMS: L[] = [
  { han: '木', vi: 'Mộc', en: 'Wood', ja: '木', ko: '목', 'zh-TW': '木' },
  { han: '火', vi: 'Hỏa', en: 'Fire', ja: '火', ko: '화', 'zh-TW': '火' },
  { han: '土', vi: 'Thổ', en: 'Earth', ja: '土', ko: '토', 'zh-TW': '土' },
  { han: '金', vi: 'Kim', en: 'Metal', ja: '金', ko: '금', 'zh-TW': '金' },
  { han: '水', vi: 'Thủy', en: 'Water', ja: '水', ko: '수', 'zh-TW': '水' },
];

/** Ten Gods, indexed by TenGod enum order below */
export const TEN_GOD_KEYS = ['bijian', 'jiecai', 'shishen', 'shangguan', 'piancai', 'zhengcai', 'qisha', 'zhengguan', 'pianyin', 'zhengyin'] as const;
export type TenGodKey = (typeof TEN_GOD_KEYS)[number];
export const TEN_GOD_TERMS: Record<TenGodKey, L> = {
  bijian: { han: '比肩', vi: 'Tỷ Kiên', en: 'Friend (Companion)', ja: '比肩', ko: '비견', 'zh-TW': '比肩' },
  jiecai: { han: '劫財', vi: 'Kiếp Tài', en: 'Rob Wealth', ja: '劫財', ko: '겁재', 'zh-TW': '劫財' },
  shishen: { han: '食神', vi: 'Thực Thần', en: 'Eating God (Output)', ja: '食神', ko: '식신', 'zh-TW': '食神' },
  shangguan: { han: '傷官', vi: 'Thương Quan', en: 'Hurting Officer', ja: '傷官', ko: '상관', 'zh-TW': '傷官' },
  piancai: { han: '偏財', vi: 'Thiên Tài', en: 'Indirect Wealth', ja: '偏財', ko: '편재', 'zh-TW': '偏財' },
  zhengcai: { han: '正財', vi: 'Chính Tài', en: 'Direct Wealth', ja: '正財', ko: '정재', 'zh-TW': '正財' },
  qisha: { han: '七殺', vi: 'Thất Sát', en: 'Seven Killings', ja: '偏官', ko: '편관', 'zh-TW': '七殺' },
  zhengguan: { han: '正官', vi: 'Chính Quan', en: 'Direct Officer', ja: '正官', ko: '정관', 'zh-TW': '正官' },
  pianyin: { han: '偏印', vi: 'Thiên Ấn', en: 'Indirect Resource', ja: '偏印', ko: '편인', 'zh-TW': '偏印' },
  zhengyin: { han: '正印', vi: 'Chính Ấn', en: 'Direct Resource', ja: '印綬', ko: '정인', 'zh-TW': '正印' },
};

/** 納音 30 entries indexed by floor(ganzhiIndex / 2) */
export const NAYIN_TERMS: L[] = [
  { han: '海中金', vi: 'Hải Trung Kim', en: 'Gold in the Sea' },
  { han: '爐中火', vi: 'Lư Trung Hỏa', en: 'Fire in the Furnace' },
  { han: '大林木', vi: 'Đại Lâm Mộc', en: 'Wood of the Great Forest' },
  { han: '路旁土', vi: 'Lộ Bàng Thổ', en: 'Earth by the Roadside' },
  { han: '劍鋒金', vi: 'Kiếm Phong Kim', en: 'Sword-edge Metal' },
  { han: '山頭火', vi: 'Sơn Đầu Hỏa', en: 'Fire on the Mountain Top' },
  { han: '澗下水', vi: 'Giản Hạ Thủy', en: 'Water of the Ravine' },
  { han: '城頭土', vi: 'Thành Đầu Thổ', en: 'Earth of the City Wall' },
  { han: '白蠟金', vi: 'Bạch Lạp Kim', en: 'White Wax Metal' },
  { han: '楊柳木', vi: 'Dương Liễu Mộc', en: 'Willow Wood' },
  { han: '泉中水', vi: 'Tuyền Trung Thủy', en: 'Spring Water' },
  { han: '屋上土', vi: 'Ốc Thượng Thổ', en: 'Earth on the Roof' },
  { han: '霹靂火', vi: 'Tích Lịch Hỏa', en: 'Thunderbolt Fire' },
  { han: '松柏木', vi: 'Tùng Bách Mộc', en: 'Pine and Cypress Wood' },
  { han: '長流水', vi: 'Trường Lưu Thủy', en: 'Long-flowing Water' },
  { han: '沙中金', vi: 'Sa Trung Kim', en: 'Gold in the Sand' },
  { han: '山下火', vi: 'Sơn Hạ Hỏa', en: 'Fire at the Foot of the Mountain' },
  { han: '平地木', vi: 'Bình Địa Mộc', en: 'Wood of the Plain' },
  { han: '壁上土', vi: 'Bích Thượng Thổ', en: 'Earth on the Wall' },
  { han: '金箔金', vi: 'Kim Bạch Kim', en: 'Gold Foil' },
  { han: '覆燈火', vi: 'Phúc Đăng Hỏa', en: 'Lamp Fire' },
  { han: '天河水', vi: 'Thiên Hà Thủy', en: 'Water of the Milky Way' },
  { han: '大驛土', vi: 'Đại Dịch Thổ', en: 'Earth of the Great Post Road' },
  { han: '釵釧金', vi: 'Thoa Xuyến Kim', en: 'Hairpin Gold' },
  { han: '桑柘木', vi: 'Tang Đố Mộc', en: 'Mulberry Wood' },
  { han: '大溪水', vi: 'Đại Khê Thủy', en: 'Water of the Great Stream' },
  { han: '沙中土', vi: 'Sa Trung Thổ', en: 'Earth in the Sand' },
  { han: '天上火', vi: 'Thiên Thượng Hỏa', en: 'Fire in the Sky' },
  { han: '石榴木', vi: 'Thạch Lựu Mộc', en: 'Pomegranate Wood' },
  { han: '大海水', vi: 'Đại Hải Thủy', en: 'Water of the Great Sea' },
];

/** 藏干 hidden stems per branch (main first), stem indices */
export const HIDDEN_STEMS: number[][] = [
  [9], // 子: 癸
  [5, 9, 7], // 丑: 己 癸 辛
  [0, 2, 4], // 寅: 甲 丙 戊
  [1], // 卯: 乙
  [4, 1, 9], // 辰: 戊 乙 癸
  [2, 4, 6], // 巳: 丙 戊 庚
  [3, 5], // 午: 丁 己
  [5, 3, 1], // 未: 己 丁 乙
  [6, 8, 4], // 申: 庚 壬 戊
  [7], // 酉: 辛
  [4, 7, 3], // 戌: 戊 辛 丁
  [8, 0], // 亥: 壬 甲
];

/** 十二長生 stages */
export const STAGE_TERMS: L[] = [
  { han: '長生', vi: 'Trường Sinh', en: 'Birth' },
  { han: '沐浴', vi: 'Mộc Dục', en: 'Bath' },
  { han: '冠帶', vi: 'Quan Đới', en: 'Youth' },
  { han: '臨官', vi: 'Lâm Quan', en: 'Maturity' },
  { han: '帝旺', vi: 'Đế Vượng', en: 'Prime' },
  { han: '衰', vi: 'Suy', en: 'Decline' },
  { han: '病', vi: 'Bệnh', en: 'Sickness' },
  { han: '死', vi: 'Tử', en: 'Death' },
  { han: '墓', vi: 'Mộ', en: 'Grave' },
  { han: '絕', vi: 'Tuyệt', en: 'Extinction' },
  { han: '胎', vi: 'Thai', en: 'Conception' },
  { han: '養', vi: 'Dưỡng', en: 'Nurture' },
];

/** Branch where 長生 starts for each stem (yang forward, yin backward) */
export const CHANGSHENG_START: number[] = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3]; // 甲亥 乙午 丙寅 丁酉 戊寅 己酉 庚巳 辛子 壬申 癸卯

export function label(t: L, locale: Locale): string {
  return t[locale] ?? t.en ?? t.han;
}
