import type { GanZhi } from './types.js';

export const STEMS_HAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const BRANCHES_HAN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
export const STEMS_VI = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const;
export const BRANCHES_VI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'] as const;
export const STEMS_EN = ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'] as const;
export const BRANCHES_EN = ['Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'] as const;
export const ZODIAC_EN = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'] as const;
export const ZODIAC_VI = ['Chuột', 'Trâu', 'Hổ', 'Mèo', 'Rồng', 'Rắn', 'Ngựa', 'Dê', 'Khỉ', 'Gà', 'Chó', 'Lợn'] as const;

/** Five elements of stems: 0 wood,1 fire,2 earth,3 metal,4 water */
export const STEM_ELEMENT = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4] as const;
export const BRANCH_ELEMENT = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4] as const;
export const ELEMENTS_HAN = ['木', '火', '土', '金', '水'] as const;
export const ELEMENTS_VI = ['Mộc', 'Hỏa', 'Thổ', 'Kim', 'Thủy'] as const;
export const ELEMENTS_EN = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'] as const;

export function ganzhiFromIndex(index: number): GanZhi {
  const i = ((index % 60) + 60) % 60;
  const stem = i % 10;
  const branch = i % 12;
  return { index: i, stem, branch, han: `${STEMS_HAN[stem]}${BRANCHES_HAN[branch]}` };
}

export function ganzhiFromStemBranch(stem: number, branch: number): GanZhi {
  for (let i = 0; i < 60; i++) if (i % 10 === stem && i % 12 === branch) return ganzhiFromIndex(i);
  throw new Error(`invalid stem/branch pair ${stem}/${branch}`);
}

export function ganzhiFromHan(han: string): GanZhi {
  const s = STEMS_HAN.indexOf(han[0] as (typeof STEMS_HAN)[number]);
  const b = BRANCHES_HAN.indexOf(han[1] as (typeof BRANCHES_HAN)[number]);
  if (s < 0 || b < 0) throw new Error(`invalid ganzhi ${han}`);
  return ganzhiFromStemBranch(s, b);
}

/** Year ganzhi for a (solar-term or lunar) year number. 1984 = 甲子 */
export function ganzhiOfYear(year: number): GanZhi {
  return ganzhiFromIndex(year - 1984);
}

export function ganzhiLabel(gz: GanZhi, locale: string): string {
  switch (locale) {
    case 'vi':
      return `${STEMS_VI[gz.stem]} ${BRANCHES_VI[gz.branch]}`;
    case 'zh-TW':
    case 'zh-CN':
    case 'ja':
      return gz.han;
    default:
      return `${STEMS_EN[gz.stem]} ${BRANCHES_EN[gz.branch]}`;
  }
}
