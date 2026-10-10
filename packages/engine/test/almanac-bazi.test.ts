import { describe, expect, it } from "vitest";
import { dayAlmanac, goodDays } from "../src/lunar/almanac.js";
import { baziChart } from "../src/bazi/pillars.js";

describe("almanac", () => {
  it("2024-02-10 (Tết Giáp Thìn) is Giáp Thìn day with VN lunar 1/1", () => {
    const a = dayAlmanac(10, 2, 2024);
    expect(a.dayGanZhi).toBe("Giáp Thìn");
    expect(a.lunarVN).toEqual({ day: 1, month: 1, year: 2024, leap: false });
    expect(a.clashBranchName).toBe("Tuất");
    expect(a.score).toBeGreaterThanOrEqual(0);
    expect(a.score).toBeLessThanOrEqual(100);
    expect(a.goodHours.length).toBe(6);
  });
  it("hoàng đạo flag follows the 6 auspicious day-spirits", () => {
    let hd = 0;
    for (let d = 1; d <= 30; d++) if (dayAlmanac(d, 6, 2026).hoangDao) hd++;
    expect(hd).toBeGreaterThan(8);
    expect(hd).toBeLessThan(22);
  });
  it("filters good days by event and clash", () => {
    const all = goodDays(2026, 11, "wedding");
    expect(all.length).toBeGreaterThan(0);
    const branch = all[0]!.clashBranch;
    const filtered = goodDays(2026, 11, "wedding", branch);
    expect(filtered.every((d) => d.clashBranch !== branch)).toBe(true);
  });
});

describe("bazi", () => {
  it("1985-01-21 14:00 → Giáp Tý year (before Lập xuân), Đinh Sửu month, Canh Thân day, Quý Mùi hour", () => {
    const b = baziChart({ year: 1985, month: 1, day: 21, hour: 14, gender: "male" });
    expect(b.year.name).toBe("Giáp Tý");
    expect(b.month.name).toBe("Đinh Sửu");
    expect(b.day.name).toBe("Canh Thân");
    expect(b.hour.name).toBe("Quý Mùi");
    expect(b.dayMaster.element).toBe("Kim");
    expect(Object.values(b.elements).reduce((a, c) => a + c, 0)).toBeGreaterThanOrEqual(98);
    expect(b.luckPillars.length).toBe(8);
    expect(["vượng", "trung bình", "nhược"]).toContain(b.strength);
  });
});
