/**
 * Day almanac (ngày tốt/xấu) built on lunar-javascript (MIT). Everything here depends only on the
 * solar date (day stem/branch, solar terms), so the UTC+7/UTC+8 lunar-month difference does not affect it.
 */
import { Solar } from "lunar-javascript";
import { dayGanZhi, CHI, CHI_ELEMENT, type Element } from "./ganzhi.js";
import { solarToLunar } from "./hnd.js";

/** Chinese → Vietnamese names for the 12 day-officers (12 trực). */
const ZHI_XING_VI: Record<string, string> = { 建: "Kiến", 除: "Trừ", 满: "Mãn", 平: "Bình", 定: "Định", 执: "Chấp", 破: "Phá", 危: "Nguy", 成: "Thành", 收: "Thu", 开: "Khai", 闭: "Bế" };
const TIAN_SHEN_VI: Record<string, string> = { 青龙: "Thanh Long", 明堂: "Minh Đường", 金匮: "Kim Quỹ", 天德: "Thiên Đức", 玉堂: "Ngọc Đường", 司命: "Tư Mệnh", 天刑: "Thiên Hình", 朱雀: "Chu Tước", 白虎: "Bạch Hổ", 天牢: "Thiên Lao", 玄武: "Huyền Vũ", 勾陈: "Câu Trần" };
const XIU_VI: Record<string, string> = { 角: "Giác", 亢: "Cang", 氐: "Đê", 房: "Phòng", 心: "Tâm", 尾: "Vĩ", 箕: "Cơ", 斗: "Đẩu", 牛: "Ngưu", 女: "Nữ", 虚: "Hư", 危: "Nguy", 室: "Thất", 壁: "Bích", 奎: "Khuê", 娄: "Lâu", 胃: "Vị", 昴: "Mão", 毕: "Tất", 觜: "Chủy", 参: "Sâm", 井: "Tỉnh", 鬼: "Quỷ", 柳: "Liễu", 星: "Tinh", 张: "Trương", 翼: "Dực", 轸: "Chẩn" };
const DIRECTION_VI: Record<string, string> = { 正东: "Chính Đông", 正南: "Chính Nam", 正西: "Chính Tây", 正北: "Chính Bắc", 东北: "Đông Bắc", 东南: "Đông Nam", 西北: "Tây Bắc", 西南: "Tây Nam" };

export interface DayAlmanac {
  solar: { day: number; month: number; year: number };
  lunarVN: { day: number; month: number; year: number; leap: boolean };
  dayGanZhi: string;
  dayElement: Element;
  /** Hoàng đạo (auspicious) or Hắc đạo */
  hoangDao: boolean;
  tianShen: { zh: string; vi: string };
  truc: { zh: string; vi: string };
  xiu: { zh: string; vi: string; luck: "吉" | "凶" | string };
  /** branch (1..12) this day clashes with – people born in that branch year should avoid big events */
  clashBranch: number;
  clashBranchName: string;
  luckyDirections: { wealth: string; joy: string; fortune: string };
  /** hours (branch 1..12) that are hoàng đạo */
  goodHours: number[];
  solarTerm: string | null;
  /** 0..100 composite score for the daily card */
  score: number;
}

const HOANG_DAO = new Set(["青龙", "明堂", "金匮", "天德", "玉堂", "司命"]);

export function dayAlmanac(day: number, month: number, year: number): DayAlmanac {
  const s = Solar.fromYmd(year, month, day);
  const l = s.getLunar();
  const gz = dayGanZhi(day, month, year);
  const tianShen = l.getDayTianShen();
  const truc = l.getZhiXing();
  const xiu = l.getXiu();
  const hd = HOANG_DAO.has(tianShen);
  // clash: day branch + 6
  const clash = ((gz.chi + 5) % 12) + 1;
  const goodHours = l.getTimes().slice(0, 12).map((t, i) => ({ i, luck: t.getTianShenLuck() })).filter((t) => t.luck === "吉").map((t) => t.i + 1);
  const trucScore: Record<string, number> = { 建: 60, 除: 70, 满: 65, 平: 60, 定: 75, 执: 55, 破: 20, 危: 30, 成: 85, 收: 65, 开: 80, 闭: 35 };
  const xiuLuck = l.getXiuLuck();
  const score = Math.round(0.45 * (hd ? 85 : 35) + 0.35 * (trucScore[truc] ?? 50) + 0.2 * (xiuLuck === "吉" ? 80 : 40));
  const jq = l.getJieQi();
  return {
    solar: { day, month, year },
    lunarVN: (() => { const v = solarToLunar(day, month, year, 7); return { day: v.day, month: v.month, year: v.year, leap: v.leap }; })(),
    dayGanZhi: gz.name,
    dayElement: (CHI_ELEMENT[gz.chi] || "Thổ") as Element,
    hoangDao: hd,
    tianShen: { zh: tianShen, vi: TIAN_SHEN_VI[tianShen] ?? tianShen },
    truc: { zh: truc, vi: ZHI_XING_VI[truc] ?? truc },
    xiu: { zh: xiu, vi: XIU_VI[xiu] ?? xiu, luck: xiuLuck },
    clashBranch: clash,
    clashBranchName: CHI[clash] ?? "",
    luckyDirections: {
      wealth: DIRECTION_VI[l.getDayPositionCaiDesc()] ?? l.getDayPositionCaiDesc(),
      joy: DIRECTION_VI[l.getDayPositionXiDesc()] ?? l.getDayPositionXiDesc(),
      fortune: DIRECTION_VI[l.getDayPositionFuDesc()] ?? l.getDayPositionFuDesc(),
    },
    goodHours: [...new Set(goodHours)].sort((a, b) => a - b),
    solarTerm: jq || null,
    score,
  };
}

export type EventKind = "wedding" | "opening" | "travel" | "contract" | "moving" | "general";
const EVENT_TRUC: Record<EventKind, Set<string>> = {
  wedding: new Set(["定", "成", "开", "满"]), opening: new Set(["开", "成", "定", "建"]), travel: new Set(["开", "除", "成", "建"]),
  contract: new Set(["定", "成", "开"]), moving: new Set(["定", "成", "开", "除"]), general: new Set(["定", "成", "开", "除", "满", "建", "收"]),
};

/** Good days in a month for an event, excluding days that clash with the person's year branch. */
export function goodDays(year: number, month: number, event: EventKind, personYearBranch?: number): DayAlmanac[] {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const out: DayAlmanac[] = [];
  for (let d = 1; d <= days; d++) {
    const a = dayAlmanac(d, month, year);
    if (!a.hoangDao) continue;
    if (!EVENT_TRUC[event].has(a.truc.zh)) continue;
    if (personYearBranch && a.clashBranch === personYearBranch) continue;
    out.push(a);
  }
  return out;
}
