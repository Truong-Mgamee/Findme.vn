import { describe, expect, it } from "vitest";
import * as A from "astronomy-engine";
import { ascMc, eclipticLongitude, houseOf, moonPhase, natalChart, signOf, wholeSignCusps } from "../src/astro/natal.js";

describe("western astrology (astronomy-engine)", () => {
  it("Sun longitude at J2000 ≈ 280.37° (Capricorn), equinox 2024-03-20 03:06 UTC ≈ 0°", () => {
    expect(eclipticLongitude("Sun", new Date("2000-01-01T12:00:00Z"))).toBeCloseTo(280.37, 0);
    const eq = eclipticLongitude("Sun", new Date("2024-03-20T03:06:00Z"));
    expect(Math.min(eq, 360 - eq)).toBeLessThan(0.05);
    expect(signOf(eclipticLongitude("Sun", new Date("2024-07-30T12:00:00Z")))).toBe("Leo");
  });
  it("Moon longitude: full moon 2024-10-17 11:26 UTC is opposite the Sun", () => {
    const d = new Date("2024-10-17T11:26:00Z");
    const diff = Math.abs(eclipticLongitude("Moon", d) - eclipticLongitude("Sun", d));
    expect(Math.abs((diff % 360) - 180)).toBeLessThan(0.5);
    expect(moonPhase(d).name).toBe("Full Moon");
    expect(moonPhase(d).illumination).toBeGreaterThan(0.99);
  });
  it("Mercury retrograde 2024-08-10 (station Aug 5 → Aug 28)", () => {
    const c = natalChart({ utc: new Date("2024-08-10T00:00:00Z"), latitude: 0, longitude: 0 });
    expect(c.planets.find((p) => p.planet === "Mercury")?.retrograde).toBe(true);
    const c2 = natalChart({ utc: new Date("2024-10-10T00:00:00Z"), latitude: 0, longitude: 0 });
    expect(c2.planets.find((p) => p.planet === "Mercury")?.retrograde).toBe(false);
  });
  it("MC is opposite the Sun at local midnight and equal to it at local noon (Hanoi, UTC+7)", () => {
    // 1999-12-31 17:00 UTC = 2000-01-01 00:00 local
    const midnight = new Date("1999-12-31T17:00:00Z");
    const sunMid = eclipticLongitude("Sun", midnight);
    const { mc, asc } = ascMc(midnight, 21.03, 105.85);
    const dMid = Math.abs(((mc - (sunMid + 180)) % 360 + 540) % 360 - 180);
    expect(dMid).toBeLessThan(6); // Hanoi is ~0.9° of longitude east of the UTC+7 meridian + equation of time
    expect(signOf(asc)).toBe("Libra");
    const noon = new Date("2000-01-01T05:00:00Z");
    const { mc: mcNoon } = ascMc(noon, 21.03, 105.85);
    const dNoon = Math.abs(((mcNoon - eclipticLongitude("Sun", noon)) % 360 + 540) % 360 - 180);
    expect(dNoon).toBeLessThan(6);
  });
  it("Ascendant equals the Sun's longitude at sunrise", () => {
    const obs = new A.Observer(21.03, 105.85, 10);
    const rise = A.SearchRiseSet(A.Body.Sun, obs, +1, new Date("2024-03-20T00:00:00Z"), 2);
    expect(rise).not.toBeNull();
    const t = rise!.date;
    const { asc } = ascMc(t, 21.03, 105.85);
    const sun = eclipticLongitude("Sun", t);
    const d = Math.abs(((asc - sun) % 360 + 540) % 360 - 180);
    expect(d).toBeLessThan(2); // refraction + upper-limb rise definition ≈ 1°
  });
  it("whole-sign houses and house lookup", () => {
    const cusps = wholeSignCusps(134);
    expect(cusps[0]).toBe(120);
    expect(houseOf(125, cusps)).toBe(1);
    expect(houseOf(119, cusps)).toBe(12);
    expect(houseOf(300, cusps)).toBe(7);
  });
  it("builds a full chart with 10 planets and aspects", () => {
    const c = natalChart({ utc: new Date("1990-08-15T03:00:00Z"), latitude: 10.8, longitude: 106.7, houseSystem: "placidus" });
    expect(c.planets).toHaveLength(10);
    expect(c.cusps).toHaveLength(12);
    expect(c.planets.every((p) => p.house >= 1 && p.house <= 12)).toBe(true);
    expect(c.aspects.length).toBeGreaterThan(3);
    expect(c.planets.find((p) => p.planet === "Sun")?.sign).toBe("Leo");
  });
});
