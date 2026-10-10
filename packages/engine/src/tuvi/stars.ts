/**
 * Tử Vi star catalogue – ported from doanguyen/lasotuvi (MIT, (c) 2016 doanguyen).
 * kind: 1 chính tinh, 2 phụ tinh, 3 quý, 4 quyền, 5 phúc, 6 văn, 7 đài các, 8 đào hoa,
 *       11 sát, 12 bại, 13 ám, 14 dâm, 15 hình, 16 (trực phù)
 */
import type { Element } from "../lunar/ganzhi.js";

export type StarElementCode = "K" | "M" | "T" | "H" | "O";
export const ELEMENT_OF_CODE: Record<StarElementCode, Element> = { K: "Kim", M: "Mộc", T: "Thủy", H: "Hỏa", O: "Thổ" };

export interface StarDef {
  id: number;
  name: string;
  element: StarElementCode;
  kind: number;
  group?: string;
  yinYang?: 1 | -1 | 0;
  cycleTrangSinh?: boolean;
}

const S = (id: number, name: string, element: StarElementCode, kind = 2, group = "", yinYang: 1 | -1 | 0 = 0, cycleTrangSinh = false): StarDef => {
  const d: StarDef = { id, name, element, kind };
  if (group) d.group = group;
  if (yinYang !== 0) d.yinYang = yinYang;
  if (cycleTrangSinh) d.cycleTrangSinh = true;
  return d;
};

