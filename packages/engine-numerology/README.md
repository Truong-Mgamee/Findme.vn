# @findme/engine-numerology

Pure-TypeScript numerology engine (Pythagorean default, Chaldean optional). No Node-only APIs, so it runs
unchanged in React Native. Only dependency: `@findme/engine-core` (shared types).

```ts
import { computeNumerology, toEngineOutput, compatibility } from '@findme/engine-numerology';

const r = computeNumerology({ birthDate: '1997-12-24', fullName: 'Nguyễn Văn An', refDate: '2026-10-10' });
r.lifePath;        // { value: 8, unreduced: 17, isMaster: false }
toEngineOutput(r); // ReadingEngineOutput { engine: 'numerology', engineVersion: '1.0.0', atomKeys: [...] }
```

Every number is `{ value, unreduced, isMaster }`: `value` is the final result, `unreduced` the total before the
last reduction (what karmic-debt detection inspects), `isMaster` true for 11/22/33.

## Name normalization (`normalizeName`)

1. Unicode NFD, drop combining marks U+0300–U+036F (ễ→e, ç→c, ñ→n, ü→u …).
2. Letters NFD cannot decompose are mapped explicitly: đ/Đ→d, ß→ss, æ→ae, ø→o, œ→oe, ł→l, þ→th, ð→d.
3. Uppercase, keep A–Z only. Whitespace, hyphen, apostrophe and period split words; digits/punctuation are dropped.
4. If the input contains CJK (Han/Kana/Hangul), Thai or Devanagari characters the name is **not** mapped:
   `letters` is `''` and warning `NAME_SCRIPT_UNSUPPORTED` is returned (Han names need a different method, wave 2).
   `computeNumerology` then leaves the name-based numbers `null` and `toEngineOutput` reports `confidence: 'medium'`.

Other warning codes: `NAME_EMPTY` (no A–Z letters left), `NAME_MISSING` (no name given at all),
`NAME_BIRTH_MISSING_USING_CURRENT` (`fullName` absent, numbers computed from `currentName`).

## Letter values

| | A B C D E F G H I | J K L M N O P Q R | S T U V W X Y Z |
|---|---|---|---|
| Pythagorean | 1 2 3 4 5 6 7 8 9 | 1 2 3 4 5 6 7 8 9 | 1 2 3 4 5 6 7 8 |
| Chaldean | 1 2 3 4 5 8 3 5 1 | 1 2 3 4 5 7 8 1 2 | 3 4 6 6 6 5 1 7 |

## Reduction and master numbers

`reduce(n, { keepMasters })` sums digits until a single digit; with `keepMasters` (default) it stops at 11, 22, 33
(44 is not treated as a master). A master is only kept when it appears as an intermediate total (29 → 11 stays 11).

## Formulas

| Number | Formula | Masters |
|---|---|---|
| Life Path | `reduce(reduce(month) + reduce(day) + reduce(year))`; each part keeps masters. `unreduced` = sum of the three parts (1997-12-24 → 8+3+6 = **17** → 8). | kept |
| Birthday | `reduce(day)`; `unreduced` = day of month | kept (11, 22) |
| Expression | sum of all letters of the whole name (not per word) | kept |
| Soul Urge | sum of vowels | kept |
| Personality | sum of consonants (`expression = soulUrge + personality` before reduction) | kept |
| Maturity | `reduce(lifePath.value + expression.value)` | kept |
| Personal Year | `reduce(reduce(month) + reduce(day) + reduce(refYear))`, calendar-year convention (Jan–Dec) | folded to 1–9 |
| Personal Month | `reduce(personalYear + refMonth)` | folded |
| Personal Day | `reduce(personalMonth + refDay)` | folded |
| Pinnacles | m, d, y reduced (masters kept): P1 = m+d, P2 = d+y, P3 = P1+P2 (reduced values), P4 = m+y | kept |
| Challenges | m, d, y as single digits: C1 = \|m−d\|, C2 = \|d−y\|, C3 = \|C1−C2\|, C4 = \|m−y\| (0–8) | none |
| Karmic debt | 13/14/16/19 appearing as `unreduced` of Life Path, Expression or Birthday (reported with its source) | — |
| Hidden Passion | most frequent letter value in the name; ties broken toward the lowest digit, all ties listed | — |
| Cornerstone / Capstone | first / last letter of the **given name** | — |

**Pinnacle/challenge ages:** first period ends at `36 − lifePath` with masters folded (11→2, 22→4, 33→6); the next two
last 9 years each; the fourth is open ended. 1997-12-24 (LP 8): 0–28, 29–37, 38–46, 47+.

### Y rule (Soul Urge / Personality)

A E I O U are always vowels. **Y is a vowel when it is not adjacent to another A/E/I/O/U within the same word**,
otherwise it is a consonant. MARY → Y vowel; KAY → consonant; YVONNE → vowel; NGUYEN → consonant (between U and E).
Word boundaries break adjacency ("AMY ANN": the Y of AMY is compared only with M).

### Given name and `nameOrder`

Cornerstone/capstone read the given name: the first word by default (`nameOrder: 'given-first'`, Western), or the
last word with `nameOrder: 'family-first'` (Vietnamese / East-Asian order: "Nguyễn Văn An" → "An"). The caller
should pass `family-first` for `vi`, `zh-*`, `ja`, `ko` profiles.

### Birth name vs current name

`fullName` drives the main numbers; `currentName` (if given) is computed separately into `result.currentName`
(expression, soul urge, personality, hidden passion, cornerstone, capstone). If only `currentName` is given it is
used for the main numbers with a warning.

## Atom keys

`atomKeysForNumerology(result)` returns, in display order:
`numerology.lifepath.N`, `.expression.N`, `.soulurge.N`, `.personality.N`, `.birthday.N`, `.maturity.N`,
`.personalyear.N`, `.personalmonth.N`, `.personalday.N`, `.karmic.13|14|16|19`, `.master.11|22|33`.
Name-based keys are omitted when the name is unsupported.

## Compatibility

`compatibility(a, b)` → `{ score: 0–100, reasons: [{ key, weight }] }`.

* Life Path pair affinity from a symmetric 9×9 matrix (`LIFE_PATH_AFFINITY`, masters folded 11→2, 22→4, 33→6),
  built from the classic triads {1,5,7}, {2,4,8}, {3,6,9} plus common cross pairings; range 45–85.
* Expression: same (folded) value → 90, otherwise the same matrix.
* `score = 0.65 × lifePath + 0.35 × expression` (life path only when either side has no name), `+5` when both life
  paths are masters, rounded and clamped to 0–100.
* Reason keys: `numerology.compat.lifepath.<a>-<b>`, `numerology.compat.expression.same|<a>-<b>`,
  `numerology.compat.master.both` (`weight` = points contributed).

## Dev

```sh
pnpm --filter @findme/engine-numerology typecheck
pnpm --filter @findme/engine-numerology test
```
