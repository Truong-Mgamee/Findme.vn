import { DECK, type TarotCard } from "./deck.js";

/** Small, fast, deterministic PRNG (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 32-bit string hash → seed. */
export function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface DrawnCard {
  card: TarotCard;
  reversed: boolean;
  position: number;
}

export interface SpreadPosition { key: string; labelEn: string }
export interface Spread { id: string; nameEn: string; positions: SpreadPosition[] }

export const SPREADS: Record<string, Spread> = {
  daily: { id: "daily", nameEn: "Card of the day", positions: [{ key: "today", labelEn: "Today" }] },
  three: {
    id: "three", nameEn: "Past · Present · Future",
    positions: [{ key: "past", labelEn: "Past" }, { key: "present", labelEn: "Present" }, { key: "future", labelEn: "Future" }],
  },
  love: {
    id: "love", nameEn: "Relationship",
    positions: [{ key: "you", labelEn: "You" }, { key: "them", labelEn: "Them" }, { key: "bond", labelEn: "The bond" }, { key: "advice", labelEn: "Advice" }],
  },
  celtic: {
    id: "celtic", nameEn: "Celtic Cross",
    positions: [
      { key: "present", labelEn: "Present" }, { key: "challenge", labelEn: "Challenge" }, { key: "past", labelEn: "Past" },
      { key: "future", labelEn: "Near future" }, { key: "above", labelEn: "Conscious goal" }, { key: "below", labelEn: "Subconscious" },
      { key: "advice", labelEn: "Advice" }, { key: "external", labelEn: "External influences" }, { key: "hopes", labelEn: "Hopes and fears" },
      { key: "outcome", labelEn: "Outcome" },
    ],
  },
};

/** Draw `count` distinct cards from a seed. Same seed ⇒ same draw (used for the daily card: seed = userId + date). */
export function draw(seed: string | number, count: number, reversedRate = 0.3): DrawnCard[] {
  const rng = mulberry32(typeof seed === "number" ? seed : hashSeed(seed));
  const idx = DECK.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j]!, idx[i]!];
  }
  return idx.slice(0, count).map((ci, position) => ({ card: DECK[ci]!, reversed: rng() < reversedRate, position }));
}

export function drawSpread(seed: string | number, spreadId: keyof typeof SPREADS | string): { spread: Spread; cards: DrawnCard[] } {
  const spread = SPREADS[spreadId];
  if (!spread) throw new Error(`Unknown spread ${spreadId}`);
  return { spread, cards: draw(seed, spread.positions.length) };
}

/** Daily card seed convention shared by client and server. */
export function dailySeed(userId: string, isoDate: string): string {
  return `${userId}|${isoDate}|daily`;
}
