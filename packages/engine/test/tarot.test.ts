import { describe, expect, it } from "vitest";
import { DECK, cardById } from "../src/tarot/deck.js";
import { dailySeed, draw, drawSpread, hashSeed } from "../src/tarot/draw.js";

describe("tarot", () => {
  it("has 78 unique cards: 22 major + 56 minor", () => {
    expect(DECK).toHaveLength(78);
    expect(new Set(DECK.map((c) => c.id)).size).toBe(78);
    expect(DECK.filter((c) => c.arcana === "major")).toHaveLength(22);
    expect(cardById("major-00")?.nameEn).toBe("The Fool");
    expect(cardById("cups-queen")?.nameEn).toBe("Queen of Cups");
    expect(DECK[77]?.id).toBe("pentacles-king");
  });
  it("draws deterministically from a seed", () => {
    const a = draw(dailySeed("user-1", "2026-10-10"), 3);
    const b = draw(dailySeed("user-1", "2026-10-10"), 3);
    expect(a.map((c) => `${c.card.id}${c.reversed ? "r" : ""}`)).toEqual(b.map((c) => `${c.card.id}${c.reversed ? "r" : ""}`));
    expect(draw(dailySeed("user-1", "2026-10-11"), 3)[0]!.card.id).not.toBe(a[0]!.card.id);
  });
  it("never repeats a card inside one draw", () => {
    for (let i = 0; i < 200; i++) {
      const d = draw(i, 10);
      expect(new Set(d.map((c) => c.card.id)).size).toBe(10);
    }
  });
  it("reversal rate is roughly 30 %", () => {
    let rev = 0, n = 0;
    for (let i = 0; i < 500; i++) for (const c of draw(i, 5)) { n++; if (c.reversed) rev++; }
    expect(rev / n).toBeGreaterThan(0.24);
    expect(rev / n).toBeLessThan(0.36);
  });
  it("fills every spread position", () => {
    const s = drawSpread("x", "celtic");
    expect(s.cards).toHaveLength(10);
    expect(s.cards.map((c) => c.position)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(hashSeed("a")).not.toBe(hashSeed("b"));
  });
});
