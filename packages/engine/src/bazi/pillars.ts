/** Bát tự (Four Pillars) via lunar-javascript EightChar (MIT), with Vietnamese labels. */
import { Solar } from "lunar-javascript";
import type { Element } from "../lunar/ganzhi.js";

const GAN_VI: Record<string, string> = { 甲: "Giáp", 乙: "Ất", 丙: "Bính", 丁: "Đinh", 戊: "Mậu", 己: "Kỷ", 庚: "Canh", 辛: "Tân", 壬: "Nhâm", 癸: "Quý" };
const ZHI_VI: Record<string, string> = { 子: "Tý", 丑: "Sửu", 寅: "Dần", 卯: "Mão", 辰: "Thìn", 巳: "Tỵ", 午: "Ngọ", 未: "Mùi", 申: "Thân", 酉: "Dậu", 戌: "Tuất", 亥: "Hợi" };
const WX_VI: Record<string, Element> = { 金: "Kim", 木: "Mộc", 水: "Thủy", 火: "Hỏa", 土: "Thổ" };
const SHISHEN_VI: Record<string, string> = { 比肩: "Tỷ Kiên", 劫财: "Kiếp Tài", 食神: "Thực Thần", 伤官: "Thương Quan", 偏财: "Thiên Tài", 正财: "Chính Tài", 七杀: "Thất Sát", 正官: "Chính Quan", 偏印: "Thiên Ấn", 正印: "Chính Ấn", 日主: "Nhật Chủ" };
const GAN_WX: Record<string, Element> = { 甲: "Mộc", 乙: "Mộc", 丙: "Hỏa", 丁: "Hỏa", 戊: "Thổ", 己: "Thổ", 庚: "Kim", 辛: "Kim", 壬: "Thủy", 癸: "Thủy" };
const ZHI_WX: Record<string, Element> = { 子: "Thủy", 丑: "Thổ", 寅: "Mộc", 卯: "Mộc", 辰: "Thổ", 巳: "Hỏa", 午: "Hỏa", 未: "Thổ", 申: "Kim", 酉: "Kim", 戌: "Thổ", 亥: "Thủy" };
// hidden stems weights (main, middle, residual)
const HIDDEN: Record<string, [string, number][]> = {
  子: [["癸", 1]], 丑: [["己", 0.6], ["癸", 0.3], ["辛", 0.1]], 寅: [["甲", 0.6], ["丙", 0.3], ["戊", 0.1]], 卯: [["乙", 1]],
  辰: [["戊", 0.6], ["乙", 0.3], ["癸", 0.1]], 巳: [["丙", 0.6], ["庚", 0.3], ["戊", 0.1]], 午: [["丁", 0.7], ["己", 0.3]], 未: [["己", 0.6], ["丁", 0.3], ["乙", 0.1]],
  申: [["庚", 0.6], ["壬", 0.3], ["戊", 0.1]], 酉: [["辛", 1]], 戌: [["戊", 0.6], ["辛", 0.3], ["丁", 0.1]], 亥: [["壬", 0.7], ["甲", 0.3]],
};

export interface Pillar { gan: string; zhi: string; ganVi: string; zhiVi: string; name: string; naYin: string; shiShenGan: string; shiShenZhi: string[]; hiddenGan: string[] }

export interface BaziChart {
  year: Pillar; month: Pillar; day: Pillar; hour: Pillar;
  dayMaster: { gan: string; ganVi: string; element: Element; yinYang: "Dương" | "Âm" };
  /** element strength distribution, sums to 100 */
  elements: Record<Element, number>;
  /** day master strength classification */
  strength: "vượng" | "trung bình" | "nhược";
  favorable: Element[];
  unfavorable: Element[];
  taiYuan: string; mingGong: string; shenGong: string;
  luckPillars: { startAge: number; endAge: number; ganZhi: string }[];
}

export interface BaziInput { year: number; month: number; day: number; hour: number; minute?: number; gender: "male" | "female" }

