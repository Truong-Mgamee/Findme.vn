import type { ReadingEngineOutput } from '@findme/engine-core';
import type { Draw } from './draw.js';

export const TAROT_ENGINE_ID = 'tarot';
export const TAROT_ENGINE_VERSION = '1.0.0';

export function atomKeysForTarot(draw: Draw): string[] {
  const keys: string[] = [];
  for (const c of draw.cards) {
    keys.push(`tarot.${c.card.id}.${c.reversed ? 'reversed' : 'upright'}`);
    keys.push(`tarot.position.${draw.spread.id}.${c.position.key}`);
  }
  return keys;
}

export interface TarotFacts {
  spread: string;
  seed: string | number;
  cards: Array<{
    position: string;
    id: string;
    name_en: string;
    arcana: 'major' | 'minor';
    suit: string | null;
    number: number;
    reversed: boolean;
    keywords: string[];
    element: string;
    astrology: string;
    image: string;
  }>;
  majorCount: number;
  reversedCount: number;
  dominantSuit: string | null;
}

export function toEngineOutput(draw: Draw): ReadingEngineOutput<TarotFacts> {
  const suitCounts = new Map<string, number>();
  for (const c of draw.cards) if (c.card.suit) suitCounts.set(c.card.suit, (suitCounts.get(c.card.suit) ?? 0) + 1);
  let dominantSuit: string | null = null;
  let best = 0;
  for (const [suit, n] of suitCounts) {
    if (n > best) {
      best = n;
      dominantSuit = suit;
    }
  }
  // Only call a suit dominant when it holds at least two cards and leads outright.
  if (best < 2 || [...suitCounts.values()].filter((n) => n === best).length > 1) dominantSuit = null;

  const facts: TarotFacts = {
    spread: draw.spread.id,
    seed: draw.seed,
    cards: draw.cards.map((c) => ({
      position: c.position.key,
      id: c.card.id,
      name_en: c.card.name_en,
      arcana: c.card.arcana,
      suit: c.card.suit,
      number: c.card.number,
      reversed: c.reversed,
      keywords: c.reversed ? c.card.keywords_reversed : c.card.keywords_upright,
      element: c.card.element,
      astrology: c.card.astrology,
      image: c.card.image,
    })),
    majorCount: draw.cards.filter((c) => c.card.arcana === 'major').length,
    reversedCount: draw.cards.filter((c) => c.reversed).length,
    dominantSuit,
  };

  return {
    engine: TAROT_ENGINE_ID,
    engineVersion: TAROT_ENGINE_VERSION,
    facts,
    atomKeys: atomKeysForTarot(draw),
    confidence: 'high',
    warnings: [],
  };
}
