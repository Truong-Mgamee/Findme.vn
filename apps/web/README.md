# @findme/web

Next.js 15 (App Router, React 19) web app for Findme — three surfaces in one deployment:

| Surface | Path | Rendering |
|---|---|---|
| SEO content hub | `/{vi,en}/…` (localized slugs) | ISR, `revalidate = 3600`, engines + published atoms, **no LLM at request time** |
| PWA app | `/{locale}/app/*` | dynamic (cookie session), talks to `@findme/api` through `/api/proxy/*` |
| Admin CMS | `/admin/*` | dynamic, `ADMIN_TOKEN` cookie, calls `/v1/admin/*` with `X-Admin-Token` |

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local     # optional; everything degrades gracefully when unset
pnpm --filter @findme/web dev                     # http://localhost:3000 → redirects to /vi
pnpm --filter @findme/web typecheck
pnpm --filter @findme/web build                   # works offline and with NEXT_PUBLIC_API_URL unset
pnpm --filter @findme/web test:e2e                # Playwright against `next start` (API unset)
```

## Environment

| Var | Default | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` (or `API_URL`) | unset | Base URL of `@findme/api`. Unset → SEO pages render from engines only, `/app` shows a "not configured" notice, admin shows the error. The browser never calls the API directly; server code and `/api/proxy` do. |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | canonical / hreflang / sitemap / OG URLs |
| `ADMIN_TOKEN` | unset | ≥12 chars. `/admin/login` compares the submitted token (constant-time) and sets the `fm_admin` httpOnly cookie; the same value is forwarded as `X-Admin-Token`. |
| `NEXT_PUBLIC_IOS_APP_ID`, `NEXT_PUBLIC_ANDROID_PACKAGE` | unset / `vn.findme.app` | smart app banner meta (`apple-itunes-app`, `google-play-app`) |
| `NEXT_PUBLIC_TAROT_CDN` | unset | base URL for `classic-1909/<id>.webp`; until set, cards use `/tarot-placeholder.svg` |

No Google Fonts: the system font stack is used so `next build` never touches the network.

## Routing & i18n

* `next-intl` v4 with `/[locale]` prefix (`localePrefix: 'always'`), locales = `ENABLED_LOCALES` from `@findme/i18n` filtered to the ones with web copy (`vi`, `en`; see `src/i18n/routing.ts`). Messages are the shared catalogs (`getCatalog(locale)`), UI strings live under the `web.*` namespace in `packages/i18n/messages/{vi,en}.json` (`pnpm --filter @findme/i18n lint:keys`).
* Internal route names map to localized public slugs (`PATHNAMES`), which gives real hreflang pairs:

| Internal | vi | en |
|---|---|---|
| `/almanac-today` | `/vi/lich-am-hom-nay` | `/en/lunar-calendar-today` |
| `/almanac/[yyyy-mm]` | `/vi/lich-am/2026-10` | `/en/lunar-calendar/2026-10` |
| `/good-days/[task]` | `/vi/xem-ngay-tot/wedding` | `/en/auspicious-days/wedding` |
| `/zodiac/[chi]` | `/vi/tu-vi-12-con-giap/thin` | `/en/chinese-zodiac/dragon` |
| `/tarot-card-of-the-day` | `/vi/la-bai-tarot-hom-nay` | `/en/tarot-card-of-the-day` |
| `/tarot/[card]` (78) | `/vi/tarot/the-fool` | `/en/tarot/the-fool` |
| `/life-path-number/[n]` (1–9, 11, 22, 33) | `/vi/than-so-hoc/so-chu-dao/7` | `/en/life-path-number/7` |
| `/moon-today` | `/vi/mat-trang-hom-nay` | `/en/moon-today` |

* `sitemap.xml` (all SEO pages × locales with `alternates.languages`), `robots.txt` (disallows `/admin`, `/api/`, `/*/app`), `manifest.webmanifest`, `/sw.js` (app-shell cache + offline fallback `/{locale}/offline`).
* Every SEO page emits `Article` JSON-LD, OpenGraph/Twitter meta, canonical + `hreflang` (+ `x-default`) and smart-app-banner meta; the `AppCta` component links `findme://today` with the web app as fallback.

### Engine facts used (deterministic, computed at build/ISR time)

| Page | Engine call |
|---|---|
| lịch âm hôm nay | `getDayAlmanac(today @ Asia/Ho_Chi_Minh, 'vn', locale)` — lunar date (Hồ Ngọc Đức), 黄道/黑道, giờ hoàng đạo, 宜/忌, 建除, 28 宿, directions |
| lịch âm tháng | `civilToLunar` + `getDayAlmanac` for every day (standard `vn`) |
| xem ngày tốt | `pickDates({ task, from: today, to: +59d, profiles: [], standard: 'vn' })` — 6 tasks pre-rendered, others on demand |
| tử vi 12 con giáp | branch tables from `@findme/engine-core` (element, 三合/六合/六冲, hours, years) + static traits |
| tarot card of the day | `dailyCard(utcDate, 'w:common')` — identical to the API's Daily Oracle `w:common` segment |
| tarot/[card] | `DECK` from `@findme/content/tarot/deck-classic-1909.json` |
| life path | static copy + client-side `lifePath()` calculator (engine-numerology in the browser) |
| moon today | `dailySky(12:00 UTC)` |

