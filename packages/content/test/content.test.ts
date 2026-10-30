import { describe, expect, it } from "vitest";
import { PACKS, getContent, lifePathText } from "../src/index.js";

const ID = /^[a-z]+\.[A-Za-z]+\.[0-9A-Za-z_-]+\.[123]$/;
describe("content pack", () => {
  it("every record has a valid id, layer and non-empty text", () => {
    for (const p of Object.values(PACKS)) for (const r of Object.values(p.records)) {
      expect(r.id).toMatch(ID);
      expect(r.locale).toBe(p.locale);
      expect(r.text.length).toBeGreaterThan(10);
      if (r.layer === 2) expect(r.text.split("\n")).toHaveLength(3);
      if (r.layer === 1) expect(r.text.split(/\s+/).length).toBeLessThanOrEqual(28);
    }
  });
  it("vi and en cover the same ids", () => {
    expect(Object.keys(PACKS.vi!.records).sort()).toEqual(Object.keys(PACKS.en!.records).sort());
  });
  it("covers life paths 1–9, 11, 22, 33 in both layers", () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]) for (const l of [1, 2] as const) {
      expect(lifePathText("vi", n, l)).toBeTruthy();
      expect(lifePathText("en", n, l)).toBeTruthy();
    }
  });
  it("falls back to English for unknown locales", () => {
    expect(getContent("ja", "numerology.lifePath.7.1")?.locale).toBe("en");
  });
});
