/**
 * Tử Vi Đẩu Số chart (an sao) – TypeScript port of doanguyen/lasotuvi (MIT).
 * Palace positions are 1..12 = Tý..Hợi, like the original.
 */
import { solarToLunar } from "../lunar/hnd.js";
import { CAN, CHI, dayGanZhi, hourGanZhi, monthGanZhi, napAm, yearGanZhi, elementRelation, type Element } from "../lunar/ganzhi.js";
import { BRIGHTNESS, STARS, ELEMENT_OF_CODE, type Brightness, type StarDef } from "./stars.js";

export type Gender = "male" | "female";

export interface TuViInput {
  day: number;
  month: number;
  year: number;
  /** true when day/month/year is a solar (Gregorian) date */
  solar: boolean;
  /** leap lunar month, only meaningful when solar=false */
  leapMonth?: boolean;
  /** 1..12 = Tý..Hợi */
  hourBranch: number;
  gender: Gender;
  /** 7 for Vietnam, 8 for China */
  timeZone?: number;
}

export interface PlacedStar {
  id: number;
  name: string;
  element: Element;
  kind: number;
  brightness: Brightness | null;
}

export interface Palace {
  /** 1..12 = Tý..Hợi */
  position: number;
  branch: string;
  /** Mệnh, Phụ mẫu, … */
  name: string;
  stars: PlacedStar[];
  daiHan: number;
  tieuHan: string;
  isThan: boolean;
  tuan: boolean;
  triet: boolean;
}

export interface TuViChart {
  lunar: { day: number; month: number; year: number; leap: boolean };
  year: { can: string; chi: string; canIdx: number; chiIdx: number };
  month: { can: string; chi: string };
  day: { can: string; chi: string };
  hour: { can: string; chi: string };
  yinYang: "Dương" | "Âm";
  gender: Gender;
  amDuongMenh: "thuận lý" | "nghịch lý";
  cungMenh: number;
  cungThan: number;
  cuc: { element: Element; number: number; name: string };
  menh: { element: Element; napAm: string; napAmEn: string };
  menhChu: string;
  thanChu: string;
  menhCucRelation: string;
  palaces: Palace[];
}

const PALACE_NAMES = ["Mệnh", "Phụ mẫu", "Phúc đức", "Điền trạch", "Quan lộc", "Nô bộc", "Thiên di", "Tật ách", "Tài bạch", "Tử tức", "Phu thê", "Huynh đệ"] as const;
const PALACE_ELEMENT: Element[] = ["Thủy", "Thủy", "Thổ", "Mộc", "Mộc", "Thổ", "Hỏa", "Hỏa", "Thổ", "Kim", "Kim", "Thổ", "Thủy"];
const CAN_POSITION = [0, 3, 4, 6, 7, 6, 7, 9, 10, 12, 1] as const; // Lộc tồn position by year stem
const CAN_YINYANG = [0, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1] as const;
const CHI_YINYANG = [0, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1] as const;
const MENH_CHU = ["", "Tham lang", "Cự môn", "Lộc tồn", "Văn khúc", "Liêm trinh", "Vũ khúc", "Phá quân", "Vũ khúc", "Liêm trinh", "Văn khúc", "Lộc tồn", "Cự môn"] as const;
const THAN_CHU = ["", "Linh tinh", "Thiên tướng", "Thiên lương", "Thiên đồng", "Văn xương", "Thiên cơ", "Hỏa tinh", "Thiên tướng", "Thiên lương", "Thiên đồng", "Văn xương", "Thiên cơ"] as const;
const CUC_NUMBER: Record<Element, number> = { Kim: 4, Mộc: 3, Thủy: 2, Hỏa: 6, Thổ: 5 };
const CUC_NAME: Record<Element, string> = { Kim: "Kim tứ Cục", Mộc: "Mộc tam Cục", Thủy: "Thủy nhị Cục", Hỏa: "Hỏa lục Cục", Thổ: "Thổ ngũ Cục" };

export function shift(start: number, ...steps: number[]): number {
  let p = start;
  for (const s of steps) p += s;
  const m = ((p % 12) + 12) % 12;
  return m === 0 ? 12 : m;
}

function distance(a: number, b: number, direction: 1 | -1): number {
  return direction === 1 ? (a - b + 12) % 12 : (b - a + 12) % 12;
}

/** Element of the Cục from the Mệnh palace position and year stem (nạp âm of the Mệnh palace's stem/branch). */
function findCuc(cungMenh: number, canNam: number): Element {
  const canThangGieng = (canNam * 2 + 1) % 10;
  let canThangMenh = (((cungMenh - 3) % 12 + 12) % 12 + canThangGieng) % 10;
  if (canThangMenh === 0) canThangMenh = 10;
  return napAm(canThangMenh, cungMenh).element;
}