function pillar(gan: string, zhi: string, naYin: string, shiShenGan: string, shiShenZhi: string[], hidden: string[]): Pillar {
  return { gan, zhi, ganVi: GAN_VI[gan] ?? gan, zhiVi: ZHI_VI[zhi] ?? zhi, name: `${GAN_VI[gan]} ${ZHI_VI[zhi]}`, naYin, shiShenGan: SHISHEN_VI[shiShenGan] ?? shiShenGan, shiShenZhi: shiShenZhi.map((s) => SHISHEN_VI[s] ?? s), hiddenGan: hidden };
}

const GENERATES: Record<Element, Element> = { Mộc: "Hỏa", Hỏa: "Thổ", Thổ: "Kim", Kim: "Thủy", Thủy: "Mộc" };
const CONTROLS: Record<Element, Element> = { Mộc: "Thổ", Thổ: "Thủy", Thủy: "Hỏa", Hỏa: "Kim", Kim: "Mộc" };

export function baziChart(input: BaziInput): BaziChart {
  const solar = Solar.fromYmdHms(input.year, input.month, input.day, input.hour, input.minute ?? 0, 0);
  const ec = solar.getLunar().getEightChar();
  ec.setSect(2); // 23:00–23:59 belongs to the same day (common in VN practice)
  const year = pillar(ec.getYearGan(), ec.getYearZhi(), ec.getYearNaYin(), ec.getYearShiShenGan(), ec.getYearShiShenZhi(), ec.getYearHideGan());
  const month = pillar(ec.getMonthGan(), ec.getMonthZhi(), ec.getMonthNaYin(), ec.getMonthShiShenGan(), ec.getMonthShiShenZhi(), ec.getMonthHideGan());
  const day = pillar(ec.getDayGan(), ec.getDayZhi(), ec.getDayNaYin(), "日主", ec.getDayShiShenZhi(), ec.getDayHideGan());
  const hour = pillar(ec.getTimeGan(), ec.getTimeZhi(), ec.getTimeNaYin(), ec.getTimeShiShenGan(), ec.getTimeShiShenZhi(), ec.getTimeHideGan());

  // element weights: stems 1.0 each (month stem 1.2), branches via hidden stems (month branch ×1.5)
  const counts: Record<Element, number> = { Kim: 0, Mộc: 0, Thủy: 0, Hỏa: 0, Thổ: 0 };
  const add = (gan: string, w: number) => { counts[GAN_WX[gan]!] += w; };
  add(year.gan, 1); add(month.gan, 1.2); add(day.gan, 1); add(hour.gan, 1);
  const addZhi = (zhi: string, w: number) => { for (const [g, f] of HIDDEN[zhi] ?? []) add(g, w * f); };
  addZhi(year.zhi, 1); addZhi(month.zhi, 1.5); addZhi(day.zhi, 1); addZhi(hour.zhi, 1);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const elements = Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, Math.round((v / total) * 100)])) as Record<Element, number>;

  const dm = GAN_WX[day.gan]!;
  const supporter = (Object.keys(GENERATES) as Element[]).find((e) => GENERATES[e] === dm)!; // element that generates DM
  const support = elements[dm] + elements[supporter];
  const strength = support >= 50 ? "vượng" : support >= 35 ? "trung bình" : "nhược";
  const drains: Element[] = [GENERATES[dm], CONTROLS[dm], (Object.keys(CONTROLS) as Element[]).find((e) => CONTROLS[e] === dm)!];
  const favorable = strength === "vượng" ? drains : [dm, supporter];
  const unfavorable = strength === "vượng" ? [dm, supporter] : drains;

  const yun = ec.getYun(input.gender === "male" ? 1 : 0);
  const luckPillars = yun.getDaYun().slice(1, 9).map((d) => ({ startAge: d.getStartAge(), endAge: d.getEndAge(), ganZhi: `${GAN_VI[d.getGanZhi()[0]!]} ${ZHI_VI[d.getGanZhi()[1]!]}` }));

  return {
    year, month, day, hour,
    dayMaster: { gan: day.gan, ganVi: day.ganVi, element: dm, yinYang: "甲丙戊庚壬".includes(day.gan) ? "Dương" : "Âm" },
    elements, strength, favorable, unfavorable,
    taiYuan: ec.getTaiYuan(), mingGong: ec.getMingGong(), shenGong: ec.getShenGong(), luckPillars,
  };
}

export { GAN_VI, ZHI_VI, WX_VI, ZHI_WX };
