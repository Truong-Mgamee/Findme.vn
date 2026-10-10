import { describe, expect, it } from 'vitest';
import { TarotDeckSchema } from '@findme/content/schemas';
import deckJson from '@findme/content/tarot/deck-classic-1909.json' with { type: 'json' };
import {
  CARD_IDS,
  DECK,
  SPREADS,
  SPREAD_IDS,
  atomKeysForTarot,
  dailyCard,
  drawCards,
  getCard,
  toEngineOutput,
} from '../src/index.js';

describe('deck dataset', () => {
  it('validates against the zod schema', () => {
    const r = TarotDeckSchema.safeParse(deckJson);
    if (!r.success) console.error(r.error.issues.slice(0, 10));
    expect(r.success).toBe(true);
  });

  it('has 78 unique ids: 22 majors + 4 suits x 14', () => {
    expect(DECK.cards).toHaveLength(78);
    expect(new Set(CARD_IDS).size).toBe(78);
    expect(DECK.cards.filter((c) => c.arcana === 'major')).toHaveLength(22);
    for (const suit of ['wands', 'cups', 'swords', 'pentacles']) {
      const cards = DECK.cards.filter((c) => c.suit === suit);
      expect(cards).toHaveLength(14);
      expect(cards.map((c) => c.number).sort((a, b) => a - b)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
    }
    expect(DECK.cards.filter((c) => c.arcana === 'major').map((c) => c.number).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 22 }, (_, i) => i),
    );
  });

  it('court cards use 11 page / 12 knight / 13 queen / 14 king', () => {
    expect(getCard('wands-11').name_en).toBe('Page of Wands');
    expect(getCard('cups-12').name_en).toBe('Knight of Cups');
    expect(getCard('swords-13').name_en).toBe('Queen of Swords');
    expect(getCard('pentacles-14').name_en).toBe('King of Pentacles');
    expect(getCard('major-00').name_en).toBe('The Fool');
    expect(getCard('major-21').name_en).toBe('The World');
    expect(() => getCard('major-22')).toThrow();
  });

  it('every card has keywords, image path and a Waite excerpt', () => {
    for (const c of DECK.cards) {
      expect(c.keywords_upright.length).toBeGreaterThanOrEqual(3);
      expect(c.keywords_reversed.length).toBeGreaterThanOrEqual(3);
      expect(c.image).toBe(`classic-1909/${c.id}.webp`);
      expect(c.waite_pd_excerpt.length).toBeGreaterThan(20);
    }
  });
});

describe('spreads', () => {
  it('defines one/three/five/celticCross with expected positions', () => {
    expect(SPREAD_IDS).toEqual(['one', 'three', 'five', 'celticCross']);
    expect(SPREADS.one.positions).toHaveLength(1);
    expect(SPREADS.three.positions.map((p) => p.key)).toEqual(['past', 'present', 'future']);
    expect(SPREADS.five.positions.map((p) => p.key)).toEqual(['situation', 'challenge', 'advice', 'outcome', 'hidden']);
    expect(SPREADS.celticCross.positions).toHaveLength(10);
    for (const s of Object.values(SPREADS)) expect(new Set(s.positions.map((p) => p.key)).size).toBe(s.positions.length);
  });
});

