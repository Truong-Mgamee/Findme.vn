import { describe, expect, it } from 'vitest';
import {
  ascendantAndMC,
  atomKeysForAstro,
  atomKeysForDailySky,
  computeNatalChart,
  dailySky,
  findAspects,
  houseOf,
  localSiderealTime,
  meanLunarNode,
  meanObliquity,
  moonPhase,
  moonSign,
  normalizeDegrees,
  obliquity,
  placidus,
  planetPositions,
  risingSign,
  SIGNS,
  signFromLongitude,
  sunSign,
  toEngineOutput,
  wholeSign,
  wrap180,
  eclipticLongitudeAtRA,
  type BodyPosition,
} from '../src/index.js';

const BIRTH = new Date('1997-12-24T05:00:00Z');
const J2000 = new Date('2000-01-01T12:00:00Z');
const LONDON = { lat: 51.5074, lng: -0.1278 };
const SAIGON = { lat: 10.8231, lng: 106.6297 };

const near = (a: number, b: number, tol: number) => expect(Math.abs(wrap180(a - b))).toBeLessThanOrEqual(tol);

describe('zodiac', () => {
  it('has 12 signs with symbols, elements, modalities and rulers', () => {
    expect(SIGNS).toHaveLength(12);
    expect(SIGNS.filter((s) => s.element === 'fire').map((s) => s.key)).toEqual(['aries', 'leo', 'sagittarius']);
    expect(SIGNS.filter((s) => s.modality === 'cardinal').map((s) => s.key)).toEqual(['aries', 'cancer', 'libra', 'capricorn']);
    expect(SIGNS[7]).toMatchObject({ key: 'scorpio', symbol: '♏', ruler: 'pluto', traditionalRuler: 'mars', start: 210 });
  });

  it('signFromLongitude splits into sign/degree/minute and wraps', () => {
    expect(signFromLongitude(272.41)).toMatchObject({ sign: 'capricorn', degree: 2, minute: 24 });
    expect(signFromLongitude(0)).toMatchObject({ sign: 'aries', degree: 0, minute: 0 });
    expect(signFromLongitude(359.999)).toMatchObject({ sign: 'pisces', degree: 29, minute: 59 });
    expect(signFromLongitude(-10)).toMatchObject({ sign: 'pisces', degree: 20, lon: 350 });
    expect(signFromLongitude(390).sign).toBe('taurus');
    expect(signFromLongitude(360)).toMatchObject({ sign: 'aries', degree: 0, lon: 0 });
    expect(() => signFromLongitude(Number.NaN)).toThrow(RangeError);
  });

  it('angle helpers', () => {
    expect(normalizeDegrees(-30)).toBe(330);
    expect(normalizeDegrees(720)).toBe(0);
    expect(wrap180(350)).toBe(-10);
    expect(wrap180(180)).toBe(180);
  });
});