export const STARS = {
  TuVi: S(1, "Tử vi", "O", 1, "Đế tinh", 1),
  LiemTrinh: S(2, "Liêm trinh", "H", 1, "Bắc đẩu tinh", 1),
  ThienDong: S(3, "Thiên đồng", "T", 1, "Bắc đẩu tinh", 1),
  VuKhuc: S(4, "Vũ khúc", "K", 1, "Bắc đẩu tinh", -1),
  ThaiDuong: S(5, "Thái dương", "H", 1, "Nam đẩu tinh", 1),
  ThienCo: S(6, "Thiên cơ", "M", 1, "Nam đẩu tinh", -1),
  ThienPhu: S(7, "Thiên phủ", "O", 1, "Nam đẩu tinh", 1),
  ThaiAm: S(8, "Thái âm", "T", 1, "Bắc đẩu tinh", -1),
  ThamLang: S(9, "Tham lang", "T", 1, "Bắc đẩu tinh", -1),
  CuMon: S(10, "Cự môn", "T", 1, "Bắc đẩu tinh", -1),
  ThienTuong: S(11, "Thiên tướng", "T", 1, "Nam đẩu tinh", 1),
  ThienLuong: S(12, "Thiên lương", "M", 1, "Nam đẩu tinh", -1),
  ThatSat: S(13, "Thất sát", "K", 1, "Nam đẩu tinh", 1),
  PhaQuan: S(14, "Phá quân", "T", 1, "Bắc đẩu tinh", -1),
  ThaiTue: S(15, "Thái tuế", "H", 15),
  ThieuDuong: S(16, "Thiếu dương", "H", 5),
  TangMon: S(17, "Tang môn", "M", 12),
  ThieuAm: S(18, "Thiếu âm", "T", 5),
  QuanPhu3: S(19, "Quan phù", "H", 12),
  TuPhu: S(20, "Tử phù", "K", 12),
  TuePha: S(21, "Tuế phá", "H", 12),
  LongDuc: S(22, "Long đức", "T", 5),
  BachHo: S(23, "Bạch hổ", "K", 12),
  PhucDuc: S(24, "Phúc đức", "O", 5),
  DieuKhach: S(25, "Điếu khách", "H", 12),
  TrucPhu: S(26, "Trực phù", "K", 16),
  LocTon: S(27, "Lộc tồn", "O", 3, "Bắc đẩu tinh"),
  BacSy: S(109, "Bác sỹ", "T", 5),
  LucSi: S(28, "Lực sĩ", "H", 2),
  ThanhLong: S(29, "Thanh long", "T", 5),
  TieuHao: S(30, "Tiểu hao", "H", 12),
  TuongQuan: S(31, "Tướng quân", "M", 4),
  TauThu: S(32, "Tấu thư", "K", 3),
  PhiLiem: S(33, "Phi liêm", "H", 2),
  HyThan: S(34, "Hỷ thần", "H", 5),
  BenhPhu: S(35, "Bệnh phù", "O", 12),
  DaiHao: S(36, "Đại hao", "H", 12),
  PhucBinh: S(37, "Phục binh", "H", 13),
  QuanPhu2: S(38, "Quan phù", "H", 12),
  TrangSinh: S(39, "Tràng sinh", "T", 5, "", 0, true),
  MocDuc: S(40, "Mộc dục", "T", 14, "", 0, true),
  QuanDoi: S(41, "Quan đới", "K", 4, "", 0, true),
  LamQuan: S(42, "Lâm quan", "K", 7, "", 0, true),
  DeVuong: S(43, "Đế vượng", "K", 5, "", 0, true),
  Suy: S(44, "Suy", "T", 12, "", 0, true),
  Benh: S(45, "Bệnh", "H", 12, "", 0, true),
  Tu: S(46, "Tử", "H", 12, "", 0, true),
  Mo: S(47, "Mộ", "O", 2, "", 0, true),
  Tuyet: S(48, "Tuyệt", "O", 12, "", 0, true),
  Thai: S(49, "Thai", "O", 14, "", 0, true),
  Duong: S(50, "Dưỡng", "M", 2, "", 0, true),
  DaLa: S(51, "Đà la", "K", 11),
  KinhDuong: S(52, "Kình dương", "K", 11),
  DiaKhong: S(53, "Địa không", "H", 11),
  DiaKiep: S(54, "Địa kiếp", "H", 11),
  LinhTinh: S(55, "Linh tinh", "H", 11),
  HoaTinh: S(56, "Hỏa tinh", "H", 11),
  VanXuong: S(57, "Văn xương", "K", 6),
  VanKhuc: S(58, "Văn khúc", "T", 6),
  ThienKhoi: S(59, "Thiên khôi", "H", 6),
  ThienViet: S(60, "Thiên việt", "H", 6),
  TaPhu: S(61, "Tả phù", "O", 2),
  HuuBat: S(62, "Hữu bật", "O", 2),
  LongTri: S(63, "Long trì", "T", 3),
  PhuongCac: S(64, "Phượng các", "O", 3),
  TamThai: S(65, "Tam thai", "M", 7),
  BatToa: S(66, "Bát tọa", "T", 7),
  AnQuang: S(67, "Ân quang", "M", 3),
  ThienQuy: S(68, "Thiên quý", "O", 3),
  ThienKhoc: S(69, "Thiên khốc", "T", 12),
  ThienHu: S(70, "Thiên hư", "T", 12),
  ThienDuc: S(71, "Thiên đức", "H", 5),
  NguyetDuc: S(72, "Nguyệt đức", "H", 5),
  ThienHinh: S(73, "Thiên hình", "H", 15),
  ThienRieu: S(74, "Thiên riêu", "T", 13),
  ThienY: S(75, "Thiên y", "T", 5),
  QuocAn: S(76, "Quốc ấn", "O", 6),
  DuongPhu: S(77, "Đường phù", "M", 4),
  DaoHoa: S(78, "Đào hoa", "M", 8),
  HongLoan: S(79, "Hồng loan", "T", 8),
  ThienHy: S(80, "Thiên hỷ", "T", 5),
  ThienGiai: S(81, "Thiên giải", "H", 5),
  DiaGiai: S(82, "Địa giải", "O", 5),
  GiaiThan: S(83, "Giải thần", "M", 5),
  ThaiPhu: S(84, "Thai phụ", "K", 6),
  PhongCao: S(85, "Phong cáo", "O", 4),
  ThienTai: S(86, "Thiên tài", "O", 2),
  ThienTho: S(87, "Thiên thọ", "O", 5),
  ThienThuong: S(88, "Thiên thương", "O", 12),
  ThienSu: S(89, "Thiên sứ", "T", 12),
  ThienLa: S(90, "Thiên la", "O", 12),
  DiaVong: S(91, "Địa võng", "O", 12),
  HoaKhoa: S(92, "Hóa khoa", "T", 5),
  HoaQuyen: S(93, "Hóa quyền", "T", 4),
  HoaLoc: S(94, "Hóa lộc", "M", 3),
  HoaKy: S(95, "Hóa kỵ", "T", 13),
  CoThan: S(96, "Cô thần", "O", 13),
  QuaTu: S(97, "Quả tú", "O", 13),
  ThienMa: S(98, "Thiên mã", "H", 3),
  PhaToai: S(99, "Phá toái", "H", 12),
  ThienQuan: S(100, "Thiên quan", "H", 5),
  ThienPhuc: S(101, "Thiên phúc", "H", 5),
  LuuHa: S(102, "Lưu hà", "T", 12),
  ThienTru: S(103, "Thiên trù", "O", 5),
  KiepSat: S(104, "Kiếp sát", "H", 11),
  HoaCai: S(105, "Hoa cái", "K", 14),
  VanTinh: S(106, "Văn tinh", "H", 6),
  DauQuan: S(107, "Đẩu quân", "H", 5),
  ThienKhong: S(108, "Thiên không", "T", 11),
} as const satisfies Record<string, StarDef>;

