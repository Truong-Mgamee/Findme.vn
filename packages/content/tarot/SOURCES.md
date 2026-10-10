# Tarot dataset sources — "Classic 1909 deck"

## Artwork

The 78 card images referenced by `deck-classic-1909.json` (`image: "classic-1909/<id>.webp"`) are
the **original 1909 lithographs drawn by Pamela Colman Smith** for the deck published by William
Rider & Son, London (conceived by A. E. Waite).

- **United States:** published before 1929 → public domain.
- **UK / EU:** Pamela Colman Smith died 18 September 1951; life + 70 years expired, so the artwork
  is public domain there since **1 January 2022**. A. E. Waite (d. 1942) contributed concepts and
  text, and his copyright also lapsed (1 January 2013).
- Smith's artwork is what we ship. We do **not** use any later edition.

### What must be avoided

1. **The 1971 U.S. Games Systems recolour** (and any later "Rider-Waite", "Universal Waite",
   "Radiant" or "Centennial" editions). Those recolourings / redraws are separate works still under
   copyright. Only scans of the 1909 (Pam-A / Pam-B / Pam-C / Pam-D) printings are acceptable.
2. **The names "Rider-Waite" and "Rider-Waite-Smith" as a brand.** U.S. Games Systems holds
   trademarks on "Rider-Waite". We never use those names in the product UI, store listings or
   marketing. The product name for this deck is **"Classic 1909 deck"** (`deck: "classic-1909"`).
   Internal file names on Wikimedia Commons happen to contain "RWS"; that is a source file name,
   not a product name.

### Planned image source

- Wikimedia Commons category: <https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck>
- Files follow the pattern `RWS_Tarot_00_Fool.jpg` (majors) and `Wands01.jpg`, `Cups01.jpg`,
  `Swords01.jpg`, `Pents01.jpg` … `…14.jpg` (minors, 11 = Page, 12 = Knight, 13 = Queen, 14 = King).
- License on Commons: `PD-US-expired` / `PD-old-70`.
- Download + conversion script: `packages/content/scripts/fetch-tarot-images.mjs`
  (contains the full id → Commons filename mapping; writes `packages/content/tarot/images/<id>.webp`).
  The script has **not** been executed in CI yet; verify each Commons filename when first running it
  and record the exact revision URLs in this file afterwards.
- Secondary reference listing of scans: GitHub `mixvlad/TarotCards` (has its own SOURCES.md); only
  used to cross-check that files are 1909 scans, not as a distribution source.

## Text

- `waite_pd_excerpt`: short paraphrases (not verbatim quotes) of the divinatory meanings in
  A. E. Waite, *The Pictorial Key to the Tarot* (London: William Rider & Son, 1911), Part III
  "The Outer Method of the Oracles". Public domain worldwide (author d. 1942, first published 1911).
  Full text: <https://sacred-texts.com/tarot/pkt/> and Project Gutenberg.
- `keywords_upright` / `keywords_reversed`, `element`, `astrology`: conventional modern RWS
  keyword sets and Golden Dawn elemental/astrological attributions (decans for pips 2–10,
  sub-elements for courts). These are uncopyrightable facts/short phrases compiled in-house.
- The Tarotoo dataset mentioned in `docs/03-data-sources.md` was **not** used (license unverified).

## Fields

| field | meaning |
|---|---|
| `id` | `major-00`…`major-21`, `<suit>-01`…`<suit>-14` (11 page, 12 knight, 13 queen, 14 king) |
| `arcana` | `major` / `minor` |
| `suit` | `null` for majors, else `wands` / `cups` / `swords` / `pentacles` |
| `number` | 0–21 for majors, 1–14 for minors |
| `element` | fire / water / air / earth (Golden Dawn attribution) |
| `astrology` | planet / sign / decan ruler, short string |
| `image` | relative path under the content CDN prefix |
| `waite_pd_excerpt` | paraphrase of Waite 1911, upright and reversed |

Vietnamese and other locale text is **not** stored here; it is produced by the content-atoms
pipeline (P7) keyed on `tarot.<id>.<upright|reversed>`.
