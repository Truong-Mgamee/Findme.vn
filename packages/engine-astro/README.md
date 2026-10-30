# @findme/engine-astro

Western (tropical) astrology engine for Findme: planetary positions, angles, houses,
aspects, natal chart assembly and the daily sky snapshot used by the Daily Oracle job.
Pure TypeScript, no native modules — runs in React Native, Node and the browser.

## Why astronomy-engine, not Swiss Ephemeris

Positions come from [`astronomy-engine`](https://github.com/cosinekitty/astronomy) 2.1.19
(**MIT**, accuracy **±1 arc-minute** for Sun → Pluto over 1700–2200, VSOP87/ILE-based).
**Swiss Ephemeris is intentionally avoided**: it is AGPL (or a paid commercial licence),
which is incompatible with a closed-source SaaS/mobile product. See `docs/03-data-sources.md`.
±1′ is far below any astrological orb; sign boundaries can only flip for bodies within ~1′
of a cusp, which is also within the uncertainty of any real birth time.

## API

| Module | Exports |
| --- | --- |
| `zodiac.ts` | `SIGNS`, `SIGN_BY_KEY`, `signFromLongitude(lon)` → `{ sign, degree, minute, second }`, `normalizeDegrees`, `wrap180` |
| `positions.ts` | `planetPositions(utc)` (Sun→Pluto + mean North Node, with `speed` and `retrograde`), `bodyPosition`, `meanLunarNode`, `moonPhase(utc)` → `{ angle, name, illumination, waxing }` |
| `houses.ts` | `ascendantAndMC(utc, lat, lng)`, `obliquity`, `localSiderealTime`, `wholeSign(asc)`, `placidus(utc, lat, lng)`, `houses(system, …)`, `houseOf(lon, cusps)` |
| `chart.ts` | `computeNatalChart({ utc, lat, lng, houseSystem })`, `findAspects`, `sunSign`, `moonSign`, `risingSign` |
| `daily.ts` | `dailySky(utc)`, `atomKeysForAstro(chart)`, `atomKeysForDailySky(sky)`, `toEngineOutput(chart)` |

All inputs are UTC `Date`s; civil time + timezone resolution (DST history, unknown birth
time) belongs to `engine-calendar`. Longitude east-positive, latitude north-positive.

## Conventions and formulas

- **Frame**: geocentric, apparent (aberration-corrected), *true ecliptic and equinox of date*
  — the standard tropical-astrology frame. `SunPosition`/`EclipticGeoMoon` give it directly;
  planets go through `GeoVector(body, t, true)` → `Ecliptic()`.
- **Retrograde**: sign of `lon(t) − lon(t − 1 day)` (wrapped to ±180°). Sun/Moon are never
  flagged; the mean node is always retrograde.
- **Mean North Node**: Meeus eq. 47.7, `Ω = 125.04452 − 1934.136261 T + 0.0020708 T² + T³/450000`
  (T in Julian centuries from J2000, UT used as TT — the difference is < 0.001°). This is the
  *mean* node; the true node oscillates up to ±1.5° around it.
- **Sidereal time**: `Astronomy.SiderealTime` = Greenwich *apparent* sidereal time (hours);
  `LST° = GAST·15 + λ`. RAMC = LST.
- **Obliquity**: true obliquity of date (`e_tilt().tobl`, mean + nutation), consistent with GAST.
- **MC**: `λ_MC = atan2(sin RAMC, cos RAMC · cos ε)`.
- **ASC**: `atan2(cos RAMC, −(sin RAMC · cos ε + tan φ · sin ε))`; `atan2` gives the correct
  quadrant so that `0° < ASC − MC < 180°` for every latitude outside the polar circles
  (tested on a grid of times × latitudes).
- **Whole Sign**: house 1 = the whole sign containing the ASC; cusps every 30°.
- **Placidus**: the cusp is the ecliptic point whose hour angle trisects its own semi-arc.
  With `SDA(δ) = acos(−tan φ tan δ)` and `tan δ = tan ε sin α` for an ecliptic point at RA α:
  `α₁₁ = RAMC + SDA/3`, `α₁₂ = RAMC + 2·SDA/3`, `α₂ = RAMC + 60° + 2·SDA/3`,
  `α₃ = RAMC + 120° + SDA/3`, solved by fixed-point iteration (starting from the equal-RA
  solution, converging to 1e-9° in a few steps), then `α → λ` with the MC formula. Cusps
  4–9 are the opposites. For **|φ| > 66°** (or if a cusp is circumpolar) the engine returns
  Whole Sign cusps with warning `astro.houses.polar_fallback` / `astro.houses.circumpolar_fallback`
  and `toEngineOutput` downgrades confidence to `medium`.
- **Aspects**: conjunction 0°, sextile 60°, square 90°, trine 120°, opposition 180°; orb 8°
  when a luminary is involved, else 6°; only one (closest) aspect per pair; the node is not
  aspected. `applying` = the orb one hour later (using the daily speeds) is smaller than now.
- **Moon phase**: `Astronomy.MoonPhase` (Moon − Sun longitude); eight 45° bins centred on
  0/90/180/270; illumination uses the geometric `(1 − cos θ)/2`.

## Validation

- `1997-12-24T05:00Z` → Sun 272.41° Capricorn, Moon 207.43° Libra (docs/03 §6.4).
- J2000 → Sun 280.37°, mean obliquity 23.4393°, Ω = 125.04452°.
- London `2000-01-01T12:00Z` → ASC 24.0° Aries, MC 9.5° Capricorn, Placidus 11th 28.9° Cap,
  12th 27.5° Aqu, 2nd 1.0° Gem, 3rd 21.9° Gem — consistent with the classical Tables of
  Houses for London at ST 18h41m (values locked in the tests with 0.5° tolerance).
- Placidus at the equator reduces exactly to equal right-ascension division (checked to 1e-6°).
- Mercury retrograde 2024-04-10, direct 2024-06-01; full Moon 2024-01-25.

Not in scope for wave 1: true node, Chiron/asteroids, Lilith, secondary house systems
(Koch, Regiomontanus, Equal), void-of-course Moon, sidereal/ayanamsa (wave 3 Jyotish).
