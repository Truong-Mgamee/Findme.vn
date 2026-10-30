/**
 * Minimal UI dictionary for the scaffold (vi/en). Ticket T-SETUP-02 migrates this to Lingui (ICU MessageFormat).
 */
export type Locale = "vi" | "en";

const dict = {
  vi: {
    today: "Hôm nay", lunar: "Âm lịch",
    love: "Tình cảm", work: "Công việc", money: "Tiền bạc", health: "Sức khỏe", overall: "Tổng quan",
    hoangDao: "Ngày hoàng đạo", hacDao: "Ngày hắc đạo",
    goodHours: "Giờ tốt", luckyNumber: "Số may mắn", luckyElement: "Hành của ngày",
    tarotOfDay: "Lá bài hôm nay", reversed: "ngược", upright: "xuôi",
    personalDay: "Số ngày cá nhân", moon: "Trăng", clash: "Ngày xung tuổi, tránh việc lớn",
    menh: "Mệnh", lifePath: "Số chủ đạo", sun: "Mặt trời", asc: "Cung mọc",
    tabToday: "Hôm nay", tabProfile: "Lá số", tabCalendar: "Lịch", tabSettings: "Tôi",
    onboardingTitle: "Lập hồ sơ của bạn", onboardingHint: "Ngày, giờ và nơi sinh dùng để tính 4 hệ: Tử vi, Bát tự, Chiêm tinh, Thần số. Dữ liệu lưu trên máy bạn.",
    name: "Tên gọi", fullName: "Họ tên đầy đủ (cho thần số học)", gender: "Giới tính", male: "Nam", female: "Nữ", other: "Khác",
    birthDate: "Ngày sinh (dương lịch)", day: "Ngày", month: "Tháng", year: "Năm",
    birthTime: "Giờ sinh", timeClock: "Giờ đồng hồ", timeBranch: "Canh giờ", timeUnknown: "Không rõ", hour: "Giờ", minute: "Phút",
    birthPlace: "Nơi sinh", continue: "Tiếp tục", invalidDate: "Ngày sinh không hợp lệ",
    unknownTimeNote: "Không rõ giờ: Tử vi sẽ bỏ qua, các hệ khác giảm độ chính xác về cung mọc.",
    tuvi: "Tử vi", bazi: "Bát tự", astro: "Chiêm tinh", numerology: "Thần số",
    palace: "Cung", mainStars: "Chính tinh", noMainStar: "Vô chính diệu", daiHan: "Đại hạn", than: "Thân", tuan: "Tuần", triet: "Triệt",
    cuc: "Cục", menhChu: "Mệnh chủ", thanChu: "Thân chủ", menhCuc: "Mệnh – Cục", tuviUnavailable: "Cần giờ sinh để lập lá số Tử vi.",
    planet: "Hành tinh", sign: "Cung", house: "Nhà", retro: "nghịch hành", aspects: "Góc chiếu",
    pillarYear: "Năm", pillarMonth: "Tháng", pillarDay: "Ngày", pillarHour: "Giờ", dayMaster: "Nhật chủ", elements: "Tỷ lệ ngũ hành", strength: "Thân", favorable: "Hỷ dụng", unfavorable: "Kỵ", luckPillars: "Đại vận",
    expression: "Số sứ mệnh", soulUrge: "Số linh hồn", personality: "Số nhân cách", birthday: "Số ngày sinh", maturity: "Số trưởng thành", personalYear: "Năm cá nhân",
    goodDaysTitle: "Ngày tốt tháng này", wedding: "Cưới hỏi", opening: "Khai trương", travel: "Xuất hành", contract: "Ký kết", moving: "Chuyển nhà", general: "Việc chung", noGoodDays: "Không có ngày phù hợp (đã loại ngày xung tuổi).",
    settings: "Cài đặt", language: "Ngôn ngữ", editProfile: "Sửa hồ sơ", resetProfile: "Xoá hồ sơ trên máy", licenses: "Nguồn dữ liệu & giấy phép", disclaimer: "Nội dung mang tính tham khảo và giải trí, không thay thế tư vấn y tế, pháp lý hay tài chính.",
  },
  en: {
    today: "Today", lunar: "Lunar",
    love: "Love", work: "Work", money: "Money", health: "Health", overall: "Overall",
    hoangDao: "Auspicious day", hacDao: "Inauspicious day",
    goodHours: "Good hours", luckyNumber: "Lucky number", luckyElement: "Element of the day",
    tarotOfDay: "Card of the day", reversed: "reversed", upright: "upright",
    personalDay: "Personal day", moon: "Moon", clash: "Clashes with your year – avoid big decisions",
    menh: "Element", lifePath: "Life path", sun: "Sun", asc: "Rising",
    tabToday: "Today", tabProfile: "Chart", tabCalendar: "Calendar", tabSettings: "Me",
    onboardingTitle: "Set up your profile", onboardingHint: "Birth date, time and place feed four systems: Tử Vi, Bazi, Western astrology and numerology. Stored on your device.",
    name: "Name", fullName: "Full birth name (for numerology)", gender: "Gender", male: "Male", female: "Female", other: "Other",
    birthDate: "Birth date", day: "Day", month: "Month", year: "Year",
    birthTime: "Birth time", timeClock: "Clock time", timeBranch: "Chinese hour", timeUnknown: "Unknown", hour: "Hour", minute: "Minute",
    birthPlace: "Birth place", continue: "Continue", invalidDate: "Invalid birth date",
    unknownTimeNote: "Unknown time: Tử Vi is skipped and the rising sign is approximate.",
    tuvi: "Tử Vi", bazi: "Bazi", astro: "Astrology", numerology: "Numerology",
    palace: "Palace", mainStars: "Main stars", noMainStar: "No main star", daiHan: "Decade", than: "Body", tuan: "Tuần", triet: "Triệt",
    cuc: "Cục", menhChu: "Life lord", thanChu: "Body lord", menhCuc: "Life – Cục", tuviUnavailable: "Birth time is needed for a Tử Vi chart.",
    planet: "Planet", sign: "Sign", house: "House", retro: "retrograde", aspects: "Aspects",
    pillarYear: "Year", pillarMonth: "Month", pillarDay: "Day", pillarHour: "Hour", dayMaster: "Day master", elements: "Element balance", strength: "Strength", favorable: "Favourable", unfavorable: "Unfavourable", luckPillars: "Luck pillars",
    expression: "Expression", soulUrge: "Soul urge", personality: "Personality", birthday: "Birthday", maturity: "Maturity", personalYear: "Personal year",
    goodDaysTitle: "Good days this month", wedding: "Wedding", opening: "Opening", travel: "Travel", contract: "Contract", moving: "Moving", general: "General", noGoodDays: "No suitable day (days clashing with your year removed).",
    settings: "Settings", language: "Language", editProfile: "Edit profile", resetProfile: "Delete profile from device", licenses: "Data sources & licenses", disclaimer: "For reflection and entertainment only; not a substitute for medical, legal or financial advice.",
  },
} as const;

export type Key = keyof typeof dict.en;
export function makeT(locale: Locale) {
  return (k: Key): string => dict[locale][k] ?? dict.en[k];
}
export function detectLocale(tag: string | undefined): Locale {
  return tag?.toLowerCase().startsWith("vi") ? "vi" : "en";
}
