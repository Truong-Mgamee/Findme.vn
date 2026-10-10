import { DECK, type TarotCard } from '@findme/engine-tarot';

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/** 'The Fool' → 'the-fool', 'Ace of Wands' → 'ace-of-wands' */
export function cardSlug(card: TarotCard): string {
  return slugify(card.name_en);
}

const BY_SLUG = new Map<string, TarotCard>(DECK.cards.map((c) => [cardSlug(c), c]));

export function cardBySlug(slug: string): TarotCard | undefined {
  return BY_SLUG.get(slug) ?? DECK.cards.find((c) => c.id === slug);
}

export const ALL_CARD_SLUGS: string[] = DECK.cards.map(cardSlug);

/** Deck art is not shipped yet (docs/03: classic 1909 scans to be hosted on the CDN). Until then a placeholder SVG. */
export const CARD_IMAGE_PLACEHOLDER = '/tarot-placeholder.svg';

export function cardImage(card: TarotCard): string {
  const cdn = process.env.NEXT_PUBLIC_TAROT_CDN;
  return cdn ? `${cdn.replace(/\/+$/, '')}/${card.image}` : CARD_IMAGE_PLACEHOLDER;
}

export function cardNumeral(card: TarotCard): string {
  if (card.arcana === 'major') return ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'][card.number] ?? String(card.number);
  return String(card.number);
}
