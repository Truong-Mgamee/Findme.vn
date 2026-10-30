/**
 * Western astrology on top of astronomy-engine (MIT). Accuracy ≈ 1 arcminute vs NOVAS.
 * Tropical zodiac, geocentric apparent ecliptic longitudes, Whole Sign + Placidus houses.
 */
import * as A from "astronomy-engine";

export const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"] as const;
export type Sign = (typeof SIGNS)[number];
export const SIGN_ELEMENT: Record<Sign, "fire" | "earth" | "air" | "water"> = {
  Aries: "fire", Leo: "fire", Sagittarius: "fire", Taurus: "earth", Virgo: "earth", Capricorn: "earth",
  Gemini: "air", Libra: "air", Aquarius: "air", Cancer: "water", Scorpio: "water", Pisces: "water",
};

export type PlanetName = "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn" | "Uranus" | "Neptune" | "Pluto";
export const PLANETS: PlanetName[] = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
const BODY: Record<PlanetName, A.Body> = {
  Sun: A.Body.Sun, Moon: A.Body.Moon, Mercury: A.Body.Mercury, Venus: A.Body.Venus, Mars: A.Body.Mars,
  Jupiter: A.Body.Jupiter, Saturn: A.Body.Saturn, Uranus: A.Body.Uranus, Neptune: A.Body.Neptune, Pluto: A.Body.Pluto,
};

export interface PlanetPosition {
  planet: PlanetName;
  /** 0..360 tropical ecliptic longitude */
  longitude: number;
  sign: Sign;
  /** 0..30 within sign */
  degree: number;
  retrograde: boolean;
  house: number; // 1..12 (whole sign unless placidus requested)
}

export interface Aspect {
  a: PlanetName;
  b: PlanetName;
  type: "conjunction" | "sextile" | "square" | "trine" | "opposition";
  orb: number;
  applying?: boolean;
}

export interface NatalChart {
  utc: Date;
  latitude: number;
  longitude: number;
  houseSystem: "whole-sign" | "placidus";
  ascendant: number;
  midheaven: number;
  ascSign: Sign;
  mcSign: Sign;
  /** house cusps 1..12 (index 0 = house 1) */
  cusps: number[];
  planets: PlanetPosition[];
  aspects: Aspect[];
  moonPhase: { angle: number; name: string; illumination: number };
}

export interface NatalInput {
  /** birth instant in UTC */
  utc: Date;
  latitude: number;
  longitude: number;
  houseSystem?: "whole-sign" | "placidus";
}

const norm360 = (x: number) => ((x % 360) + 360) % 360;
export const signOf = (lon: number): Sign => SIGNS[Math.floor(norm360(lon) / 30)]!;
const DEG = Math.PI / 180;

/** Apparent geocentric ecliptic longitude (true equinox of date). */
export function eclipticLongitude(planet: PlanetName, utc: Date): number {
  const t = A.MakeTime(utc);
  if (planet === "Sun") {
    return norm360(A.SunPosition(t).elon);
  }
  if (planet === "Moon") {
    return norm360(A.EclipticGeoMoon(t).lon);
  }
  const vec = A.GeoVector(BODY[planet], t, true);
  const ecl = A.Ecliptic(vec);
  return norm360(ecl.elon);
}

function isRetrograde(planet: PlanetName, utc: Date): boolean {
  if (planet === "Sun" || planet === "Moon") return false;
  const d0 = eclipticLongitude(planet, new Date(utc.getTime() - 12 * 3600e3));
  const d1 = eclipticLongitude(planet, new Date(utc.getTime() + 12 * 3600e3));
  let diff = d1 - d0;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff < 0;
}

/** Mean obliquity of the ecliptic (IAU 2006 polynomial, degrees). */
function obliquity(utc: Date): number {
  const T = (A.MakeTime(utc).tt) / 36525; // tt = days since J2000
  return 23.439291111 - (46.836769 * T - 0.0001831 * T * T + 0.0020034 * T * T * T) / 3600;
}

/** Ascendant and MC from local sidereal time. */
export function ascMc(utc: Date, latitude: number, longitude: number): { asc: number; mc: number; ramc: number } {
  const gst = A.SiderealTime(A.MakeTime(utc)); // hours
  const lst = norm360(gst * 15 + longitude); // degrees
  const eps = obliquity(utc) * DEG;
  const ramc = lst * DEG;
  const phi = latitude * DEG;
  // MC
  const mc = norm360(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / DEG);
  // Ascendant (Meeus 25.x / standard formula)
  const asc = norm360(
    Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) / DEG,
  );
  return { asc, mc, ramc: lst };
}