describe('positions (astronomy-engine anchors)', () => {
  it('1997-12-24T05:00Z: Sun ≈ 272.41° Capricorn, Moon ≈ 207.43° Libra (docs/03 §6.4)', () => {
    const pos = planetPositions(BIRTH);
    const sun = pos.find((p) => p.body === 'sun')!;
    const moon = pos.find((p) => p.body === 'moon')!;
    near(sun.lon, 272.41, 0.1);
    near(moon.lon, 207.43, 0.1);
    expect(signFromLongitude(sun.lon).sign).toBe('capricorn');
    expect(signFromLongitude(moon.lon).sign).toBe('libra');
    expect(sunSign(BIRTH)).toBe('capricorn');
    expect(moonSign(BIRTH)).toBe('libra');
    expect(sun.retrograde).toBe(false);
    expect(moon.retrograde).toBe(false);
    expect(Math.abs(sun.lat)).toBeLessThan(0.01);
    expect(moon.speed).toBeGreaterThan(11);
    expect(moon.speed).toBeLessThan(16);
  });

  it('returns Sun→Pluto plus mean North Node with latitudes', () => {
    const pos = planetPositions(BIRTH);
    expect(pos.map((p) => p.body)).toEqual([
      'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northNode',
    ]);
    for (const p of pos) {
      expect(p.lon).toBeGreaterThanOrEqual(0);
      expect(p.lon).toBeLessThan(360);
      expect(Number.isFinite(p.lat)).toBe(true);
    }
    const pluto = pos.find((p) => p.body === 'pluto')!;
    expect(Math.abs(pluto.lat)).toBeGreaterThan(5); // Pluto's inclined orbit
    const node = pos.find((p) => p.body === 'northNode')!;
    expect(node.retrograde).toBe(true);
    expect(node.lat).toBe(0);
  });

  it('J2000: Sun ≈ 280.4° Capricorn, obliquity ≈ 23.439°', () => {
    const sun = planetPositions(J2000).find((p) => p.body === 'sun')!;
    near(sun.lon, 280.4, 0.1);
    expect(sunSign(J2000)).toBe('capricorn');
    near(meanObliquity(J2000), 23.4393, 0.001);
    near(obliquity(J2000), 23.439, 0.01); // true obliquity differs from mean by nutation (≈ −1.6")
  });

  it('mean lunar node: Ω(J2000) = 125.04452° and regresses ~19.34°/yr', () => {
    near(meanLunarNode(J2000), 125.04452, 1e-6);
    const later = meanLunarNode(new Date('2001-01-01T12:00:00Z'));
    near(wrap180(later - 125.04452), -19.34, 0.05);
    near(meanLunarNode(BIRTH), 164.14, 0.1);
  });

  it('retrograde detection: Mercury Rx on 2024-04-10, direct on 2024-06-01', () => {
    const rx = planetPositions(new Date('2024-04-10T12:00:00Z')).find((p) => p.body === 'mercury')!;
    const direct = planetPositions(new Date('2024-06-01T12:00:00Z')).find((p) => p.body === 'mercury')!;
    expect(rx.retrograde).toBe(true);
    expect(rx.speed).toBeLessThan(0);
    expect(direct.retrograde).toBe(false);
    expect(direct.speed).toBeGreaterThan(0);
  });

  it('moonPhase: near full on 2024-01-25, new on 2024-01-11', () => {
    const full = moonPhase(new Date('2024-01-25T12:00:00Z'));
    expect(full.angle).toBeGreaterThan(170);
    expect(full.angle).toBeLessThan(190);
    expect(full.name).toBe('full');
    expect(full.illumination).toBeGreaterThan(0.98);
    const nm = moonPhase(new Date('2024-01-11T12:00:00Z'));
    expect(nm.name).toBe('new');
    expect(nm.waxing).toBe(true);
    const lq = moonPhase(new Date('2024-02-02T23:00:00Z'));
    expect(lq.name).toBe('lastQuarter');
    expect(lq.waxing).toBe(false);
  });

  it('rejects invalid dates', () => {
    expect(() => planetPositions(new Date('nope'))).toThrow(TypeError);
  });
});

