/** Thiên can / Địa chi (Heavenly Stems / Earthly Branches) – 1-based like lasotuvi. */
import { jdFromDate } from "./hnd.js";

export const CAN = ["", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"] as const;
export const CHI = ["", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"] as const;
export const CHI_ANIMAL_EN = ["", "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"] as const;

export type Element = "Kim" | "Mộc" | "Thủy" | "Hỏa" | "Thổ";
export const ELEMENT_EN: Record<Element, string> = { Kim: "Metal", Mộc: "Wood", Thủy: "Water", Hỏa: "Fire", Thổ: "Earth" };

/** Element of each stem (index 1..10). */
export const CAN_ELEMENT: readonly (Element | "")[] = ["", "Mộc", "Mộc", "Hỏa", "Hỏa", "Thổ", "Thổ", "Kim", "Kim", "Thủy", "Thủy"];
/** Element of each branch (index 1..12). */
export const CHI_ELEMENT: readonly (Element | "")[] = ["", "Thủy", "Thổ", "Mộc", "Mộc", "Thổ", "Hỏa", "Hỏa", "Thổ", "Kim", "Kim", "Thổ", "Thủy"];

export interface GanZhi {
  can: number; // 1..10
  chi: number; // 1..12
  name: string; // "Giáp Tý"
}

export function ganZhi(can: number, chi: number): GanZhi {
  return { can, chi, name: `${CAN[can]} ${CHI[chi]}` };
}

/** Stem/branch of a lunar year. */
export function yearGanZhi(lunarYear: number): GanZhi {
  return ganZhi(((lunarYear + 6) % 10) + 1, ((lunarYear + 8) % 12) + 1);
}

/** Stem of a lunar month (branch = month index: tháng Giêng = Dần = 3). */
export function monthGanZhi(lunarYear: number, lunarMonth: number): GanZhi {
  const can = ((lunarYear * 12 + lunarMonth + 3) % 10) + 1;
  const chi = ((lunarMonth + 1) % 12) + 1;
  return ganZhi(can, chi);
}

/** Stem/branch of a solar day (independent of lunar month). */
export function dayGanZhi(dd: number, mm: number, yy: number): GanZhi {
  const jd = jdFromDate(dd, mm, yy);
  return ganZhi(((jd + 9) % 10) + 1, ((jd + 1) % 12) + 1);
}

/** Stem of the hour given the day stem and the hour branch (1 = Tý). */
export function hourGanZhi(dayCan: number, hourChi: number): GanZhi {
  const can = (((dayCan - 1) % 5) * 2 + hourChi - 1) % 10 + 1;
  return ganZhi(can, hourChi);
}

/** 24h clock hour → canh giờ (1 = Tý 23:00–00:59, 2 = Sửu 01:00–02:59 …). */
export function hourToBranch(hour24: number): number {
  const h = ((hour24 % 24) + 24) % 24;
  return (Math.floor((h + 1) / 2) % 12) + 1;
}

/** Nạp âm (sixty-cycle sound element) of a stem/branch pair. */
const NAP_AM: Record<string, { element: Element; vi: string; en: string }> = {
  K1: { element: "Kim", vi: "Hải Trung Kim", en: "Gold in the Sea" },
  T1: { element: "Thủy", vi: "Giản Hạ Thủy", en: "Water of the Stream" },
  H1: { element: "Hỏa", vi: "Tích Lịch Hỏa", en: "Thunderbolt Fire" },
  O1: { element: "Thổ", vi: "Bích Thượng Thổ", en: "Earth on the Wall" },
  M1: { element: "Mộc", vi: "Tang Đố Mộc", en: "Mulberry Wood" },
  T2: { element: "Thủy", vi: "Đại Khê Thủy", en: "Water of the Great Stream" },
  H2: { element: "Hỏa", vi: "Lư Trung Hỏa", en: "Fire in the Furnace" },
  O2: { element: "Thổ", vi: "Thành Đầu Thổ", en: "Earth of the City Wall" },
  M2: { element: "Mộc", vi: "Tùng Bách Mộc", en: "Pine and Cypress Wood" },
  K2: { element: "Kim", vi: "Kim Bạch Kim", en: "Gold Foil" },
  H3: { element: "Hỏa", vi: "Phú Đăng Hỏa", en: "Lamp Fire" },
  O3: { element: "Thổ", vi: "Sa Trung Thổ", en: "Earth in the Sand" },
  M3: { element: "Mộc", vi: "Đại Lâm Mộc", en: "Wood of the Great Forest" },
  K3: { element: "Kim", vi: "Bạch Lạp Kim", en: "White Wax Gold" },
  T3: { element: "Thủy", vi: "Trường Lưu Thủy", en: "Long-flowing Water" },
  K4: { element: "Kim", vi: "Sa Trung Kim", en: "Gold in the Sand" },
  T4: { element: "Thủy", vi: "Thiên Hà Thủy", en: "Water of the Milky Way" },
  H4: { element: "Hỏa", vi: "Thiên Thượng Hỏa", en: "Fire of the Heavens" },
  O4: { element: "Thổ", vi: "Lộ Bàng Thổ", en: "Earth by the Roadside" },
  M4: { element: "Mộc", vi: "Dương Liễu Mộc", en: "Willow Wood" },
  T5: { element: "Thủy", vi: "Tuyền Trung Thủy", en: "Spring Water" },
  H5: { element: "Hỏa", vi: "Sơn Hạ Hỏa", en: "Fire at the Foot of the Mountain" },
  O5: { element: "Thổ", vi: "Đại Trạch Thổ", en: "Earth of the Great Marsh" },
  M5: { element: "Mộc", vi: "Thạch Lựu Mộc", en: "Pomegranate Wood" },
  K5: { element: "Kim", vi: "Kiếm Phong Kim", en: "Sword-edge Gold" },
  H6: { element: "Hỏa", vi: "Sơn Đầu Hỏa", en: "Fire on the Mountain Top" },
  O6: { element: "Thổ", vi: "Ốc Thượng Thổ", en: "Earth on the Roof" },
  M6: { element: "Mộc", vi: "Bình Địa Mộc", en: "Wood of the Plain" },
  K6: { element: "Kim", vi: "Thoa Xuyến Kim", en: "Jewellery Gold" },
  T6: { element: "Thủy", vi: "Đại Hải Thủy", en: "Water of the Great Sea" },
};

// rows = chi 1..12, cols = can 1..10 (false = impossible pairing)
const NAP_AM_MATRIX: readonly (readonly (string | false)[])[] = [
  [],
  ["", "K1", false, "T1", false, "H1", false, "O1", false, "M1", false],
  ["", false, "K1", false, "T1", false, "H1", false, "O1", false, "M1"],
  ["", "T2", false, "H2", false, "O2", false, "M2", false, "K2", false],
  ["", false, "T2", false, "H2", false, "O2", false, "M2", false, "K2"],
  ["", "H3", false, "O3", false, "M3", false, "K3", false, "T3", false],
  ["", false, "H3", false, "O3", false, "M3", false, "K3", false, "T3"],
  ["", "K4", false, "T4", false, "H4", false, "O4", false, "M4", false],
  ["", false, "K4", false, "T4", false, "H4", false, "O4", false, "M4"],
  ["", "T5", false, "H5", false, "O5", false, "M5", false, "K5", false],
  ["", false, "T5", false, "H5", false, "O5", false, "M5", false, "K5"],
  ["", "H6", false, "O6", false, "M6", false, "K6", false, "T6", false],
  ["", false, "H6", false, "O6", false, "M6", false, "K6", false, "T6"],
];

export function napAm(can: number, chi: number): { element: Element; vi: string; en: string } {
  const key = NAP_AM_MATRIX[chi]?.[can];
  if (!key) throw new Error(`Invalid can/chi pairing ${can}/${chi}`);
  const v = NAP_AM[key];
  if (!v) throw new Error(`Unknown nạp âm ${key}`);
  return v;
}

/** Five-element relationship: 1 = a generates b, -1 = a controls b, 2 = b generates a, -2 = b controls a, 0 = same. */
export function elementRelation(a: Element, b: Element): 1 | -1 | 2 | -2 | 0 {
  const order: Element[] = ["Mộc", "Hỏa", "Thổ", "Kim", "Thủy"]; // generating cycle
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  const d = (ib - ia + 5) % 5;
  if (d === 0) return 0;
  if (d === 1) return 1; // a sinh b
  if (d === 4) return 2; // b sinh a
  if (d === 2) return -1; // a khắc b
  return -2; // b khắc a
}
