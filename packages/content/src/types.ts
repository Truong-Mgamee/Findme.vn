/** Content pack record – see docs/plan/03-B3-data-sources.md §1.5 */
export type Layer = 1 | 2 | 3;
export interface ContentRecord {
  /** e.g. "numerology.lifePath.7.1" */
  id: string;
  locale: string;
  layer: Layer;
  /** layer 1: one sentence; layer 2: 3 bullets joined by "\n"; layer 3: paragraph */
  text: string;
  tags: string[];
  source_note: string;
  status: "draft" | "approved";
  version: number;
}
export interface ContentPack {
  locale: string;
  version: number;
  records: Record<string, ContentRecord>;
}
