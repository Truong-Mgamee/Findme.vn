import deckJson from '@findme/content/tarot/deck-classic-1909.json' with { type: 'json' };
import { TarotDeckSchema, type TarotCard, type TarotDeck } from '@findme/content/schemas';

export type { TarotCard, TarotDeck };

/** The validated "Classic 1909" deck (78 cards). Throws at import time if the dataset is malformed. */
export const DECK: TarotDeck = TarotDeckSchema.parse(deckJson);

const BY_ID: ReadonlyMap<string, TarotCard> = new Map(DECK.cards.map((c) => [c.id, c]));

export function getCard(id: string): TarotCard {
  const card = BY_ID.get(id);
  if (!card) throw new Error(`Unknown tarot card id: ${id}`);
  return card;
}

export const CARD_IDS: readonly string[] = DECK.cards.map((c) => c.id);
