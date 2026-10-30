# I Ching dataset sources

`hexagrams.json` holds the 64 hexagrams in **King Wen order** with trigram decomposition and short
English paraphrases of the Judgment (彖/卦辭), the Image (大象) and each of the six line statements
(爻辭). Vietnamese fields (`name_vi`, `text_vi`) are intentionally empty; they are filled by the
content-atoms pipeline (P7/P13), never copied from modern copyrighted translations.

## Text sources (all public domain)

| Source | Status | Used for |
|---|---|---|
| James Legge, *The Yî King*, Sacred Books of the East vol. XVI (Oxford: Clarendon Press, 1882; 2nd ed. 1899) | Public domain worldwide (Legge d. 1897) | `name_en` (Legge's romanised titles, simplified ASCII spelling: Khien, Khwăn, Kun, Măng, Hsü, Sung, Sze, Pî … Ki Tsi, Wei Tsi), `judgment_en`, `image_en`, `lines[].text_en` — all **paraphrased** into one or two modern sentences, not quoted verbatim |
| Full text online: <https://sacred-texts.com/ich/> (Legge), <https://www.gutenberg.org/ebooks/16500> | — | reference |
| 周易 received text (Zhouyi, Han dynasty recension) | Public domain | `name_zh`, trigram structure, line yin/yang patterns |
| Hanyu pinyin romanisation | — | `name_pinyin` |

`name_en_modern` gives the conventional modern English title (e.g. "The Creative", "The Receptive",
"Difficulty at the Beginning"). These short descriptive titles are in common use across many
translations and are treated as uncopyrightable titles; no translator's commentary or body text
from any in-copyright edition (Wilhelm/Baynes 1950, Lynn, Rutt, Huang, etc.) is included.

## Structure

- `lines_binary`: 6 characters, **bottom line first**, `1` = yang (solid), `0` = yin (broken).
  `lines_binary = TRIGRAM[lower] + TRIGRAM[upper]`.
- Trigram binaries (bottom→top): qian 乾 `111`, dui 兌 `110`, li 離 `101`, zhen 震 `100`,
  xun 巽 `011`, kan 坎 `010`, gen 艮 `001`, kun 坤 `000`.
- Spot checks: 1 = `111111`, 2 = `000000`, 3 Zhun = `100010` (lower zhen, upper kan),
  4 Meng = `010001`, 11 Tai = `111000`, 12 Pi = `000111`, 63 Jiji = `101010`, 64 Weiji = `010101`.
- The full 8×8 upper/lower → King Wen number grid is asserted in
  `packages/engine-iching/test/iching.test.ts` and the schema in `packages/content/src/schemas.ts`
  re-derives `lines_binary` from the trigram pair.

## Vietnamese translations — note for the content team

Ngô Tất Tố's *Kinh Dịch* (translator d. 1954) may already be public domain in Vietnam, but
`docs/03-data-sources.md` §4 requires legal confirmation before use. Until then all `text_vi`
is produced in-house from Legge + the Chinese text.
