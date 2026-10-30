import type { ReadingEngineOutput } from '@findme/engine-core';
import type { Cast } from './cast.js';
import { TRIGRAMS } from './lookup.js';

export const ICHING_ENGINE_ID = 'iching';
export const ICHING_ENGINE_VERSION = '1.0.0';

export function atomKeysForIching(cast: Cast): string[] {
  const keys = [`iching.hex.${cast.primary.number}`];
  for (const p of cast.changingLines) keys.push(`iching.hex.${cast.primary.number}.line.${p}`);
  if (cast.relating) keys.push(`iching.hex.${cast.relating.number}.relating`);
  return keys;
}

export interface IchingFacts {
  method: Cast['method'];
  seed: string | number;
  lines: number[];
  primary: { number: number; name_zh: string; name_pinyin: string; name_en: string; name_en_modern: string; binary: string; upper: string; lower: string };
  changingLines: number[];
  changingLineTexts: Array<{ position: number; text_en: string }>;
  relating: { number: number; name_zh: string; name_pinyin: string; name_en: string; name_en_modern: string; binary: string } | null;
  judgment_en: string;
  image_en: string;
}

export function toEngineOutput(cast: Cast): ReadingEngineOutput<IchingFacts> {
  const p = cast.primary;
  const facts: IchingFacts = {
    method: cast.method,
    seed: cast.seed,
    lines: cast.lines.slice(),
    primary: {
      number: p.number,
      name_zh: p.name_zh,
      name_pinyin: p.name_pinyin,
      name_en: p.name_en,
      name_en_modern: p.name_en_modern,
      binary: p.lines_binary,
      upper: TRIGRAMS[p.upper_trigram].name_en,
      lower: TRIGRAMS[p.lower_trigram].name_en,
    },
    changingLines: cast.changingLines.slice(),
    changingLineTexts: cast.changingLines.map((pos) => ({ position: pos, text_en: p.lines[pos - 1]?.text_en ?? '' })),
    relating: cast.relating
      ? {
          number: cast.relating.number,
          name_zh: cast.relating.name_zh,
          name_pinyin: cast.relating.name_pinyin,
          name_en: cast.relating.name_en,
          name_en_modern: cast.relating.name_en_modern,
          binary: cast.relating.lines_binary,
        }
      : null,
    judgment_en: p.judgment_en,
    image_en: p.image_en,
  };
  const warnings: ReadingEngineOutput['warnings'] = [];
  if (cast.changingLines.length >= 4)
    warnings.push({ code: 'many_changing_lines', message: `${cast.changingLines.length} changing lines; interpretation conventions differ (relating hexagram emphasised).` });
  return {
    engine: ICHING_ENGINE_ID,
    engineVersion: ICHING_ENGINE_VERSION,
    facts,
    atomKeys: atomKeysForIching(cast),
    confidence: 'high',
    warnings,
  };
}
