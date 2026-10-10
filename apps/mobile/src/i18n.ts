/**
 * Minimal UI dictionary for the scaffold (vi/en). Ticket T-SETUP-02 migrates this to Lingui (ICU MessageFormat).
 */
export type Locale = "vi" | "en";

const dict = {
  vi: {
    today: "Hôm nay",
    lunar: "Âm lịch",
    love: "Tình cảm", work: "Công việc", money: "Tiền bạc", health: "Sức khỏe", overall: "Tổng quan",
    hoangDao: "Ngày hoàng đạo", hacDao: "Ngày hắc đạo",
    goodHours: "Giờ tốt", luckyNumber: "Số may mắn", luckyElement: "Hành của ngày",
    tarotOfDay: "Lá bài hôm nay", reversed: "ngược", upright: "xuôi",
    personalDay: "Số ngày cá nhân", moon: "Trăng", clash: "Ngày xung tuổi, tránh việc lớn",
    menh: "Mệnh", lifePath: "Số chủ đạo", sun: "Mặt trời", asc: "Cung mọc",
    demoProfile: "Hồ sơ demo",
  },
  en: {
    today: "Today",
    lunar: "Lunar",
    love: "Love", work: "Work", money: "Money", health: "Health", overall: "Overall",
    hoangDao: "Auspicious day", hacDao: "Inauspicious day",
    goodHours: "Good hours", luckyNumber: "Lucky number", luckyElement: "Element of the day",
    tarotOfDay: "Card of the day", reversed: "reversed", upright: "upright",
    personalDay: "Personal day", moon: "Moon", clash: "Clashes with your year – avoid big decisions",
    menh: "Element", lifePath: "Life path", sun: "Sun", asc: "Rising",
    demoProfile: "Demo profile",
  },
} as const;

export type Key = keyof typeof dict.en;

export function makeT(locale: Locale) {
  return (k: Key): string => dict[locale][k] ?? dict.en[k];
}

export function detectLocale(tag: string | undefined): Locale {
  return tag?.toLowerCase().startsWith("vi") ? "vi" : "en";
}