export type StarKey = keyof typeof STARS;

/** Brightness: M miếu, V vượng, Đ đắc, B bình, H hãm. Index = palace position 1..12 (Tý..Hợi). */
export type Brightness = "M" | "V" | "Đ" | "B" | "H";
export const BRIGHTNESS: Partial<Record<number, readonly (Brightness | null)[]>> = {
  1: [null, "B", "Đ", "M", "B", "V", "M", "M", "Đ", "M", "B", "V", "B"],
  2: [null, "V", "Đ", "V", "H", "M", "H", "V", "Đ", "V", "H", "M", "H"],
  3: [null, "V", "H", "M", "Đ", "H", "Đ", "H", "H", "M", "H", "H", "Đ"],
  4: [null, "V", "M", "V", "Đ", "M", "H", "V", "M", "V", "Đ", "M", "H"],
  5: [null, "H", "Đ", "V", "V", "V", "M", "M", "Đ", "H", "H", "H", "H"],
  6: [null, "Đ", "Đ", "H", "M", "M", "V", "Đ", "Đ", "V", "M", "M", "H"],
  8: [null, "V", "Đ", "H", "H", "H", "H", "H", "Đ", "V", "M", "M", "M"],
  9: [null, "H", "M", "Đ", "H", "V", "H", "H", "M", "Đ", "H", "V", "H"],
  10: [null, "V", "H", "V", "M", "H", "H", "V", "H", "Đ", "M", "H", "Đ"],
  11: [null, "V", "Đ", "M", "H", "V", "Đ", "V", "Đ", "M", "H", "V", "Đ"],
  12: [null, "V", "Đ", "V", "V", "M", "H", "M", "Đ", "V", "H", "M", "H"],
  13: [null, "M", "Đ", "M", "H", "H", "V", "M", "Đ", "M", "H", "H", "V"],
  14: [null, "M", "V", "H", "H", "Đ", "H", "M", "V", "H", "H", "Đ", "H"],
  51: [null, "H", "Đ", "H", "H", "Đ", "H", "H", "Đ", "H", "H", "Đ", "H"],
  52: [null, "H", "Đ", "H", "H", "Đ", "H", "H", "Đ", "H", "H", "Đ", "H"],
  55: [null, "H", "H", "Đ", "Đ", "Đ", "Đ", "Đ", "H", "H", "H", "H", "H"],
  56: [null, "H", "H", "Đ", "Đ", "Đ", "Đ", "Đ", "H", "H", "H", "H", "H"],
  57: [null, "H", "Đ", "H", "Đ", "H", "Đ", "H", "Đ", "H", "H", "Đ", "Đ"],
  58: [null, "H", "Đ", "H", "Đ", "H", "Đ", "H", "Đ", "H", "H", "Đ", "Đ"],
  53: [null, "H", "H", "Đ", "H", "H", "Đ", "H", "H", "Đ", "H", "H", "Đ"],
  54: [null, "H", "H", "Đ", "H", "H", "Đ", "H", "H", "Đ", "H", "H", "Đ"],
  95: [null, null, "Đ", null, null, "Đ", null, null, "Đ", null, null, "Đ", null],
  36: [null, null, null, "Đ", "Đ", null, null, null, null, "Đ", "Đ", null, null],
  30: [null, null, null, "Đ", "Đ", null, null, null, null, "Đ", "Đ", null, null],
  69: [null, "Đ", "Đ", null, "Đ", null, null, "Đ", "Đ", null, "Đ", null, null],
  70: [null, "Đ", "Đ", null, "Đ", null, null, "Đ", "Đ", null, "Đ", null, null],
  98: [null, null, null, "Đ", null, null, "Đ", null, null, null, null, null, null],
  73: [null, null, null, "Đ", "Đ", null, null, null, null, "Đ", "Đ", null, null],
  74: [null, null, null, "Đ", "Đ", null, null, null, null, null, "Đ", "Đ", null],
};
