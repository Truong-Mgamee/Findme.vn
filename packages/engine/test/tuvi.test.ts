import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildTuViChart } from "../src/tuvi/chart.js";

interface OracleCase {
  input: { day: number; month: number; year: number; hourBranch: number; gender: 1 | -1; solar: boolean };
  lunar: { day: number; month: number; year: number; leap: number };
  canNam: number; chiNam: number; canNgay: number; chiNgay: number;
  cungMenh: number; cungThan: number; cuc: number; tenCuc: string; menh: string; banMenh: string;
  menhChu: string; thanChu: string; sinhKhac: string;
  palaces: { pos: number; name: string; stars: { id: number; name: string; dt: string | null }[]; daiHan: number; tieuHan: string; than: boolean; tuan: boolean; triet: boolean }[];
}

const cases = JSON.parse(readFileSync(new URL("./oracle/tuvi-oracle.json", import.meta.url), "utf8")) as OracleCase[];
const CUC_ID: Record<number, string> = { 1: "Kim", 2: "Mộc", 3: "Thủy", 4: "Hỏa", 5: "Thổ" };
const ELEMENT_CODE: Record<string, string> = { Kim: "K", Mộc: "M", Thủy: "T", Hỏa: "H", Thổ: "O" };

describe("Tử vi chart vs lasotuvi (Python) oracle", () => {
  it.each(cases.map((c, i) => [i, c] as const))("case %i", (_i, c) => {
    const chart = buildTuViChart({
      day: c.input.day, month: c.input.month, year: c.input.year, solar: c.input.solar,
      hourBranch: c.input.hourBranch, gender: c.input.gender === 1 ? "male" : "female", timeZone: 7,
    });
    expect(chart.lunar).toEqual({ day: c.lunar.day, month: c.lunar.month, year: c.lunar.year, leap: c.lunar.leap === 1 });
    expect(chart.year.canIdx).toBe(c.canNam);
    expect(chart.year.chiIdx).toBe(c.chiNam);
    expect(chart.cungMenh).toBe(c.cungMenh);
    expect(chart.cungThan).toBe(c.cungThan);
    expect(chart.cuc.element).toBe(CUC_ID[c.cuc]);
    // lasotuvi spells some nạp âm names differently (e.g. "LỘ BÀN THỔ"); compare the element only
    expect(ELEMENT_CODE[chart.menh.element]).toBe(c.menh);
    expect(chart.menhChu).toBe(c.menhChu);
    expect(chart.thanChu).toBe(c.thanChu);
    // lasotuvi's sinhKhac matrix has a bug for Thủy (mệnh) vs Hỏa (cục): it returns "sinh" instead of "khắc"
    if (!(chart.menh.element === "Thủy" && chart.cuc.element === "Hỏa")) {
      expect(chart.menhCucRelation).toBe(c.sinhKhac.replace("Bản mệnh", "Bản Mệnh"));
    } else {
      expect(chart.menhCucRelation).toBe("Bản Mệnh khắc Cục");
    }
    for (const op of c.palaces) {
      const p = chart.palaces[op.pos - 1]!;
      expect(p.position).toBe(op.pos);
      expect(p.name).toBe(op.name.replace("Tật Ách", "Tật ách").replace("Tài Bạch", "Tài bạch"));
      expect(p.daiHan).toBe(op.daiHan);
      expect(p.tieuHan).toBe(op.tieuHan);
      expect(p.isThan).toBe(op.than);
      expect(p.tuan).toBe(op.tuan);
      expect(p.triet).toBe(op.triet);
      const got = p.stars.map((s) => `${s.id}:${s.brightness ?? ""}`).sort();
      const want = op.stars.map((s) => `${s.id}:${s.dt ?? ""}`).sort();
      expect(got).toEqual(want);
    }
  });
});
