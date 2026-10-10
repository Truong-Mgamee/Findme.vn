# @findme/api

Fastify 5 + Zod + Drizzle REST API for Findme (docs/04-backend-design.md §2, §5–§9). All engines
(`@findme/engine-*`) run in-process and are deterministic; the AI composer (P8) is not wired yet —
`GET /v1/readings/:id/stream` already speaks SSE and emits `engine_summary` + `done`.

## Run

```bash
pnpm install
cp apps/api/.env.example apps/api/.env          # optional: everything has a dev default
pnpm --filter @findme/api dev                   # tsx watch → http://localhost:3001/docs
pnpm --filter @findme/api test                  # vitest + fastify.inject + in-memory PGlite
pnpm --filter @findme/api typecheck
pnpm --filter @findme/api gen:openapi           # → packages/api-client/openapi.json + src/schema.d.ts
pnpm --filter @findme/api db:generate           # drizzle-kit: schema.ts → drizzle/*.sql (commit them)
pnpm --filter @findme/api db:migrate            # apply drizzle/*.sql (+ rls.sql on Postgres) to DATABASE_URL
```

`start` runs `tsx src/server.ts` on purpose: every workspace package in this monorepo ships TypeScript
source (`main: ./src/index.ts`), so the API is executed the same way in every environment. `build`
(`tsc -p tsconfig.build.json`) type-checks and emits `dist/` (api + workspace sources) for CI /
future bundling.

## Environment

| Var | Default | Notes |
|---|---|---|
| `PORT` / `HOST` | `3001` / `0.0.0.0` | |
| `DATABASE_URL` | *(unset → in-memory PGlite)* | `pglite:./.data/pglite` = persistent PGlite dir; `postgres://…` = node-postgres |
| `REDIS_URL` | *(unset → in-memory store)* | `redis://…` switches the quota/cache store to ioredis |
| `JWT_SECRET` | generated + warning in dev, **required in production** | HS256 guest JWT, 180 d (`GUEST_TOKEN_TTL_DAYS`) |
| `BIRTH_ENC_KEY` | generated + warning in dev, **required in production** | base64 32 bytes → AES-256-GCM for `profiles.birth_enc` |
| `SUPABASE_JWT_SECRET` | unset → `POST /v1/auth/link` returns 501 | HS256 verification of Supabase access tokens |
| `REVENUECAT_WEBHOOK_SECRET` | unset → no auth check | expected as `Authorization: Bearer <secret>` |
| `STRIPE_WEBHOOK_SECRET` | unset → no signature check | `Stripe-Signature: t=…,v1=…` HMAC-SHA256 over `t.rawBody`, 5-min tolerance |
| `APPLY_RLS` | `true` | apply `drizzle/rls.sql` after migrations on Postgres |
| `FREE_FIRST_READING` | `true` | first deep reading per user is free (`paid_by = free_first`) |
| `CORS_ORIGIN`, `RATE_LIMIT_MAX`, `LOG_LEVEL`, `NODE_ENV` | `*`, `300`/min, `info`, `development` | |

Request headers: `Authorization: Bearer <guest JWT>`, `X-Locale` (else `Accept-Language`, else the
user's locale, else `en`), `X-Tz` (else the user's tz, else `UTC`).

## Database driver selection (`src/db/client.ts`)

`createDb(DATABASE_URL)` picks the driver at startup:

* `postgres://` / `postgresql://` → `pg` Pool + `drizzle-orm/node-postgres` (production, Supabase).
* `pglite:<dir>` → `@electric-sql/pglite` persisted on disk + `drizzle-orm/pglite` (local dev).
* anything else / unset → in-memory PGlite (tests; dev with a warning).

Both return the same `Db` type (`PgDatabase<PgQueryResultHKT, schema>`), so services never branch on
the driver. `migrate()` runs the SQL files in `drizzle/` through the matching drizzle migrator.

### RLS in production

