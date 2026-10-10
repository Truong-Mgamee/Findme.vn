/** Compatibility of two profiles across systems. Symmetric: compare(a,b) === compare(b,a). */
import type { Profile } from "../profile.js";
import { elementRelation, type Element } from "../lunar/ganzhi.js";
import { aspectsBetween } from "../astro/natal.js";
import { SIGN_ELEMENT } from "../astro/natal.js";

export interface Compatibility {
  elementScore: number; // 0..100 nạp âm mệnh relation
  branchScore: number; // 0..100 tam hợp / lục hợp / xung
  sunSignScore: number; // 0..100 western elements
  synastryScore: number; // 0..100 from harmonious vs hard aspects
  lifePathScore: number; // 0..100
  overall: number;
  details: { menhRelation: string; branchRelation: string; synastryAspects: number };
}

const LIU_HE: [number, number][] = [[1, 2], [3, 12], [4, 11], [5, 10], [6, 9], [7, 8]];
const SAN_HE: number[][] = [[1, 5, 9], [3, 7, 11], [2, 6, 10], [4, 8, 12]];
const LP_GOOD: Record<number, number[]> = { 1: [1, 5, 7], 2: [2, 4, 8], 3: [3, 6, 9], 4: [2, 4, 8], 5: [1, 5, 7], 6: [3, 6, 9], 7: [1, 5, 7], 8: [2, 4, 8], 9: [3, 6, 9], 11: [2, 11, 22], 22: [4, 11, 22], 33: [6, 33, 9] };

function branchRelation(a: number, b: number): { score: number; label: string } {
  if (a === b) return { score: 60, label: "cùng tuổi" };
  if (LIU_HE.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return { score: 90, label: "lục hợp" };
  if (SAN_HE.some((g) => g.includes(a) && g.includes(b))) return { score: 85, label: "tam hợp" };
  if ((a + 6 - 1) % 12 + 1 === b) return { score: 25, label: "lục xung" };
  if ((a + 3 - 1) % 12 + 1 === b || (b + 3 - 1) % 12 + 1 === a) return { score: 40, label: "tứ hành xung" };
  return { score: 60, label: "bình thường" };
}

export function compare(a: Profile, b: Profile): Compatibility {
  const relAB = elementRelation(a.menhElement as Element, b.menhElement as Element);
  const elementScore = relAB === 0 ? 70 : Math.abs(relAB) === 1 || Math.abs(relAB) === 2 ? (relAB > 0 ? 85 : 35) : 50;
  const menhRelation = relAB === 0 ? "tương hòa" : relAB > 0 ? "tương sinh" : "tương khắc";
  const ba = ((a.lunar.year + 8) % 12) + 1, bb = ((b.lunar.year + 8) % 12) + 1;
  const br = branchRelation(ba, bb);
  const sa = SIGN_ELEMENT[a.natal.planets[0]!.sign], sb = SIGN_ELEMENT[b.natal.planets[0]!.sign];
  const compatible: Record<string, string[]> = { fire: ["fire", "air"], air: ["air", "fire"], earth: ["earth", "water"], water: ["water", "earth"] };
  const sunSignScore = sa === sb ? 75 : compatible[sa]!.includes(sb) ? 80 : 50;
  const asp = aspectsBetween(a.natal.planets, b.natal.planets).filter((x) => ["Sun", "Moon", "Venus", "Mars"].includes(x.a) && ["Sun", "Moon", "Venus", "Mars"].includes(x.b));
  const good = asp.filter((x) => ["trine", "sextile", "conjunction"].includes(x.type)).length;
  const hard = asp.length - good;
  const synastryScore = Math.max(20, Math.min(95, 55 + good * 8 - hard * 6));
  const la = a.numerology.lifePath, lb = b.numerology.lifePath;
  const lifePathScore = la === lb ? 75 : (LP_GOOD[la] ?? []).includes(lb) || (LP_GOOD[lb] ?? []).includes(la) ? 85 : 55;
  const overall = Math.round(0.25 * elementScore + 0.2 * br.score + 0.15 * sunSignScore + 0.25 * synastryScore + 0.15 * lifePathScore);
  return { elementScore, branchScore: br.score, sunSignScore, synastryScore, lifePathScore, overall, details: { menhRelation, branchRelation: br.label, synastryAspects: asp.length } };
}