describe('angles and houses', () => {
  it('local sidereal time: Greenwich J2000 GAST ≈ 18.697h', () => {
    near(localSiderealTime(J2000, 0), 18.697 * 15, 0.01);
    near(localSiderealTime(J2000, 90), 18.697 * 15 + 90, 0.01);
  });

  it('London 2000-01-01T12:00Z: ASC ≈ 24.0° Aries, MC ≈ 9.5° Capricorn', () => {
    // Computed with this package and consistent with the classical Tables of Houses for
    // London (ST ≈ 18h41m → MC 9° Cap, 11th 29° Cap, 12th 27° Aqu, ASC 24° Ari, 2nd 1° Gem, 3rd 22° Gem).
    const a = ascendantAndMC(J2000, LONDON.lat, LONDON.lng);
    near(a.asc, 24.01, 0.5);
    near(a.mc, 279.49, 0.5);
    expect(signFromLongitude(a.asc).sign).toBe('aries');
    expect(risingSign(J2000, LONDON.lat, LONDON.lng)).toBe('aries');
    const p = placidus(J2000, LONDON.lat, LONDON.lng).cusps;
    near(p[10], 298.9, 0.5);
    near(p[11], 327.5, 0.5);
    near(p[1], 61.0, 0.5);
    near(p[2], 81.9, 0.5);
  });

  it('ASC−DSC = 180, MC−IC = 180, ASC in the half-circle after MC', () => {
    const a = ascendantAndMC(BIRTH, SAIGON.lat, SAIGON.lng);
    near(a.dsc - a.asc, 180, 1e-9);
    near(a.ic - a.mc, 180, 1e-9);
    const arc = normalizeDegrees(a.asc - a.mc);
    expect(arc).toBeGreaterThan(0);
    expect(arc).toBeLessThan(180);
  });

  it('ASC follows MC by 0–180° across many times and latitudes (quadrant correctness)', () => {
    for (let h = 0; h < 24; h += 1.5) {
      for (const lat of [-60, -35, -10, 0, 15, 40, 60]) {
        const t = new Date(Date.UTC(2024, 5, 21, h));
        const a = ascendantAndMC(t, lat, 30);
        const arc = normalizeDegrees(a.asc - a.mc);
        expect(arc, `h=${h} lat=${lat}`).toBeGreaterThan(0);
        expect(arc, `h=${h} lat=${lat}`).toBeLessThan(180);
      }
    }
  });

  it('whole sign: cusp 1 = start of ASC sign, 30° steps', () => {
    const a = ascendantAndMC(J2000, LONDON.lat, LONDON.lng);
    const w = wholeSign(a.asc);
    expect(w[0]).toBe(0); // ASC 24° Aries → house 1 = 0° Aries
    expect(w).toHaveLength(12);
    for (let i = 0; i < 12; i++) expect(w[i]).toBe(normalizeDegrees(w[0]! + 30 * i));
  });

  it('placidus: cusps 1/10 equal ASC/MC, opposite cusps differ by 180, monotonic mod 360', () => {
    for (const [t, loc] of [
      [J2000, LONDON],
      [BIRTH, SAIGON],
      [new Date('2024-06-21T18:30:00Z'), { lat: -33.8688, lng: 151.2093 }], // Sydney
      [new Date('1985-03-03T03:03:00Z'), { lat: 60.17, lng: 24.94 }], // Helsinki
    ] as const) {
      const r = placidus(t, loc.lat, loc.lng);
      expect(r.effectiveSystem).toBe('placidus');
      expect(r.warnings).toEqual([]);
      const c = r.cusps;
      near(c[0], r.angles.asc, 1e-9);
      near(c[9], r.angles.mc, 1e-9);
      for (let i = 0; i < 6; i++) near(c[i + 6]! - c[i]!, 180, 1e-9);
      let total = 0;
      for (let i = 0; i < 12; i++) {
        const span = normalizeDegrees(c[(i + 1) % 12]! - c[i]!);
        expect(span, `house ${i + 1}`).toBeGreaterThan(0);
        expect(span, `house ${i + 1}`).toBeLessThan(180);
        total += span;
      }
      near(total, 360, 1e-6);
    }
  });

  it('placidus at the equator degenerates to equal right-ascension division', () => {
    const r = placidus(J2000, 0, 0);
    const { ramc, obliquity: eps } = r.angles;
    for (let i = 0; i < 12; i++) {
      // house k cusp sits at RA = RAMC + 30·(k − 10) since every semi-arc is 90° on the equator
      const ra = ramc + 30 * ((i + 1 - 10 + 12) % 12);
      near(r.cusps[i]!, eclipticLongitudeAtRA(ra, eps), 1e-6);
    }
  });

  it('placidus falls back to whole sign beyond ±66° with a warning', () => {
    const r = placidus(J2000, 70, 20);
    expect(r.system).toBe('placidus');
    expect(r.effectiveSystem).toBe('whole');
    expect(r.warnings[0]?.code).toBe('astro.houses.polar_fallback');
    expect(r.cusps[0]).toBe(signFromLongitude(r.angles.asc).signIndex * 30);
  });

  it('houseOf assigns by forward arc from cusps', () => {
    const cusps = wholeSign(24);
    expect(houseOf(24, cusps)).toBe(1);
    expect(houseOf(29.99, cusps)).toBe(1);
    expect(houseOf(30, cusps)).toBe(2);
    expect(houseOf(359, cusps)).toBe(12);
  });

  it('rejects invalid coordinates', () => {
    expect(() => ascendantAndMC(J2000, 95, 0)).toThrow(RangeError);
    expect(() => ascendantAndMC(J2000, 0, 200)).toThrow(RangeError);
  });
});