`drizzle/rls.sql` is **not** a drizzle migration: PGlite has no roles or JWT claims, so it is applied by
`src/db/migrate.ts` only when the driver is `pg` (skip with `APPLY_RLS=false`). It is idempotent
(`create or replace`, `drop policy if exists`) and runs on every deploy. The API connects with the
service role (bypasses RLS) and scopes every query by `user_id` in code; the policies protect direct
Supabase/PostgREST access: user-owned tables are readable/writable only by the owner
(`findme.current_user_id()` = `auth.uid` → `users.id`, or `set_config('app.user_id', …)`),
`content_atoms` is public-read when `status = 'published'`, `glossary` / `daily_content` public-read,
billing tables owner-read-only, `webhook_events` service-role only.

## Privacy

* Birth data (`date, time, timeUnknown, gender, place, calendarStandard, fullName?`) is stored only as
  `profiles.birth_enc` (AES-256-GCM: `version | iv | tag | ciphertext`). `birth_hash` is an HMAC-SHA256
  of the canonical JSON (keyed with the enc key) for cache/dedup — never a plain hash of such a
  low-entropy input.
* `core_json` and `readings.engine_json` carry derived facts only; `redactBirth()` strips `birthDate`,
  `solarDate` and natal `input.utc` before engine output is persisted.
* Responses hide the raw birth input unless the owner asks `GET /v1/profiles/:id?includeBirth=true`.
* Pino redacts `authorization`, `birth`, `date`, `time`, `place`, `fullName`, `token` at any depth.
* `DELETE /v1/me` hard-deletes the user; every owned table cascades.

## Payments & quotas (`src/services/entitlements.ts`)

`requireEntitlement(feature)` (preHandler) resolves **free_first → subscription (plus/pro) →
`payWith:'credit'` → 402 `{reason, paywall:true, credits, …}`** and stores the decision on
`req.payment`; the route debits credits inside the same transaction that inserts the paid row
(row lock on `users`, unique `credits_ledger.ref_id`). Features now: `deep_reading` (POST /readings),
`almanac_pick` (POST /almanac/pick). `ask_ai` (3/day via the KV store) is prepared for P8.

Webhooks are idempotent by provider event id (`webhook_events`). RevenueCat: `entitlement_ids` /
`product_id` → `plus|pro`; `NON_RENEWING_PURCHASE` of `…credits_<n>` grants n credits. Stripe:
`checkout.session.completed` (`metadata.user_id`, `metadata.credits` | `metadata.product`),
`customer.subscription.*` (`metadata.user_id`, `metadata.product` or price metadata).

## Routes (prefix `/v1`, see `/docs`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | /healthz, /metrics | — | also `/healthz` at the root |
| POST | /auth/guest | — | guest user + JWT |
| POST | /auth/link | guest | Supabase link + guest merge (501 without secret) |
| GET/PUT/DELETE | /me | user | settings / hard delete |
| POST/GET | /profiles | user | encrypt + `core_json` + 3 insights |
| GET/DELETE | /profiles/:id | user | `?includeBirth=true` |
| GET | /profiles/:id/ziwei?school=&date= | user | chart + horoscope |
| GET | /profiles/:id/bazi, /numerology, /astro?houses= | user | raw engine outputs |
| GET | /almanac?date=&std=&locale= | — | cached 1 day in the KV store |
| POST | /almanac/pick | Plus / credit | Date Picker (stores an `almanac_pick` reading) |
| GET | /today | user | Daily Oracle: `daily_content` segments + facts + streak |
| POST/GET | /readings, /readings/:id | user | engine sync; `tarot_spread` / `iching` 501 until engines land |
| GET | /readings/:id/stream | user | SSE `engine_summary`, `done` |
| GET | /content/atoms?keys=&locale= | — | published, fallback → en |
| GET | /entitlements | user | subscriptions, credits, features |
| POST | /webhooks/revenuecat, /webhooks/stripe | signature | idempotent upserts |

## Layout

```
src/app.ts            buildApp(): plugins, swagger, error handler, /v1 routes
src/server.ts         listen + graceful shutdown
src/config.ts         env parsing (zod), dev-generated secrets
src/db/{schema,client,migrate}.ts
src/lib/{crypto,jwt,locale,store,errors,metrics}.ts
src/plugins/{locale,auth,entitlement}.ts
src/services/{engines,entitlements,profiles,today,core-types}.ts
src/routes/*.ts       zod schemas + OpenAPI tags
drizzle/              generated SQL + rls.sql
scripts/gen-openapi.ts
test/api.test.ts      end-to-end flows against in-memory PGlite
```
