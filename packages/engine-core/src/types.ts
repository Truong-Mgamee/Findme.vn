/**
 * Shared domain types for all Findme engines.
 * Three independent axes: Locale (UI/content language), TraditionPack (which systems the
 * user wants), CalendarStandard (which national lunisolar calendar rules apply).
 */
export const LOCALES = ['vi', 'en', 'es', 'pt-BR', 'ja', 'ko', 'zh-TW', 'zh-CN', 'hi', 'th', 'id', 'fr', 'de'] as const;
export type Locale = (typeof LOCALES)[number];

export const TRADITION_PACKS = ['eastAsia', 'western', 'both'] as const;
export type TraditionPack = (typeof TRADITION_PACKS)[number];

/** vn = UTC+7 (Hồ Ngọc Đức rules), cn = UTC+8 (PRC/TW/HK), kr = UTC+9 (KASI), jp = UTC+9 */
export const CALENDAR_STANDARDS = ['vn', 'cn', 'kr', 'jp'] as const;
export type CalendarStandard = (typeof CALENDAR_STANDARDS)[number];

export type Gender = 'male' | 'female' | 'other';

export interface BirthPlace {
  name: string;
  lat: number;
  lng: number;
  /** IANA tz id, e.g. "Asia/Ho_Chi_Minh". Resolved from lat/lng when missing. */
  tz?: string;
  /** ISO 3166-1 alpha-2 */
  country?: string;
}

export interface BirthInput {
  /** Gregorian date in local civil time of the birthplace: YYYY-MM-DD */
  date: string;
  /** HH:mm local civil time. Omit when timeUnknown. */
  time?: string;
  timeUnknown: boolean;
  gender: Gender;
  place: BirthPlace;
  /** Apply equation-of-time + longitude correction for Bazi/Ziwei hour pillar. Default true. */
  useTrueSolarTime?: boolean;
  calendarStandard: CalendarStandard;
}

export type Confidence = 'high' | 'medium' | 'low';

export interface EngineWarning {
  code: string;
  message: string;
}

export interface Engine<I, O> {
  id: string;
  version: string;
  compute(input: I): O;
}

/** Every engine output that feeds the AI composer must expose facts + atom keys. */
export interface ReadingEngineOutput<F = Record<string, unknown>> {
  engine: string;
  engineVersion: string;
  facts: F;
  /** content_atoms keys relevant to this result, in display order */
  atomKeys: string[];
  confidence: Confidence;
  warnings: EngineWarning[];
}

export type ReadingKind =
  | 'daily'
  | 'ziwei_full'
  | 'bazi_luck'
  | 'tarot_spread'
  | 'numerology_full'
  | 'iching'
  | 'compatibility'
  | 'almanac_pick';

export interface ReadingInput {
  kind: ReadingKind;
  locale: Locale;
  profile: BirthInput;
  partner?: BirthInput;
  params?: Record<string, unknown>;
}

/** Localized label bundle: Han (source), plus per-locale rendering. */
export interface Term {
  key: string;
  han: string;
  labels: Partial<Record<Locale, string>>;
}

/** Sexagenary cycle element: index 0..59 (甲子=0) */
export interface GanZhi {
  index: number;
  /** stem index 0..9 (甲=0) */
  stem: number;
  /** branch index 0..11 (子=0) */
  branch: number;
  han: string;
}

export interface LunarDate {
  year: number;
  month: number;
  isLeapMonth: boolean;
  day: number;
  /** civil hour branch 0..11 (子=0), null if time unknown */
  hourBranch: number | null;
  standard: CalendarStandard;
}