describe('natal chart', () => {
  const chart = computeNatalChart({ utc: BIRTH, ...SAIGON, houseSystem: 'placidus' });

  it('assembles planets with sign, degree/minute and house', () => {
    expect(chart.sun).toBe('capricorn');
    expect(chart.moon).toBe('libra');
    expect(chart.rising).toBe('aries');
    expect(chart.houseSystem).toBe('placidus');
    expect(chart.planets).toHaveLength(11);
    const sun = chart.planets.find((p) => p.body === 'sun')!;
    expect(sun).toMatchObject({ sign: 'capricorn', degree: 2, minute: 24 });
    for (const p of chart.planets) {
      expect(p.house).toBeGreaterThanOrEqual(1);
      expect(p.house).toBeLessThanOrEqual(12);
      expect(p.house).toBe(houseOf(p.lon, chart.houses));
    }
    expect(chart.planets.find((p) => p.body === 'mercury')!.retrograde).toBe(true); // Mercury Rx 7–27 Dec 1997
  });

  it('whole-sign variant keeps the same angles but sign-aligned cusps', () => {
    const w = computeNatalChart({ utc: BIRTH, ...SAIGON, houseSystem: 'whole' });
    expect(w.angles).toEqual(chart.angles);
    expect(w.houses[0]).toBe(0);
    expect(w.houseSystem).toBe('whole');
  });

  it('finds major aspects within orbs (8° luminaries, 6° others), sorted by orb', () => {
    expect(chart.aspects.length).toBeGreaterThan(3);
    for (const a of chart.aspects) {
      expect(a.orb).toBeLessThanOrEqual(a.maxOrb);
      expect(a.maxOrb).toBe(a.a === 'sun' || a.a === 'moon' || a.b === 'sun' || a.b === 'moon' ? 8 : 6);
      expect(['conjunction', 'opposition', 'trine', 'square', 'sextile']).toContain(a.type);
    }
    for (let i = 1; i < chart.aspects.length; i++) {
      expect(chart.aspects[i]!.orb).toBeGreaterThanOrEqual(chart.aspects[i - 1]!.orb);
    }
    expect(chart.aspects.some((a) => a.a === 'venus' && a.b === 'mars' && a.type === 'conjunction')).toBe(true);
    expect(chart.aspects.some((a) => a.a === 'sun' && a.b === 'moon' && a.type === 'sextile')).toBe(true);
    expect(chart.aspects.some((a) => a.a === 'northNode' || a.b === 'northNode')).toBe(false);
  });

  it('applying flag follows the speeds', () => {
    const mk = (body: BodyPosition['body'], lon: number, speed: number): BodyPosition => ({
      body, lon, lat: 0, speed, retrograde: speed < 0,
    });
    // Moon at 85°, Sun at 0°: separation 85 → approaching square (90) as the Moon moves faster
    const applying = findAspects([mk('sun', 0, 1), mk('moon', 85, 13)]);
    expect(applying[0]).toMatchObject({ type: 'square', applying: true });
    const separating = findAspects([mk('sun', 0, 1), mk('moon', 95, 13)]);
    expect(separating[0]).toMatchObject({ type: 'square', applying: false });
    // Out of orb → no aspect
    expect(findAspects([mk('mars', 0, 0.5), mk('saturn', 100, 0.1)])).toEqual([]);
  });
});

describe('daily + atoms + engine output', () => {
  it('dailySky returns moon sign/phase, sun sign and retrogrades', () => {
    const sky = dailySky(new Date('2024-04-10T12:00:00Z'));
    expect(sky.sun.sign).toBe('aries');
    expect(sky.moon.sign).toBe('taurus');
    expect(sky.moon.phase.name).toBe('waxingCrescent');
    expect(sky.retrogrades).toContain('mercury');
    expect(sky.retrogrades).not.toContain('northNode');
    expect(atomKeysForDailySky(sky)).toEqual(
      expect.arrayContaining(['astro.sun.aries', 'astro.moon.taurus', 'astro.moon.phase.waxingCrescent', 'astro.retrograde.mercury']),
    );
  });

  it('atomKeysForAstro yields sun/moon/rising/planet/aspect keys in order, de-duplicated', () => {
    const chart = computeNatalChart({ utc: BIRTH, ...SAIGON });
    const keys = atomKeysForAstro(chart);
    expect(keys.slice(0, 3)).toEqual(['astro.sun.capricorn', 'astro.moon.libra', 'astro.rising.aries']);
    expect(keys).toContain('astro.mercury.sagittarius');
    expect(keys).toContain('astro.mercury.retrograde');
    expect(keys).toContain('astro.venus.aquarius');
    expect(keys).toContain('astro.sun.house.9');
    expect(keys).toContain('astro.aspect.venus.conjunction.mars');
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.every((k) => /^astro\.[a-z0-9.]+$/i.test(k))).toBe(true);
  });

  it('toEngineOutput wraps the chart in the shared envelope', () => {
    const chart = computeNatalChart({ utc: BIRTH, ...SAIGON });
    const out = toEngineOutput(chart);
    expect(out.engine).toBe('astro');
    expect(out.engineVersion).toBe('0.1.0');
    expect(out.facts).toBe(chart);
    expect(out.confidence).toBe('high');
    expect(out.warnings).toEqual([]);
    expect(out.atomKeys).toEqual(atomKeysForAstro(chart));
    const polar = toEngineOutput(computeNatalChart({ utc: J2000, lat: 70, lng: 20 }));
    expect(polar.confidence).toBe('medium');
    expect(polar.warnings[0]?.code).toBe('astro.houses.polar_fallback');
  });
});
