import { describe, expect, it } from "vitest";
import { buildProfile, type ProfileInput } from "../src/profile.js";
import { dailyCard } from "../src/daily/compose.js";
import { compare } from "../src/compat/compare.js";

const truong: ProfileInput = { id: "u1", displayName: "Nguyễn Văn Trường", gender: "male", year: 1997, month: 12, day: 24, hour: 8, precision: "exact", utcOffsetHours: 7, latitude: 21.03, longitude: 105.85, locale: "vi" };
const lan: ProfileInput = { id: "u2", displayName: "Trần Thị Lan", gender: "female", year: 1999, month: 5, day: 3, hourBranch: 7, precision: "canh_gio", utcOffsetHours: 7, latitude: 10.8, longitude: 106.7, locale: "vi" };

describe("profile", () => {
  it("builds all four systems from one input", () => {
    const p = buildProfile(truong);
    expect(p.yearGanZhi).toBe("Đinh Sửu");
    expect(p.zodiacAnimalEn).toBe("Ox");
    expect(p.menhElement).toBe("Thủy"); // Đinh Sửu = Giản Hạ Thủy
    expect(p.tuvi?.palaces).toHaveLength(12);
    expect(p.bazi.day.name).toBeTruthy();
    expect(p.natal.planets[0]!.sign).toBe("Capricorn");
    expect(p.numerology.lifePath).toBeGreaterThan(0);
    expect(p.hourBranch).toBe(5); // 08:00 = Thìn
  });
  it("skips Tử vi when the birth hour is unknown but still builds the rest", () => {
    const p = buildProfile({ ...truong, hour: undefined, precision: "unknown" });
    expect(p.tuvi).toBeNull();
    expect(p.natal.planets).toHaveLength(10);
  });
});

describe("daily card", () => {
  it("is deterministic for (user, date) and has 1..5 scores", () => {
    const p = buildProfile(truong);
    const a = dailyCard(p, { year: 2026, month: 10, day: 10 });
    const b = dailyCard(p, { year: 2026, month: 10, day: 10 });
    expect(a.tarot.card.id).toBe(b.tarot.card.id);
    expect(a.scores).toEqual(b.scores);
    for (const v of Object.values(a.scores)) { expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThanOrEqual(5); }
    expect(a.personalDay).toBeGreaterThanOrEqual(1);
    expect(a.luckyNumber).toBeGreaterThanOrEqual(1);
    expect(a.luckyNumber).toBeLessThanOrEqual(9);
    expect(a.date).toBe("2026-10-10");
  });
  it("changes across 7 days (not the same card every day)", () => {
    const p = buildProfile(truong);
    const ids = new Set(Array.from({ length: 7 }, (_, i) => dailyCard(p, { year: 2026, month: 10, day: 10 + i }).tarot.card.id));
    expect(ids.size).toBeGreaterThan(3);
  });
});

describe("compatibility", () => {
  it("is symmetric and bounded", () => {
    const a = buildProfile(truong), b = buildProfile(lan);
    const ab = compare(a, b), ba = compare(b, a);
    expect(ab.overall).toBe(ba.overall);
    expect(ab.overall).toBeGreaterThanOrEqual(0);
    expect(ab.overall).toBeLessThanOrEqual(100);
    expect(ab.details.branchRelation).toBeTruthy();
  });
});
