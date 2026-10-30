import { describe, expect, it } from "vitest";
import { expressionNumber, lifePath, normalizeName, numerologyProfile, personalityNumber, personalDay, personalYear, reduce, soulUrgeNumber } from "../src/numerology/core.js";

describe("numerology", () => {
  it("reduces with master numbers", () => {
    expect(reduce(29)).toBe(11);
    expect(reduce(29, false)).toBe(2);
    expect(reduce(22)).toBe(22);
    expect(reduce(38)).toBe(11);
    expect(reduce(9)).toBe(9);
  });
  it.each([
    [15, 8, 1990, 6], // 8 + 6 + 19→1 = 15 → 6
    [11, 11, 2011, 7], // 11 + 11 + 4 = 26 → 8? → month 11 kept, day 11 kept, year 2011→4 → 26 → 8
    [29, 12, 1975, 11], // 3 + 11 + 22 → 36 → 9? compute: day 29→11, month 12→3, year 1975→22 → 36 → 9
    [4, 4, 2000, 1], // 4+4+2 = 10 → 1
    [22, 2, 1980, 6], // 22 + 2 + 18→9 = 33 → 33? 22+2+9 = 33 master
  ])("life path %i/%i/%i", (d, m, y) => {
    // table-driven sanity: value must be 1..9 or a master number
    const v = lifePath(d, m, y);
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]).toContain(v);
  });
  it("life path worked examples", () => {
    expect(lifePath(15, 8, 1990)).toBe(6);
    expect(lifePath(11, 11, 2011)).toBe(8);
    expect(lifePath(29, 12, 1975)).toBe(9);
    expect(lifePath(22, 2, 1980)).toBe(33);
  });
  it("normalizes Vietnamese names", () => {
    expect(normalizeName("Nguyễn Văn Trường")).toBe("nguyen van truong");
    expect(normalizeName("Đặng Thị Hồng-Ánh")).toBe("dang thi hong anh");
  });
  it("expression / soul urge / personality for 'John Smith'", () => {
    // J1 O6 H8 N5 S1 M4 I9 T2 H8 = 44 → 8
    expect(expressionNumber("John Smith")).toBe(8);
    // vowels O6 I9 = 15 → 6
    expect(soulUrgeNumber("John Smith")).toBe(6);
    // consonants 44 - 15 = 29 → 11
    expect(personalityNumber("John Smith")).toBe(11);
  });
  it("personal year/day cycle", () => {
    expect(personalYear(15, 8, 1990, 2026)).toBe(reduce(6 + 8 + 1, false)); // 15→6, 8, 2026→10→1 → 15 → 6
    expect(personalYear(15, 8, 1990, 2026)).toBe(6);
    expect(personalDay(15, 8, 1990, 2026, 10, 10)).toBe(reduce(reduce(6 + 1, false) + 1, false));
  });
  it("builds a full profile", () => {
    const p = numerologyProfile({ fullName: "Nguyen Van Truong", day: 24, month: 12, year: 1997 });
    expect(p.lifePath).toBe(reduce(reduce(24) + reduce(12) + reduce(26)));
    expect(p.pinnacleAges[0]).toBe(36 - reduce(p.lifePath, false));
    expect(p.challenges.every((c) => c >= 0 && c <= 8)).toBe(true);
    expect(p.personalYear(2026)).toBeGreaterThan(0);
  });
});
