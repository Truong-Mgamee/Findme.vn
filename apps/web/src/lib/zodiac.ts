import { BRANCHES_EN, BRANCHES_HAN, BRANCHES_VI, BRANCH_ELEMENT, ELEMENTS_EN, ELEMENTS_VI, ZODIAC_EN, ZODIAC_VI } from '@findme/engine-core';
import type { AppLocale } from '@/i18n/routing';

/** URL slugs per locale for the 12 earthly branches (index 0 = 子/Tý/Rat). */
export const ZODIAC_SLUGS: Record<AppLocale, readonly string[]> = {
  vi: ['ty', 'suu', 'dan', 'mao', 'thin', 'ti', 'ngo', 'mui', 'than', 'dau', 'tuat', 'hoi'],
  en: ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'],
};

export function branchFromSlug(slug: string): number {
  const s = slug.toLowerCase();
  for (const list of Object.values(ZODIAC_SLUGS)) {
    const i = list.indexOf(s);
    if (i >= 0) return i;
  }
  return -1;
}

export function slugFor(branch: number, locale: AppLocale): string {
  return ZODIAC_SLUGS[locale][branch] ?? ZODIAC_SLUGS.en[branch] ?? 'rat';
}

export interface ZodiacInfo {
  branch: number;
  han: string;
  branchName: string;
  animal: string;
  element: string;
  yin: boolean;
  /** 三合 trine partners */
  trine: number[];
  /** 六合 secret friend */
  secretFriend: number;
  /** 六冲 clash */
  clash: number;
  /** recent birth years (lunar-year approximation by Gregorian year) */
  years: number[];
  hours: string;
}

const SECRET_FRIEND = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
const HOURS = ['23:00–01:00', '01:00–03:00', '03:00–05:00', '05:00–07:00', '07:00–09:00', '09:00–11:00', '11:00–13:00', '13:00–15:00', '15:00–17:00', '17:00–19:00', '19:00–21:00', '21:00–23:00'];

export function zodiacInfo(branch: number, locale: AppLocale): ZodiacInfo {
  const el = BRANCH_ELEMENT[branch] as number;
  const years: number[] = [];
  for (let y = 1948 + branch; y <= 2032; y += 12) years.push(y);
  return {
    branch,
    han: BRANCHES_HAN[branch] as string,
    branchName: locale === 'vi' ? (BRANCHES_VI[branch] as string) : (BRANCHES_EN[branch] as string),
    animal: locale === 'vi' ? (ZODIAC_VI[branch] as string) : (ZODIAC_EN[branch] as string),
    element: locale === 'vi' ? (ELEMENTS_VI[el] as string) : (ELEMENTS_EN[el] as string),
    yin: branch % 2 === 1,
    trine: [(branch + 4) % 12, (branch + 8) % 12],
    secretFriend: SECRET_FRIEND[branch] as number,
    clash: (branch + 6) % 12,
    years,
    hours: HOURS[branch] as string,
  };
}

/** Static, engine-free explainer copy (kept short; richer text comes from published atoms `zodiac.<branch>.*`). */
export const ZODIAC_TRAITS: Record<AppLocale, string[]> = {
  vi: [
    'Nhanh nhẹn, khéo léo, giỏi xoay xở và có trực giác tốt với tiền bạc.',
    'Bền bỉ, đáng tin, làm việc có phương pháp và rất kiên nhẫn.',
    'Dũng cảm, quyết đoán, thích dẫn đầu và ghét bị ràng buộc.',
    'Dịu dàng, tinh tế, giỏi ngoại giao và biết giữ hòa khí.',
    'Tự tin, nhiệt huyết, có tầm nhìn lớn và sức hút tự nhiên.',
    'Sâu sắc, bí ẩn, suy nghĩ kỹ trước khi hành động.',
    'Phóng khoáng, yêu tự do, lạc quan và giàu năng lượng.',
    'Ôn hòa, giàu lòng trắc ẩn, có khiếu thẩm mỹ.',
    'Thông minh, hoạt bát, sáng tạo và thích thử thách trí tuệ.',
    'Chăm chỉ, thẳng thắn, cầu toàn và có trách nhiệm.',
    'Trung thành, chính trực, luôn bảo vệ người mình yêu quý.',
    'Chân thành, hào phóng, sống tình cảm và dễ gần.',
  ],
  en: [
    'Quick-witted, resourceful and instinctively good with money.',
    'Steady, dependable, methodical and extraordinarily patient.',
    'Brave and decisive, a natural leader who dislikes constraints.',
    'Gentle, tactful, diplomatic and a keeper of harmony.',
    'Confident, passionate, visionary and naturally charismatic.',
    'Deep, enigmatic and deliberate: thinks before acting.',
    'Free-spirited, optimistic and full of energy.',
    'Mild, compassionate and artistically gifted.',
    'Clever, lively, inventive and fond of mental challenges.',
    'Hard-working, candid, perfectionist and responsible.',
    'Loyal and principled, a protector of loved ones.',
    'Sincere, generous, warm-hearted and easy to approach.',
  ],
};