describe('drawCards', () => {
  it('is deterministic for the same seed', () => {
    const a = drawCards({ spread: 'three', seed: '2026-10-10:w:common' });
    const b = drawCards({ spread: 'three', seed: '2026-10-10:w:common' });
    expect(a.cards.map((c) => [c.card.id, c.reversed])).toEqual(b.cards.map((c) => [c.card.id, c.reversed]));
    expect(a.cards.map((c) => c.position.key)).toEqual(['past', 'present', 'future']);
  });

  it('accepts numeric seeds deterministically', () => {
    expect(drawCards({ spread: 'five', seed: 42 }).cards.map((c) => c.card.id)).toEqual(
      drawCards({ spread: 'five', seed: 42 }).cards.map((c) => c.card.id),
    );
  });

  it('differs across seeds', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 20; i++) ids.add(drawCards({ spread: 'three', seed: `seed-${i}` }).cards.map((c) => c.card.id).join(','));
    expect(ids.size).toBeGreaterThan(15);
  });

  it('celticCross returns 10 distinct cards', () => {
    const d = drawCards({ spread: 'celticCross', seed: 'cc' });
    expect(d.cards).toHaveLength(10);
    expect(new Set(d.cards.map((c) => c.card.id)).size).toBe(10);
  });

  it('never deals duplicates across many seeds', () => {
    for (let i = 0; i < 200; i++) {
      const d = drawCards({ spread: 'celticCross', seed: i });
      expect(new Set(d.cards.map((c) => c.card.id)).size).toBe(10);
    }
  });

  it('reversed ratio over 2000 one-card draws is between 0.45 and 0.55', () => {
    let reversed = 0;
    for (let i = 0; i < 2000; i++) if (drawCards({ spread: 'one', seed: `r-${i}` }).cards[0]!.reversed) reversed++;
    const ratio = reversed / 2000;
    expect(ratio).toBeGreaterThan(0.45);
    expect(ratio).toBeLessThan(0.55);
  });

  it('respects allowReversed=false and custom probability', () => {
    for (let i = 0; i < 100; i++) {
      expect(drawCards({ spread: 'three', seed: i, allowReversed: false }).cards.every((c) => !c.reversed)).toBe(true);
      expect(drawCards({ spread: 'three', seed: i, reversedProbability: 0 }).cards.every((c) => !c.reversed)).toBe(true);
      expect(drawCards({ spread: 'three', seed: i, reversedProbability: 1 }).cards.every((c) => c.reversed)).toBe(true);
    }
    expect(() => drawCards({ spread: 'one', seed: 1, reversedProbability: 1.5 })).toThrow(RangeError);
  });

  it('spreads out across the deck (every card appears over many seeds)', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) seen.add(drawCards({ spread: 'one', seed: `c-${i}` }).cards[0]!.card.id);
    expect(seen.size).toBe(78);
  });
});

describe('dailyCard', () => {
  it('is deterministic per (date, segment) and uses seed `${date}:${segment}`', () => {
    const a = dailyCard('2026-10-10', 'w:common');
    const b = dailyCard('2026-10-10', 'w:common');
    const c = drawCards({ spread: 'one', seed: '2026-10-10:w:common' });
    expect(a.seed).toBe('2026-10-10:w:common');
    expect(a.cards[0]!.card.id).toBe(b.cards[0]!.card.id);
    expect(a.cards[0]!.reversed).toBe(b.cards[0]!.reversed);
    expect(a.cards[0]!.card.id).toBe(c.cards[0]!.card.id);
    expect(a.spread.id).toBe('one');
  });

  it('changes across dates or segments', () => {
    const base = dailyCard('2026-10-10', 'w:common').cards[0]!.card.id;
    const others = [dailyCard('2026-10-11', 'w:common'), dailyCard('2026-10-12', 'w:common'), dailyCard('2026-10-10', 'm:common'), dailyCard('2026-10-10', 'w:vn')];
    expect(others.some((d) => d.cards[0]!.card.id !== base)).toBe(true);
  });
});

describe('atoms + engine output', () => {
  it('produces card and position keys', () => {
    const d = drawCards({ spread: 'three', seed: 'atoms' });
    const keys = atomKeysForTarot(d);
    expect(keys).toHaveLength(6);
    d.cards.forEach((c, i) => {
      expect(keys[i * 2]).toBe(`tarot.${c.card.id}.${c.reversed ? 'reversed' : 'upright'}`);
      expect(keys[i * 2 + 1]).toBe(`tarot.position.three.${c.position.key}`);
    });
    expect(keys.filter((k) => k.startsWith('tarot.position.three.'))).toEqual([
      'tarot.position.three.past',
      'tarot.position.three.present',
      'tarot.position.three.future',
    ]);
  });

  it('toEngineOutput exposes engine id/version/facts', () => {
    const d = drawCards({ spread: 'celticCross', seed: 'out' });
    const out = toEngineOutput(d);
    expect(out.engine).toBe('tarot');
    expect(out.engineVersion).toBe('1.0.0');
    expect(out.facts.cards).toHaveLength(10);
    expect(out.facts.spread).toBe('celticCross');
    expect(out.atomKeys).toEqual(atomKeysForTarot(d));
    expect(out.confidence).toBe('high');
    expect(out.warnings).toEqual([]);
    expect(out.facts.majorCount + out.facts.cards.filter((c) => c.arcana === 'minor').length).toBe(10);
    expect(out.facts.reversedCount).toBe(d.cards.filter((c) => c.reversed).length);
  });
});
