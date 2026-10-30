import { describe, expect, it } from "vitest";
import { solarToLunar, lunarToSolar } from "../src/lunar/hnd.js";
import { dayGanZhi, hourGanZhi, hourToBranch, yearGanZhi } from "../src/lunar/ganzhi.js";

// Tết Nguyên Đán (lunar new year day) in Vietnam, solar dates. Source: official Vietnamese calendars.
const TET: [number, number, number][] = [
  [1985, 1, 21], // Ất Sửu – famous VN (UTC+7) vs CN (UTC+8, 20 Feb) discrepancy
  [1986, 2, 9], [1987, 1, 29], [1988, 2, 17], [1989, 2, 6], [1990, 1, 27],
  [1995, 1, 31], [1996, 2, 19], [1997, 2, 7], [1998, 1, 28], [1999, 2, 16],
  [2000, 2, 5], [2001, 1, 24], [2002, 2, 12], [2003, 2, 1], [2004, 1, 22],
  [2005, 2, 9], [2006, 1, 29], [2007, 2, 17], [2008, 2, 7], [2009, 1, 26],
  [2010, 2, 14], [2011, 2, 3], [2012, 1, 23], [2013, 2, 10], [2014, 1, 31],
  [2015, 2, 19], [2016, 2, 8], [2017, 1, 28], [2018, 2, 16], [2019, 2, 5],
  [2020, 1, 25], [2021, 2, 12], [2022, 2, 1], [2023, 1, 22], [2024, 2, 10],
  [2025, 1, 29], [2026, 2, 17], [2027, 2, 6], [2028, 1, 26], [2029, 2, 13],
  [2030, 2, 2], // new moon 2030-02-02 16:08 UTC = 23:08 UTC+7 → Tết 2 Feb in VN, 3 Feb in China
];

describe("Vietnamese lunar calendar (Hồ Ngọc Đức algorithm, UTC+7)", () => {
  it.each(TET)("Tết %i falls on %i-%i", (y, m, d) => {
    expect(solarToLunar(d, m, y, 7)).toMatchObject({ day: 1, month: 1, year: y, leap: false });
    expect(lunarToSolar(1, 1, y, false, 7)).toEqual({ day: d, month: m, year: y });
  });
  it("differs from the Chinese calendar in 1985 (UTC+8 puts Tết on 20 Feb)", () => {
    expect(solarToLunar(21, 1, 1985, 8)).toMatchObject({ day: 1, month: 12, year: 1984 });
    expect(solarToLunar(21, 1, 1985, 7)).toMatchObject({ day: 1, month: 1, year: 1985 });
  });
  it("handles leap months (2023 has leap month 2 in VN)", () => {
    const l = solarToLunar(22, 3, 2023, 7);
    expect(l).toMatchObject({ day: 1, month: 2, leap: true, year: 2023 });
    expect(lunarToSolar(1, 2, 2023, true, 7)).toEqual({ day: 22, month: 3, year: 2023 });
    expect(lunarToSolar(1, 5, 2023, true, 7)).toBeNull();
  });
  it("round-trips every day of 2024", () => {
    for (let jd = 0; jd < 366; jd++) {
      const dt = new Date(Date.UTC(2024, 0, 1 + jd));
      const d = dt.getUTCDate(), m = dt.getUTCMonth() + 1, y = dt.getUTCFullYear();
      const l = solarToLunar(d, m, y, 7);
      expect(lunarToSolar(l.day, l.month, l.year, l.leap, 7)).toEqual({ day: d, month: m, year: y });
    }
  });
});

describe("can chi", () => {
  it("year 2024 = Giáp Thìn, 1985 = Ất Sửu", () => {
    expect(yearGanZhi(2024).name).toBe("Giáp Thìn");
    expect(yearGanZhi(1985).name).toBe("Ất Sửu");
  });
  it("day 2000-01-01 = Mậu Ngọ, 2024-02-10 = Giáp Thìn", () => {
    expect(dayGanZhi(1, 1, 2000).name).toBe("Mậu Ngọ");
    expect(dayGanZhi(10, 2, 2024).name).toBe("Giáp Thìn");
  });
  it("hour stems follow the ngũ thử độn rule", () => {
    expect(hourGanZhi(1, 1).name).toBe("Giáp Tý"); // Giáp day → Giáp Tý hour
    expect(hourGanZhi(2, 1).name).toBe("Bính Tý"); // Ất day → Bính Tý
    expect(hourGanZhi(7, 1).name).toBe("Bính Tý"); // Canh day → Bính Tý
  });
  it("maps clock hours to branches", () => {
    expect(hourToBranch(23)).toBe(1); expect(hourToBranch(0)).toBe(1);
    expect(hourToBranch(1)).toBe(2); expect(hourToBranch(13)).toBe(8); expect(hourToBranch(22)).toBe(12);
  });
});
