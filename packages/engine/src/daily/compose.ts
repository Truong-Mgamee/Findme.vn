/**
 * Daily card = f(profile, date). Produces scores + structured "slots" that the app renders through
 * locale templates (ICU). No prose here – all words come from the content pack.
 */
import type { Profile } from "../profile.js";
import { dayAlmanac, type DayAlmanac } from "../lunar/almanac.js";
import { transits, type Aspect } from "../astro/natal.js";
import { personalDay } from "../numerology/core.js";
import { dailySeed, draw, type DrawnCard } from "../tarot/draw.js";
import { elementRelation, type Element } from "../lunar/ganzhi.js";

export interface DailyScores { love: number; work: number; money: number; health: number; overall: number }

export interface DailyCard {
  date: string; // YYYY-MM-DD local
  almanac: DayAlmanac;
  /** relation of the day's element to the user's mệnh element */
  dayVsMenh: "sinh" | "được sinh" | "khắc" | "bị khắc" | "hòa";
  clashWithUser: boolean;
  personalDay: number;
  tarot: DrawnCard;
  moonPhase: string;
  /** strongest transit aspect to natal Sun/Moon/Venus/Mars, if any */
  keyTransit: Aspect | null;
  scores: DailyScores;
  luckyNumber: number;
  luckyColorKey: Element;
  goodHours: number[];
}

const clamp = (v: number) => Math.max(1, Math.min(5, Math.round(v)));

export function dailyCard(profile: Profile, date: { year: number; month: number; day: number }, utcOffsetHours = profile.input.utcOffsetHours): DailyCard {
  const almanac = dayAlmanac(date.day, date.month, date.year);
  const iso = `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
  const menh = profile.menhElement as Element;
  const rel = elementRelation(almanac.dayElement, menh);
  const dayVsMenh = rel === 1 ? "sinh" : rel === 2 ? "được sinh" : rel === -1 ? "khắc" : rel === -2 ? "bị khắc" : "hòa";
  const userBranch = ((profile.lunar.year + 8) % 12) + 1;
  const clashWithUser = almanac.clashBranch === userBranch;
  const pd = personalDay(profile.input.day, profile.input.month, profile.input.year, date.month, date.day);
  const tarot = draw(dailySeed(profile.input.id, iso), 1)[0]!;
  const noonUtc = new Date(Date.UTC(date.year, date.month - 1, date.day, 12) - utcOffsetHours * 3600e3);
  const tr = transits(profile.natal, noonUtc);
  const key = tr.aspects
    .filter((a) => ["Sun", "Moon", "Venus", "Mars"].includes(a.b) && a.a !== "Moon")
    .sort((a, b) => a.orb - b.orb)[0] ?? null;

  // scoring: almanac 40 %, element relation 25 %, transit 20 %, tarot 15 %
  const base = almanac.score / 20; // 0..5
  const relScore = rel === 1 ? 4.5 : rel === 2 ? 4 : rel === 0 ? 3.5 : rel === -2 ? 2.5 : 2;
  const harmonious = new Set(["trine", "sextile", "conjunction"]);
  const trScore = key ? (harmonious.has(key.type) ? 4.5 : 2.5) : 3.2;
  const tarotScore = tarot.reversed ? 2.6 : 3.8;
  const overall = 0.4 * base + 0.25 * relScore + 0.2 * trScore + 0.15 * tarotScore;
  const clashPenalty = clashWithUser ? 0.8 : 0;
  const venusBoost = key && key.b === "Venus" ? (harmonious.has(key.type) ? 0.6 : -0.5) : 0;
  const marsBoost = key && key.b === "Mars" ? (harmonious.has(key.type) ? 0.5 : -0.5) : 0;
  const scores: DailyScores = {
    love: clamp(overall + venusBoost + (pd === 2 || pd === 6 ? 0.4 : 0) - clashPenalty),
    work: clamp(overall + marsBoost + (pd === 1 || pd === 8 ? 0.4 : 0) - clashPenalty),
    money: clamp(overall + (pd === 8 || pd === 4 ? 0.5 : 0) + (almanac.truc.zh === "成" || almanac.truc.zh === "开" ? 0.3 : 0) - clashPenalty),
    health: clamp(overall + (pd === 7 || pd === 9 ? 0.2 : 0) + (rel === -2 ? -0.4 : 0)),
    overall: clamp(overall - clashPenalty),
  };
  return {
    date: iso, almanac, dayVsMenh, clashWithUser, personalDay: pd, tarot, moonPhase: tr.moonPhase.name, keyTransit: key,
    scores, luckyNumber: ((pd + profile.numerology.lifePath) % 9) + 1, luckyColorKey: almanac.dayElement, goodHours: almanac.goodHours,
  };
}
