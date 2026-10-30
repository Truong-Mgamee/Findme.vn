import type { ContentPack, ContentRecord } from "./types.js";
import { numerologyVi } from "./vi/numerology.js";
import { numerologyEn } from "./en/numerology.js";
export * from "./types.js";

function pack(locale: string, records: ContentRecord[]): ContentPack {
  const map: Record<string, ContentRecord> = {};
  for (const r of records) {
    if (map[r.id]) throw new Error(`duplicate content id ${r.id}`);
    map[r.id] = r;
  }
  return { locale, version: 1, records: map };
}

export const PACKS: Record<string, ContentPack> = {
  vi: pack("vi", [...numerologyVi]),
  en: pack("en", [...numerologyEn]),
};

/** Look up a record with fallback to English. */
export function getContent(locale: string, id: string): ContentRecord | undefined {
  return PACKS[locale]?.records[id] ?? PACKS.en?.records[id];
}

export function lifePathText(locale: string, lifePath: number, layer: 1 | 2): string | undefined {
  return getContent(locale, `numerology.lifePath.${lifePath}.${layer}`)?.text;
}
