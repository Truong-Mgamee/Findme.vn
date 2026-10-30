/** Shared profile input → all four engines. */
import { buildTuViChart, type TuViChart } from "./tuvi/chart.js";
import { baziChart, type BaziChart } from "./bazi/pillars.js";
import { natalChart, type NatalChart } from "./astro/natal.js";
import { numerologyProfile, type NumerologyProfile } from "./numerology/core.js";
import { hourToBranch, yearGanZhi, napAm, CHI_ANIMAL_EN } from "./lunar/ganzhi.js";
import { solarToLunar } from "./lunar/hnd.js";
import { dailySeed, draw } from "./tarot/draw.js";

export type BirthTimePrecision = "exact" | "canh_gio" | "unknown";

export interface ProfileInput {
  id: string;
  displayName: string;
  /** full name for numerology; defaults to displayName */
  fullName?: string;
  gender: "male" | "female" | "other";
  /** local civil date of birth */
  year: number;
  month: number;
  day: number;
  /** local hour/minute; omit when unknown */
  hour?: number;
  minute?: number;
  /** 1..12 Tý..Hợi – alternative to hour when only the canh giờ is known */
  hourBranch?: number;
  precision: BirthTimePrecision;
  /** IANA tz is resolved by the app; the engine needs the UTC offset in hours at birth */
  utcOffsetHours: number;
  latitude?: number;
  longitude?: number;
  locale: string;
}

export interface Profile {
  input: ProfileInput;
  lunar: { day: number; month: number; year: number; leap: boolean };
  yearGanZhi: string;
  zodiacAnimalEn: string;
  menhElement: string;
  menhNapAm: { vi: string; en: string };
  hourBranch: number;
  tuvi: TuViChart | null;
  bazi: BaziChart;
  natal: NatalChart;
  numerology: NumerologyProfile;
  /** birth card = life path mapped onto the major arcana (0..21) */
  birthCardIndex: number;
}

export function buildProfile(input: ProfileInput): Profile {
  const hourBranch = input.hourBranch ?? (input.hour !== undefined ? hourToBranch(input.hour) : 1);
  const hour = input.hour ?? ((hourBranch - 1) * 2 + 23) % 24; // start of canh giờ when only branch known
  const minute = input.minute ?? 0;
  const genderTuvi = input.gender === "female" ? "female" : "male";
  const tz = input.utcOffsetHours;

  const lunar = solarToLunar(input.day, input.month, input.year, tz === 8 ? 8 : 7);
  const y = yearGanZhi(lunar.year);
  const na = napAm(y.can, y.chi);

  const tuvi = input.precision === "unknown"
    ? null
    : buildTuViChart({ day: input.day, month: input.month, year: input.year, solar: true, hourBranch, gender: genderTuvi, timeZone: tz === 8 ? 8 : 7 });

  const bazi = baziChart({ year: input.year, month: input.month, day: input.day, hour, minute, gender: genderTuvi });

  const utc = new Date(Date.UTC(input.year, input.month - 1, input.day, hour, minute) - tz * 3600e3);
  const natal = natalChart({ utc, latitude: input.latitude ?? 0, longitude: input.longitude ?? 0, houseSystem: "whole-sign" });

  const numerology = numerologyProfile({ fullName: input.fullName ?? input.displayName, day: input.day, month: input.month, year: input.year });
  const lpSum = numerology.lifePath;
  const birthCardIndex = lpSum > 21 ? lpSum - 22 + 0 : lpSum; // 22 → 0 (Fool) style mapping for master 22; 33 → 11

  return {
    input,
    lunar: { day: lunar.day, month: lunar.month, year: lunar.year, leap: lunar.leap },
    yearGanZhi: y.name,
    zodiacAnimalEn: CHI_ANIMAL_EN[y.chi] ?? "",
    menhElement: na.element,
    menhNapAm: { vi: na.vi, en: na.en },
    hourBranch,
    tuvi, bazi, natal, numerology,
    birthCardIndex: birthCardIndex === 33 ? 11 : birthCardIndex,
  };
}

export { dailySeed, draw };