function findTuVi(cuc: number, lunarDay: number): number {
  let cungDan = 3;
  let c = cuc;
  while (c < lunarDay) {
    c += cuc;
    cungDan += 1;
  }
  let diff = c - lunarDay;
  if (diff % 2 === 1) diff = -diff;
  return shift(cungDan, diff);
}

function findTrangSinh(cuc: number): number {
  if (cuc === 6) return 3;
  if (cuc === 4) return 6;
  if (cuc === 2 || cuc === 5) return 9;
  return 12; // 3
}

function findHoaLinh(chiNam: number, hour: number, dir: number): [number, number] {
  let h: number, l: number;
  if ([3, 7, 11].includes(chiNam)) { h = 2; l = 4; }
  else if ([1, 5, 9].includes(chiNam)) { h = 3; l = 11; }
  else if ([6, 10, 2].includes(chiNam)) { h = 11; l = 4; }
  else { h = 10; l = 11; }
  if (dir === -1) return [shift(h + 1, -hour), shift(l - 1, hour)];
  return [shift(h - 1, hour), shift(l + 1, -hour)];
}

const KHOI = [0, 2, 1, 12, 10, 8, 1, 8, 7, 6, 4] as const;
const THIEN_QUAN = [0, 8, 5, 6, 3, 4, 10, 12, 10, 11, 7] as const;
const THIEN_PHUC = [0, 10, 9, 1, 12, 4, 3, 7, 6, 7, 6] as const;
const LUU_HA = [0, 10, 11, 8, 5, 6, 7, 9, 4, 12, 3] as const;
const THIEN_TRU = [0, 6, 7, 1, 6, 7, 9, 3, 7, 10, 11] as const;

function findCoThan(chiNam: number): number {
  if ([12, 1, 2].includes(chiNam)) return 3;
  if ([3, 4, 5].includes(chiNam)) return 6;
  if ([6, 7, 8].includes(chiNam)) return 9;
  return 12;
}
function findThienMa(chiNam: number): number {
  const r = chiNam % 4;
  return r === 1 ? 3 : r === 2 ? 12 : r === 3 ? 9 : 6;
}
function findPhaToai(chiNam: number): number {
  const r = chiNam % 3;
  return r === 0 ? 6 : r === 1 ? 10 : 2;
}
function findTriet(canNam: number): [number, number] {
  if ([1, 6].includes(canNam)) return [9, 10];
  if ([2, 7].includes(canNam)) return [7, 8];
  if ([3, 8].includes(canNam)) return [5, 6];
  if ([4, 9].includes(canNam)) return [3, 4];
  return [1, 2];
}

