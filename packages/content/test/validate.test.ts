import { describe, expect, it } from 'vitest';
import tarot from '../tarot/deck-classic-1909.json' with { type: 'json' };
import iching from '../iching/hexagrams.json' with { type: 'json' };
import { HexagramSetSchema, TarotDeckSchema, validateDatasets } from '../src/index.js';

describe('content datasets', () => {
  it('tarot deck-classic-1909.json validates (78 cards)', () => {
    const r = TarotDeckSchema.safeParse(tarot);
    if (!r.success) console.error(r.error.issues.slice(0, 20));
    expect(r.success).toBe(true);
  });

  it('iching hexagrams.json validates (64 hexagrams)', () => {
    const r = HexagramSetSchema.safeParse(iching);
    if (!r.success) console.error(r.error.issues.slice(0, 20));
    expect(r.success).toBe(true);
  });

  it('validateDatasets reports ok and lists issues for broken input', () => {
    expect(validateDatasets({ tarot, iching })).toEqual({ ok: true, issues: [] });
    const broken = validateDatasets({ tarot: { deck: 'classic-1909', cards: [] }, iching: { source: 'x', hexagrams: [] } });
    expect(broken.ok).toBe(false);
    expect(broken.issues.some((i) => i.startsWith('tarot:'))).toBe(true);
    expect(broken.issues.some((i) => i.startsWith('iching:'))).toBe(true);
  });

  it('schema catches a wrong trigram/binary pairing', () => {
    const h = structuredClone((iching as { hexagrams: Array<Record<string, unknown>> }).hexagrams);
    h[2]!.lines_binary = '010100';
    expect(HexagramSetSchema.safeParse({ source: 's', hexagrams: h }).success).toBe(false);
  });
});
