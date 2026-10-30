import { hashSeed, mulberry32 } from '@findme/engine-core';
import { DECK, type TarotCard } from './deck.js';
import { getSpread, type Spread, type SpreadId, type SpreadPosition } from './spreads.js';

export interface DrawnCard {
  position: SpreadPosition;
  card: TarotCard;
  reversed: boolean;
}

export interface Draw {
  spread: Spread;
  seed: string | number;
  cards: DrawnCard[];
}

export interface DrawOptions {
  spread: SpreadId;
  seed: string | number;
  /** Default true. When false every card is upright. */
  allowReversed?: boolean;
  /** Probability that a card is reversed. Default 0.5. */
  reversedProbability?: number;
}

export function seedToNumber(seed: string | number): number {
  return typeof seed === 'number' ? seed >>> 0 : hashSeed(seed);
}

/**
 * Deterministic draw: Fisher–Yates shuffle of the full deck with mulberry32(seed), deal the first N
 * cards, then decide reversal per card from the same RNG stream.
 */
export function drawCards(opts: DrawOptions): Draw {
  const { spread: spreadId, seed, allowReversed = true, reversedProbability = 0.5 } = opts;
  if (reversedProbability < 0 || reversedProbability > 1) throw new RangeError('reversedProbability must be within [0, 1]');
  const spread = getSpread(spreadId);
  const rnd = mulberry32(seedToNumber(seed));

  const shuffled = DECK.cards.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j] as TarotCard, shuffled[i] as TarotCard];
  }

  const cards: DrawnCard[] = spread.positions.map((position, i) => {
    const card = shuffled[i] as TarotCard;
    const reversed = allowReversed ? rnd() < reversedProbability : false;
    return { position, card, reversed };
  });

  return { spread, seed, cards };
}

/** Daily Oracle card, reproducible per (date, segment). */
export function dailyCard(dateISO: string, segmentKey: string, opts: Partial<Omit<DrawOptions, 'spread' | 'seed'>> = {}): Draw {
  return drawCards({ spread: 'one', seed: `${dateISO}:${segmentKey}`, ...opts });
}
