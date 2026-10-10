/** Shape of `profiles.core_json` — derived engine facts rendered on the "This is you" screen. */
import type { CalendarStandard, Locale, TraditionPack } from '@findme/engine-core';

export interface CoreInsight {
  /** content_atoms key, e.g. ziwei.soulstar.pojunMaj */
  key: string;
  title: string;
  body?: string;
}

export interface CorePillar {
  key: 'year' | 'month' | 'day' | 'hour';
  han: string;
  label: string;
  stem: number;
  branch: number;
}

export interface CoreEastAsia {
  pillars: CorePillar[];
  lunar: { year: number; month: number; day: number; isLeapMonth: boolean; standard: CalendarStandard; yearGanzhi: { han: string; label: string; index: number } };
  /** branch 0..11 of the (lunar) birth year — drives almanac personalisation + Daily Oracle segment */
  yearBranch: number;
  yearStem: number;
  bazi: {
    dayMaster: { stem: number; label: string; element: number; elementLabel: string; yin: boolean };
    strength: { verdict: 'strong' | 'weak' | 'balanced'; score: number };
    useful: number[];
    unfavorable: number[];
    confidence: string;
  };
  ziwei: {
    school: string;
    soul: { key: string; name: string };
    body: { key: string; name: string };
    fiveElementsClass: { key: string; name: string };
    soulPalaceBranch: { key: string; name: string; index: number };
    patterns: string[];
    warnings: string[];
    confidence: string;
  };
}

export interface CoreWestern {
  numerology: {
    lifePath: number;
    lifePathMaster: boolean;
    birthday: number;
    expression: number | null;
    soulUrge: number | null;
    personalDay: { date: string; value: number };
    personalYear: number;
    nameSupported: boolean;
  };
  astro: {
    sun: string;
    moon: string;
    /** null when birth time unknown */
    rising: string | null;
    timeKnown: boolean;
    moonApproximate: boolean;
  };
}

export interface CoreJson {
  version: 1;
  computedAt: string;
  locale: Locale;
  traditionPack: TraditionPack;
  calendarStandard: CalendarStandard;
  timeKnown: boolean;
  eastAsia?: CoreEastAsia;
  western?: CoreWestern;
  /** exactly 3 LLM-free facts */
  insights: CoreInsight[];
  warnings: Array<{ code: string; message: string }>;
}
