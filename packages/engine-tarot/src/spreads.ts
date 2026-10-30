export interface SpreadPosition {
  key: string;
  label_en: string;
}

export interface Spread {
  id: SpreadId;
  positions: SpreadPosition[];
}

export const SPREAD_IDS = ['one', 'three', 'five', 'celticCross'] as const;
export type SpreadId = (typeof SPREAD_IDS)[number];

export const SPREADS: Record<SpreadId, Spread> = {
  one: { id: 'one', positions: [{ key: 'card', label_en: 'The card' }] },
  three: {
    id: 'three',
    positions: [
      { key: 'past', label_en: 'Past' },
      { key: 'present', label_en: 'Present' },
      { key: 'future', label_en: 'Future' },
    ],
  },
  five: {
    id: 'five',
    positions: [
      { key: 'situation', label_en: 'Situation' },
      { key: 'challenge', label_en: 'Challenge' },
      { key: 'advice', label_en: 'Advice' },
      { key: 'outcome', label_en: 'Outcome' },
      { key: 'hidden', label_en: 'Hidden influence' },
    ],
  },
  celticCross: {
    id: 'celticCross',
    positions: [
      { key: 'present', label_en: 'Present situation' },
      { key: 'challenge', label_en: 'Crossing challenge' },
      { key: 'foundation', label_en: 'Foundation (distant past)' },
      { key: 'recentPast', label_en: 'Recent past' },
      { key: 'crown', label_en: 'Best outcome / conscious goal' },
      { key: 'nearFuture', label_en: 'Near future' },
      { key: 'self', label_en: 'You / your attitude' },
      { key: 'environment', label_en: 'External influences' },
      { key: 'hopesFears', label_en: 'Hopes and fears' },
      { key: 'outcome', label_en: 'Final outcome' },
    ],
  },
};

export function getSpread(id: SpreadId): Spread {
  const s = SPREADS[id];
  if (!s) throw new Error(`Unknown spread: ${id}`);
  return s;
}