export function buildTuViChart(input: TuViInput): TuViChart {
  const tz = input.timeZone ?? 7;
  const gender: 1 | -1 = input.gender === "male" ? 1 : -1;
  const hour = input.hourBranch;
  if (hour < 1 || hour > 12) throw new Error("hourBranch must be 1..12");

  let lunar: { day: number; month: number; year: number; leap: boolean };
  let solarDate = { day: input.day, month: input.month, year: input.year };
  if (input.solar) {
    const l = solarToLunar(input.day, input.month, input.year, tz);
    lunar = { day: l.day, month: l.month, year: l.year, leap: l.leap };
  } else {
    lunar = { day: input.day, month: input.month, year: input.year, leap: input.leapMonth ?? false };
    // find solar date for the day stem; fall back to the non-leap month if leap does not exist
    const { lunarToSolar } = require_hnd();
    const s = lunarToSolar(input.day, input.month, input.year, lunar.leap, tz) ?? lunarToSolar(input.day, input.month, input.year, false, tz);
    if (!s) throw new Error("Invalid lunar date");
    solarDate = s;
  }
  const nn = lunar.day, tt = lunar.month;
  const yGZ = yearGanZhi(lunar.year);
  const mGZ = monthGanZhi(lunar.year, lunar.month);
  const dGZ = dayGanZhi(solarDate.day, solarDate.month, solarDate.year);
  const hGZ = hourGanZhi(dGZ.can, hour);
  const canNam = yGZ.can, chiNam = yGZ.chi;

  // palaces
  const palaces: Palace[] = Array.from({ length: 13 }, (_, i) => ({
    position: i, branch: CHI[i] ?? "", name: "", stars: [], daiHan: 0, tieuHan: "", isThan: false, tuan: false, triet: false,
  }));
  const cungThan = shift(3, tt - 1, hour - 1);
  const cungMenh = shift(3, tt - 1, -(hour) + 1);
  PALACE_NAMES.forEach((name, i) => { palaces[shift(cungMenh, i)]!.name = name; });
  const cungNoBoc = shift(cungMenh, 5);
  const cungTatAch = shift(cungMenh, 7);
  palaces[cungThan]!.isThan = true;

  const amDuongNamSinh = CAN_YINYANG[canNam] as 1 | -1;
  const amDuongChiNam = CHI_YINYANG[chiNam] as 1 | -1;
  const cucElement = findCuc(cungMenh, canNam);
  const cucSo = CUC_NUMBER[cucElement];

  // Đại hạn: Dương nam / Âm nữ thuận, Âm nam / Dương nữ nghịch
  const dirDaiHan = (gender * amDuongChiNam) as 1 | -1;
  for (let i = 1; i <= 12; i++) palaces[i]!.daiHan = cucSo + distance(i, cungMenh, dirDaiHan) * 10;
  // Tiểu hạn
  const khoiHan = shift(11, -3 * (chiNam - 1));
  const viTriTy = shift(khoiHan, -gender * (chiNam - 1));
  for (let i = 1; i <= 12; i++) palaces[i]!.tieuHan = CHI[distance(i, viTriTy, gender) + 1] ?? "";

  const place = (pos: number, ...stars: StarDef[]) => {
    for (const s of stars) {
      const row = BRIGHTNESS[s.id];
      const b = row ? row[pos] ?? null : null;
      palaces[pos]!.stars.push({ id: s.id, name: s.name, element: ELEMENT_OF_CODE[s.element], kind: s.kind, brightness: b });
    }
  };

  // Tử vi tinh hệ
  const pTuVi = findTuVi(cucSo, nn); place(pTuVi, STARS.TuVi);
  const pLiemTrinh = shift(pTuVi, 4); place(pLiemTrinh, STARS.LiemTrinh);
  const pThienDong = shift(pTuVi, 7); place(pThienDong, STARS.ThienDong);
  const pVuKhuc = shift(pTuVi, 8); place(pVuKhuc, STARS.VuKhuc);
  const pThaiDuong = shift(pTuVi, 9); place(pThaiDuong, STARS.ThaiDuong);
  const pThienCo = shift(pTuVi, 11); place(pThienCo, STARS.ThienCo);
  // Thiên phủ tinh hệ
  const pThienPhu = shift(3, 3 - pTuVi); place(pThienPhu, STARS.ThienPhu);
  const pThaiAm = shift(pThienPhu, 1); place(pThaiAm, STARS.ThaiAm);
  const pThamLang = shift(pThienPhu, 2); place(pThamLang, STARS.ThamLang);
  const pCuMon = shift(pThienPhu, 3); place(pCuMon, STARS.CuMon);
  const pThienTuong = shift(pThienPhu, 4); place(pThienTuong, STARS.ThienTuong);
  const pThienLuong = shift(pThienPhu, 5); place(pThienLuong, STARS.ThienLuong);
  const pThatSat = shift(pThienPhu, 6); place(pThatSat, STARS.ThatSat);
  const pPhaQuan = shift(pThienPhu, 10); place(pPhaQuan, STARS.PhaQuan);
  // Vòng Lộc tồn
  const pLocTon = CAN_POSITION[canNam]!; place(pLocTon, STARS.LocTon, STARS.BacSy);
  const amDuongNamNu = gender * amDuongNamSinh;
  const locTonRing = [STARS.LucSi, STARS.ThanhLong, STARS.TieuHao, STARS.TuongQuan, STARS.TauThu, STARS.PhiLiem, STARS.HyThan, STARS.BenhPhu, STARS.DaiHao, STARS.PhucBinh, STARS.QuanPhu2];
  locTonRing.forEach((s, i) => place(shift(pLocTon, (i + 1) * amDuongNamNu), s));
  // Vòng Thái tuế
  const pThaiTue = chiNam; place(pThaiTue, STARS.ThaiTue);
  place(shift(pThaiTue, 1), STARS.ThieuDuong, STARS.ThienKhong);
  place(shift(pThaiTue, 2), STARS.TangMon);
  place(shift(pThaiTue, 3), STARS.ThieuAm);
  place(shift(pThaiTue, 4), STARS.QuanPhu3);
  place(shift(pThaiTue, 5), STARS.TuPhu, STARS.NguyetDuc);
  place(shift(pThaiTue, 6), STARS.TuePha);
  place(shift(pThaiTue, 7), STARS.LongDuc);
  place(shift(pThaiTue, 8), STARS.BachHo);
  place(shift(pThaiTue, 9), STARS.PhucDuc, STARS.ThienDuc);
  place(shift(pThaiTue, 10), STARS.DieuKhach);
  place(shift(pThaiTue, 11), STARS.TrucPhu);
  // Vòng Tràng sinh
  const pTrangSinh = findTrangSinh(cucSo); place(pTrangSinh, STARS.TrangSinh);
  [STARS.MocDuc, STARS.QuanDoi, STARS.LamQuan, STARS.DeVuong, STARS.Suy, STARS.Benh, STARS.Tu, STARS.Mo, STARS.Tuyet].forEach((s, i) => place(shift(pTrangSinh, amDuongNamNu * (i + 1)), s));
  place(shift(pTrangSinh, -amDuongNamNu), STARS.Thai);
  place(shift(pTrangSinh, -2 * amDuongNamNu), STARS.Duong);
  // Kình Đà
  place(shift(pLocTon, -1), STARS.DaLa);
  const pKinhDuong = shift(pLocTon, 1); place(pKinhDuong, STARS.KinhDuong);
  // Không Kiếp
  const pDiaKiep = shift(11, hour); place(pDiaKiep, STARS.DiaKiep);
  place(shift(12, 12 - pDiaKiep), STARS.DiaKhong);
  // Hỏa Linh
  const [pHoa, pLinh] = findHoaLinh(chiNam, hour, gender * amDuongNamSinh);
  place(pHoa, STARS.HoaTinh); place(pLinh, STARS.LinhTinh);
  // Long Phượng
  const pLongTri = shift(5, chiNam - 1); place(pLongTri, STARS.LongTri);
  place(shift(2, 2 - pLongTri), STARS.PhuongCac, STARS.GiaiThan);
  // Tả Hữu
  const pTaPhu = shift(5, tt - 1); place(pTaPhu, STARS.TaPhu);
  place(shift(2, 2 - pTaPhu), STARS.HuuBat);
  // Xương Khúc
  const pVanKhuc = shift(5, hour - 1); place(pVanKhuc, STARS.VanKhuc);
  const pVanXuong = shift(2, 2 - pVanKhuc); place(pVanXuong, STARS.VanXuong);
  // Thai Tọa
  const pTamThai = shift(5, tt + nn - 2); place(pTamThai, STARS.TamThai);
  place(shift(2, 2 - pTamThai), STARS.BatToa);
  // Quang Quý
  const pAnQuang = shift(pVanXuong, nn - 2); place(pAnQuang, STARS.AnQuang);
  place(shift(2, 2 - pAnQuang), STARS.ThienQuy);
  // Khôi Việt
  const pKhoi = KHOI[canNam]!; place(pKhoi, STARS.ThienKhoi);
  place(shift(5, 5 - pKhoi), STARS.ThienViet);
  // Khốc Hư
  place(shift(7, chiNam - 1), STARS.ThienHu);
  place(shift(7, -chiNam + 1), STARS.ThienKhoc);
  // Tài Thọ
  place(shift(cungMenh, chiNam - 1), STARS.ThienTai);
  place(shift(cungThan, chiNam - 1), STARS.ThienTho);
  // Hồng Hỷ
  const pHongLoan = shift(4, -chiNam + 1); place(pHongLoan, STARS.HongLoan);
  place(shift(pHongLoan, 6), STARS.ThienHy);
  // Quan Phúc
  place(THIEN_QUAN[canNam]!, STARS.ThienQuan);
  place(THIEN_PHUC[canNam]!, STARS.ThienPhuc);
  // Hình Riêu Y
  const pThienHinh = shift(10, tt - 1); place(pThienHinh, STARS.ThienHinh);
  place(shift(pThienHinh, 4), STARS.ThienRieu, STARS.ThienY);
  // Cô Quả
  const pCoThan = findCoThan(chiNam); place(pCoThan, STARS.CoThan);
  place(shift(pCoThan, -4), STARS.QuaTu);
  // Văn tinh, Đường phù, Quốc ấn
  const pVanTinh = shift(pKinhDuong, 2); place(pVanTinh, STARS.VanTinh);
  const pDuongPhu = shift(pVanTinh, 2); place(pDuongPhu, STARS.DuongPhu);
  place(shift(pDuongPhu, 3), STARS.QuocAn);
  // Thai phụ, Phong cáo
  place(shift(pVanKhuc, 2), STARS.ThaiPhu);
  place(shift(pVanKhuc, -2), STARS.PhongCao);
  // Thiên giải, Địa giải
  place(shift(9, 2 * tt - 2), STARS.ThienGiai);
  place(shift(pTaPhu, 3), STARS.DiaGiai);
  // La Võng, Thương Sứ
  place(5, STARS.ThienLa); place(11, STARS.DiaVong);
  place(cungNoBoc, STARS.ThienThuong); place(cungTatAch, STARS.ThienSu);
  // Vòng Thiên mã
  const pThienMa = findThienMa(chiNam); place(pThienMa, STARS.ThienMa);
  place(shift(pThienMa, 2), STARS.HoaCai);
  const pKiepSat = shift(pThienMa, 3); place(pKiepSat, STARS.KiepSat);
  place(shift(pKiepSat, 4), STARS.DaoHoa);
  // Phá toái, Đẩu quân
  place(findPhaToai(chiNam), STARS.PhaToai);
  place(shift(chiNam, -tt + hour), STARS.DauQuan);
  // Tứ hóa (theo can năm)
  const TU_HOA: Record<number, [number, number, number, number]> = {
    1: [pLiemTrinh, pPhaQuan, pVuKhuc, pThaiDuong],
    2: [pThienCo, pThienLuong, pTuVi, pThaiAm],
    3: [pThienDong, pThienCo, pVanXuong, pLiemTrinh],
    4: [pThaiAm, pThienDong, pThienCo, pCuMon],
    5: [pThamLang, pThaiAm, shift(2, 2 - pTaPhu), pThienCo],
    6: [pVuKhuc, pThamLang, pThienLuong, pVanKhuc],
    7: [pThaiDuong, pVuKhuc, pThienDong, pThaiAm],
    8: [pCuMon, pThaiDuong, pVanKhuc, pVanXuong],
    9: [pThienLuong, pTuVi, pThienPhu, pVuKhuc],
    10: [pPhaQuan, pCuMon, pThaiAm, pThamLang],
  };
  const [hLoc, hQuyen, hKhoa, hKy] = TU_HOA[canNam]!;
  place(hLoc, STARS.HoaLoc); place(hQuyen, STARS.HoaQuyen); place(hKhoa, STARS.HoaKhoa); place(hKy, STARS.HoaKy);
  // Lưu hà, Thiên trù
  place(LUU_HA[canNam]!, STARS.LuuHa); place(THIEN_TRU[canNam]!, STARS.ThienTru);
  // Tuần, Triệt
  const ketThucTuan = shift(chiNam, 10 - canNam);
  const t1 = shift(ketThucTuan, 1);
  palaces[t1]!.tuan = true; palaces[shift(t1, 1)]!.tuan = true;
  const [tr1, tr2] = findTriet(canNam);
  palaces[tr1]!.triet = true; palaces[tr2]!.triet = true;

  // Thiên bàn
  const menhNapAm = napAm(canNam, chiNam);
  const cungAmDuong = cungMenh % 2 === 1 ? 1 : -1;
  const rel = elementRelation(menhNapAm.element, cucElement);
  const relText = rel === 1 ? "Bản Mệnh sinh Cục" : rel === -1 ? "Bản Mệnh khắc Cục" : rel === 2 ? "Cục sinh Bản Mệnh" : rel === -2 ? "Cục khắc Bản Mệnh" : "Cục hòa Bản Mệnh";

  return {
    lunar,
    year: { can: CAN[canNam] ?? "", chi: CHI[chiNam] ?? "", canIdx: canNam, chiIdx: chiNam },
    month: { can: CAN[mGZ.can] ?? "", chi: CHI[mGZ.chi] ?? "" },
    day: { can: CAN[dGZ.can] ?? "", chi: CHI[dGZ.chi] ?? "" },
    hour: { can: CAN[hGZ.can] ?? "", chi: CHI[hGZ.chi] ?? "" },
    yinYang: chiNam % 2 === 1 ? "Dương" : "Âm",
    gender: input.gender,
    amDuongMenh: cungAmDuong * gender === 1 ? "thuận lý" : "nghịch lý",
    cungMenh,
    cungThan,
    cuc: { element: cucElement, number: cucSo, name: CUC_NAME[cucElement] },
    menh: { element: menhNapAm.element, napAm: menhNapAm.vi, napAmEn: menhNapAm.en },
    menhChu: MENH_CHU[canNam] ?? "",
    thanChu: THAN_CHU[canNam] ?? "",
    menhCucRelation: relText,
    palaces: palaces.slice(1),
  };
}

// lazy import to keep hnd tree-shakeable in bundlers that dislike cycles
import * as hnd from "../lunar/hnd.js";
function require_hnd() { return hnd; }

export { PALACE_NAMES, PALACE_ELEMENT };