Editorial copy comes from `GET /v1/content/atoms?keys=&locale=` (`src/lib/atoms.ts`, `next: { revalidate: 3600 }`, 5 s timeout, never throws). Atom keys follow the engines' `atomKeysFor*()` helpers plus `zodiac.<branch>.{overview,love,career}`, `almanac.task.<task>`, `numerology.lifepath.<n>`.

## PWA app (`/[locale]/app`)

* Guest auth: `POST /api/auth/guest` → `POST /v1/auth/guest` → JWT stored in the `fm_token` httpOnly cookie (180 d). Server components call the API with it (`src/lib/server-api.ts`); the browser goes through `/api/proxy/<path>` which injects `Authorization`, `X-Locale`, `X-Tz` and streams bodies (SSE works with `EventSource`). Allowed prefixes: `me, profiles, today, readings, almanac, entitlements, content, ai, billing`.
* Screens: `welcome` (guest start) → `onboarding` (birth form, city autocomplete from `data/cities.json`, 377 cities incl. all 63 VN provinces) → `/app` Today (`GET /v1/today`), `ziwei`, `bazi`, `numerology`, `astro` (simple grids/tables), `almanac` (+ `?date=&std=`, computed locally), `almanac/pick` (`POST /v1/almanac/pick`), `readings` list / `new` / `[id]` (SSE consumer: `engine_summary`, `section`, `delta`, `done`, `error`), `paywall` (plans from docs/01; **Checkout → `POST /api/checkout` → `POST /v1/billing/checkout`, which answers 501 until Stripe is configured in P12**), `settings` (`PUT /v1/me`, `DELETE /v1/me`, sign out).
* 402 from any call throws `PaywallError` → navigates to `/app/paywall?reason=&feature=`.
* `TODO(@findme/ui)`: the views are plain Tailwind; swap in `ZiweiChartSVG`, `BaziPillars`, `LuckTimeline`, `NumerologyGrid`, `AlmanacDayCard`, `OracleCard`, `PaywallSheet` when `packages/ui` lands (markers in the files).

## Admin (`/admin`)

`src/lib/admin-api.ts` is the single client for `/v1/admin/*`:
atoms list with filters (tradition / locale / status / q / page) + status chips, editor (Markdown textarea, live preview, word diff vs the previous version, Save / Approve(`reviewed`) / Publish), new-version form (`POST /v1/admin/atoms`), coverage dashboard (tradition × locale with published %), daily-content preview (`GET /v1/admin/daily-content?date=&locale=`) with a "run Daily Oracle job" button (`POST /v1/admin/jobs/daily-oracle`). Browser writes go through `/api/admin/*` route handlers (cookie check) so `ADMIN_TOKEN` never reaches the client.

## Tests

`e2e/seo.spec.ts` — 6 Playwright tests (Chromium) against `next start` with the API URL unset:
lịch âm hôm nay (lunar date cross-checked with `civilToLunar(…, 'vn')`, hreflang, JSON-LD, app banner), tarot card of the day (equals `dailyCard(utcDate, 'w:common')`), life path page + calculator, month grid (cell count + lunar dates), moon/zodiac/good-days + 404, sitemap/robots/manifest.

```bash
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm --filter @findme/web test:e2e   # the script sets this default
```

## Lighthouse budget (SEO pages, mobile, throttled)

| Metric | Budget |
|---|---|
| Performance / SEO / Accessibility / Best practices | ≥ 90 each |
| LCP | ≤ 2.5 s |
| CLS | ≤ 0.1 |
| TBT | ≤ 200 ms |
| JS transferred (SEO page) | ≤ 120 kB gzip (SEO pages ship only the Next runtime + the life-path calculator chunk) |
| Images | placeholders are inline SVG; deck art must be WebP ≤ 60 kB per card (2 sizes) when the CDN lands |

Run: `pnpm --filter @findme/web build && pnpm --filter @findme/web start` then `npx lighthouse http://localhost:3000/vi/lich-am-hom-nay --preset=mobile`. Fail the PR when any category drops below 90.

## API gaps / notes

* `POST /v1/billing/checkout` returns 501 until Stripe is configured — the paywall shows the "coming soon" state (`web.app.paywall.checkoutStub`).
* `GET /v1/readings/:id/stream` currently emits only `engine_summary` + `done`; the consumer already handles `section`/`delta`/`error` for P8.
* `GET /v1/today` has no `?preview=` — admin preview uses `GET /v1/admin/daily-content` instead.
* Atom keys for zodiac / life-path / task pages (`zodiac.<branch>.*`, `numerology.lifepath.<n>`, `almanac.task.<task>`) are proposed names; pages render without them until the content exists.
* Deck art is not hosted yet (`/tarot-placeholder.svg`); OG images reuse the app icon until a generator exists.