/** Placidus house cusps (iterative). Falls back to whole sign above |lat| 66°. */
export function placidusCusps(utc: Date, latitude: number, longitude: number): number[] {
  const { asc, mc, ramc } = ascMc(utc, latitude, longitude);
  if (Math.abs(latitude) > 66) return wholeSignCusps(asc);
  const eps = obliquity(utc) * DEG;
  const phi = latitude * DEG;
  const cusp = (f: number, offset: number, above: boolean): number => {
    // f = 1/3 or 2/3 of semi-arc; iterate on RA of cusp
    let ra = (ramc + offset) * DEG;
    for (let i = 0; i < 30; i++) {
      const decl = Math.asin(Math.sin(eps) * Math.sin(ra));
      const ad = Math.asin(Math.tan(phi) * Math.tan(decl)); // ascensional difference
      const sa = above ? Math.PI / 2 + ad : Math.PI / 2 - ad; // semi-arc (diurnal / nocturnal)
      const next = (ramc * DEG) + (above ? -1 : 1) * 0 + (offset >= 0 ? 1 : -1) * f * sa * (above ? 1 : 1);
      const newRa = (ramc * DEG) + Math.sign(offset) * f * sa;
      if (Math.abs(newRa - ra) < 1e-7) { ra = newRa; break; }
      ra = newRa;
      void next;
    }
    const lon = Math.atan2(Math.sin(ra), Math.cos(ra) * Math.cos(eps)) / DEG; // RA → ecliptic longitude on the ecliptic
    return norm360(lon);
  };
  // Houses 11, 12 are 1/3 and 2/3 of the diurnal semi-arc after MC; houses 2, 3 are 1/3, 2/3 of nocturnal semi-arc after IC.
  const h11 = cusp(1 / 3, 30, true);
  const h12 = cusp(2 / 3, 60, true);
  const h2 = cusp(2 / 3, 120, false);
  const h3 = cusp(1 / 3, 150, false);
  const c = new Array<number>(12).fill(0);
  c[0] = asc; c[9] = mc; c[10] = h11; c[11] = h12; c[1] = h2; c[2] = h3;
  c[3] = norm360(mc + 180); c[4] = norm360(h11 + 180); c[5] = norm360(h12 + 180);
  c[6] = norm360(asc + 180); c[7] = norm360(h2 + 180); c[8] = norm360(h3 + 180);
  return c;
}

export function wholeSignCusps(asc: number): number[] {
  const start = Math.floor(norm360(asc) / 30) * 30;
  return Array.from({ length: 12 }, (_, i) => norm360(start + i * 30));
}

export function houseOf(lon: number, cusps: number[]): number {
  const L = norm360(lon);
  for (let i = 0; i < 12; i++) {
    const a = cusps[i]!;
    const b = cusps[(i + 1) % 12]!;
    const inSpan = a <= b ? L >= a && L < b : L >= a || L < b;
    if (inSpan) return i + 1;
  }
  return 12;
}

const ASPECTS: { type: Aspect["type"]; angle: number; orb: number }[] = [
  { type: "conjunction", angle: 0, orb: 8 }, { type: "opposition", angle: 180, orb: 8 }, { type: "trine", angle: 120, orb: 7 },
  { type: "square", angle: 90, orb: 7 }, { type: "sextile", angle: 60, orb: 5 },
];

export function aspectsBetween(positions: { planet: PlanetName; longitude: number }[], others?: { planet: PlanetName; longitude: number }[]): Aspect[] {
  const out: Aspect[] = [];
  const list2 = others ?? positions;
  for (let i = 0; i < positions.length; i++) {
    for (let j = others ? 0 : i + 1; j < list2.length; j++) {
      const p = positions[i]!, q = list2[j]!;
      let d = Math.abs(norm360(p.longitude) - norm360(q.longitude));
      if (d > 180) d = 360 - d;
      for (const asp of ASPECTS) {
        const orb = Math.abs(d - asp.angle);
        const maxOrb = (p.planet === "Sun" || p.planet === "Moon" || q.planet === "Sun" || q.planet === "Moon") ? asp.orb + 2 : asp.orb;
        if (orb <= maxOrb) { out.push({ a: p.planet, b: q.planet, type: asp.type, orb: Math.round(orb * 100) / 100 }); break; }
      }
    }
  }
  return out;
}

export function moonPhase(utc: Date): { angle: number; name: string; illumination: number } {
  const t = A.MakeTime(utc);
  const angle = A.MoonPhase(t);
  const illum = A.Illumination(A.Body.Moon, t).phase_fraction;
  const names = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
  const idx = Math.floor(((angle + 22.5) % 360) / 45);
  return { angle, name: names[idx]!, illumination: illum };
}

export function natalChart(input: NatalInput): NatalChart {
  const hs = input.houseSystem ?? "whole-sign";
  const { asc, mc } = ascMc(input.utc, input.latitude, input.longitude);
  const cusps = hs === "placidus" ? placidusCusps(input.utc, input.latitude, input.longitude) : wholeSignCusps(asc);
  const planets: PlanetPosition[] = PLANETS.map((p) => {
    const lon = eclipticLongitude(p, input.utc);
    return { planet: p, longitude: lon, sign: signOf(lon), degree: lon % 30, retrograde: isRetrograde(p, input.utc), house: houseOf(lon, cusps) };
  });
  return {
    utc: input.utc, latitude: input.latitude, longitude: input.longitude, houseSystem: hs,
    ascendant: asc, midheaven: mc, ascSign: signOf(asc), mcSign: signOf(mc), cusps, planets,
    aspects: aspectsBetween(planets), moonPhase: moonPhase(input.utc),
  };
}

/** Transits of the moment against a natal chart (used by the daily card). */
export function transits(natal: NatalChart, utc: Date): { positions: PlanetPosition[]; aspects: Aspect[]; moonPhase: NatalChart["moonPhase"] } {
  const positions = PLANETS.map((p) => {
    const lon = eclipticLongitude(p, utc);
    return { planet: p, longitude: lon, sign: signOf(lon), degree: lon % 30, retrograde: isRetrograde(p, utc), house: houseOf(lon, natal.cusps) };
  });
  return { positions, aspects: aspectsBetween(positions, natal.planets), moonPhase: moonPhase(utc) };
}
