# B3.2 — Thiết kế Backend

## 1. Nguyên tắc
1. **Engine tất định tách khỏi API & LLM**: `packages/engine-*` là pure TypeScript, không I/O, test bằng golden set; chạy được cả trên server lẫn client (offline cho Daily Oracle cơ bản).
2. **Locale ≠ Tradition ≠ Calendar standard**: 3 trục độc lập. `locale` (ngôn ngữ UI/nội dung), `traditionPack` (eastAsia | western | both), `calendarStandard` (vn | cn | kr | jp) suy ra từ nơi sinh/quốc gia nhưng user đổi được.
3. **Compute-then-explain**: LLM chỉ nhận JSON đã tính + atoms; output có schema; cache mạnh.
4. **Multi-tenant theo locale ngay từ schema**: mọi bảng nội dung có `locale`, fallback chain `locale → en`.
5. **Privacy by design**: ngày/giờ/nơi sinh mã hoá cột (pgcrypto/app-level AES-GCM), guest mode, xoá cứng theo yêu cầu.

## 2. Stack (đề xuất, có lý do)

| Lớp | Chọn | Lý do |
|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | share engine/i18n giữa mobile, web, api |
| Ngôn ngữ | TypeScript end-to-end | engine (iztro, lunar-typescript) là JS/TS → không cần bridge |
| API | **Fastify 5 + Zod (fastify-type-provider-zod) + OpenAPI** | nhẹ, nhanh, schema-first; sinh client type-safe cho FE |
| DB | PostgreSQL 16 (Supabase managed) + Drizzle ORM | RLS, Auth, Storage có sẵn; Drizzle migration rõ ràng |
| Cache/Queue | Redis (Upstash) + BullMQ | job sinh Daily Oracle theo múi giờ, rate limit AI |
| Auth | Supabase Auth (Apple, Google, email OTP) + **guest JWT** | guest-first onboarding |
| Thanh toán | RevenueCat (iOS/Android IAP) + Stripe (web); webhook → `entitlements` | chuẩn ngành subscription, hỗ trợ A/B paywall |
| LLM | Claude API (Sonnet cho reading, Haiku cho câu ngắn Daily Oracle), structured output | chất lượng đa ngôn ngữ; prompt caching cho system prompt dài |
| Push | Expo Push (mobile) + Web Push | 1 API cho iOS/Android |
| Analytics | PostHog (events + feature flags + experiments) | self-host được, GDPR |
| Hạ tầng | API trên Fly.io/Railway (2 region: Singapore + US-East), Cloudflare CDN, Sentry | độ trễ <150ms cho VN & US |
| Content ops | CMS nhẹ = bảng `content_atoms` + trang admin Next.js (route `/admin`) | không thêm hệ thống ngoài |

## 3. Kiến trúc

```mermaid
flowchart LR
  subgraph Clients
    M[Expo mobile iOS/Android]
    W[Next.js web + admin]
  end
  subgraph Edge
    CF[Cloudflare CDN / WAF]
  end
  subgraph API["apps/api (Fastify)"]
    R[REST /v1 + OpenAPI]
    E1[engine-lunar/calendar]
    E2[engine-ziwei]
    E3[engine-bazi]
    E4[engine-numerology]
    E5[engine-tarot / iching]
    E6[engine-astro]
    AI[reading-composer (LLM)]
    PAY[entitlements]
  end
  subgraph Data
    PG[(Postgres + RLS)]
    RD[(Redis)]
    S3[(Storage: tarot images, share cards)]
  end
  subgraph Workers
    J1[daily-oracle job per tz]
    J2[push scheduler]
    J3[content i18n pipeline]
  end
  M & W --> CF --> R
  R --> E1 & E2 & E3 & E4 & E5 & E6
  R --> AI --> Claude[(Claude API)]
  R --> PG & RD
  RC[RevenueCat / Stripe webhooks] --> PAY --> PG
  J1 --> E1 & E4 & E5 --> AI --> PG
  J2 --> Expo[(Expo Push)]
```

## 4. Cấu trúc repo

```
apps/
  api/            Fastify, routes, services, jobs
  mobile/         Expo (Expo Router)
  web/            Next.js 15 App Router (+ /admin CMS)
packages/
  engine-core/    types chung: BirthInput, Locale, TraditionPack, CalendarStandard, ReadingInput/Output
  engine-calendar/ CalendarProvider: vi (lunar-date-vn) | cn/tw/hk (lunar-typescript) | kr | jp; true solar time; tz lookup
  engine-ziwei/   wrapper iztro → ZiweiChart JSON + horoscope
  engine-bazi/    wrapper lunar-typescript EightChar/Yun → BaziChart JSON
  engine-almanac/ ngày tốt xấu, lọc theo tuổi, Date Picker ranking
  engine-numerology/
  engine-tarot/   deck data + spreads + RNG có seed (reproducible)
  engine-iching/  gieo quẻ + 64/384 dataset
  engine-astro/   astronomy-engine wrapper (sun/moon/planets, houses)
  content/        content_atoms seed (JSON per locale), glossary, tone guides
  i18n/           UI messages (ICU), locale config, formatters
  ui/             design tokens, shared RN/web components (SVG charts)
  api-client/     generated từ OpenAPI
tooling/          eslint, tsconfig, scripts (golden tests, i18n lint)
```

## 5. Mô hình dữ liệu (Drizzle/SQL rút gọn)

```sql
-- người dùng & hồ sơ
users(id uuid pk, auth_uid text unique null, locale text, country text, tradition_pack text, calendar_standard text,
      tz text, daily_hour smallint default 7, created_at, deleted_at)
profiles(id uuid pk, user_id fk, label text, is_self bool,
      birth_enc bytea,            -- AES-GCM JSON {date, time?, timeUnknown, place:{name,lat,lng,tz}, gender}
      birth_hash text,            -- sha256 để cache engine output, không lộ dữ liệu
      core_json jsonb,            -- kết quả engine cơ bản (ziwei soul/body, bazi pillars, life path, sun sign)
      created_at)
-- readings
readings(id uuid pk, user_id fk, profile_id fk, partner_profile_id fk null, kind text,  -- ziwei_full | bazi_luck | tarot_spread | numerology_full | iching | compatibility | daily
      locale text, input_json jsonb, engine_json jsonb, ai_json jsonb, ai_model text, tokens int, cost_usd numeric,
      paid_by text, -- free_first | subscription | credit | none
      created_at)
ai_messages(id, reading_id fk null, user_id fk, role text, content text, locale text, tokens int, created_at)
-- nội dung
content_atoms(id text pk, tradition text, key text, locale text, title text, body_md text, tone text,
      source_ref text, author text, reviewer text, status text, version int, updated_at, unique(key, locale, version))
glossary(term_key text, locale text, term text, note text, pk(term_key, locale))
daily_content(date date, locale text, segment_key text, payload_json jsonb, pk(date, locale, segment_key))
-- thương mại
entitlements(user_id fk, product text, status text, source text, expires_at, trial bool, raw_json jsonb, updated_at, pk(user_id, product))
credits_ledger(id, user_id fk, delta int, reason text, ref_id text, created_at)
-- engagement
streaks(user_id pk, current int, longest int, last_date date)
push_tokens(user_id fk, token text, platform text, pk(user_id, token))
events(id bigserial, user_id, name text, props jsonb, ts)   -- hoặc gửi thẳng PostHog
experiments(user_id, key text, variant text, pk(user_id, key))
```
RLS: user chỉ đọc/ghi hàng của mình; `content_atoms`/`daily_content` public-read với `status='published'`.

## 6. API (REST, prefix `/v1`, header `Accept-Language`, `X-Locale`, `X-Tz`)

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| POST | /auth/guest | tạo guest user + JWT | — |
| POST | /auth/link | gắn guest → Supabase account | guest |
| GET/PUT | /me | locale, tradition_pack, calendar_standard, daily_hour, push | user |
| POST | /profiles | tạo hồ sơ (server mã hoá) → trả `core_json` | user |
| GET | /profiles/:id/ziwei | lá số đầy đủ (JSON render + horoscope theo ngày) | user |
| GET | /profiles/:id/bazi | 4 trụ, thập thần, đại vận, lưu niên | user |
| GET | /today | Daily Oracle (từ `daily_content` theo segment của user) | user |
| GET | /almanac?date=&std=vi | lịch ngày | public |
| POST | /almanac/pick | Date Picker: {task, from, to, profileIds[]} → ngày xếp hạng | user (Plus/credit) |
| POST | /readings | {kind, profileId, partnerProfileId?, params} → tạo reading (engine sync, AI stream qua SSE `/readings/:id/stream`) | user |
| GET | /readings/:id, /readings | lịch sử | user |
| POST | /ai/ask | chat; context = profile + reading gần nhất; quota | user |
| GET | /content/atoms?keys=&locale= | atoms published (cache CDN) | public |
| POST | /webhooks/revenuecat, /webhooks/stripe | cập nhật entitlements | signature |
| GET | /entitlements | gói hiện tại, credit | user |
| POST | /share/card | render ảnh share (không chứa ngày sinh) | user |
| GET | /healthz, /metrics | — | — |

Quota free: `readings` sâu: 1 lần đầu; `ai/ask`: 3/ngày; `almanac/pick` nâng cao: Plus. Thực thi qua middleware `requireEntitlement(feature)`.

## 7. Engine interfaces (packages/engine-core)

```ts
export type Locale = 'vi'|'en'|'es'|'pt-BR'|'ja'|'ko'|'zh-TW'|'zh-CN'|'hi'|'th'|'id'|'fr'|'de';
export type TraditionPack = 'eastAsia'|'western'|'both';
export type CalendarStandard = 'vn'|'cn'|'kr'|'jp';
export interface BirthInput {
  date: string;            // YYYY-MM-DD (dương lịch, giờ địa phương nơi sinh)
  time?: string;           // HH:mm, undefined nếu không rõ
  timeUnknown: boolean;
  gender: 'male'|'female'|'other';
  place: { name: string; lat: number; lng: number; tz: string };
  useTrueSolarTime?: boolean;   // mặc định true cho Bát Tự/Tử Vi
  calendarStandard: CalendarStandard;
}
export interface Engine<I, O> { id: string; version: string; compute(input: I): O; }
export interface ReadingInput { kind: string; locale: Locale; profile: BirthInput; partner?: BirthInput; params?: Record<string, unknown>; }
export interface ReadingEngineOutput { facts: Record<string, unknown>; atomKeys: string[]; confidence: 'high'|'medium'|'low'; warnings: string[]; }
```
`CalendarProvider.toLunar(dateTimeLocal, std)` trả `{lunarYear, lunarMonth, isLeap, lunarDay, ganzhi:{year,month,day,hour}}`; engine-bazi và engine-ziwei nhận can chi từ provider (với `std='vn'` dùng lunar-date-vn), **không** tự tính lại từ dương lịch.

## 8. Pipeline AI (reading-composer)

```
system: vai trò + locale + tone guide + glossary + quy tắc (chỉ dùng FACTS & ATOMS, không phán tuyệt đối, disclaimer, định dạng JSON)
user:   {facts: engine_json, atoms: [...], question?: string, outputSchema}
```
- Output schema: `{summary, sections:[{title, body, atomRefs[]}], actions:[...], caveats:[...]}` → FE render; mọi câu khẳng định phải có `atomRefs` (kiểm tra tự động, nếu thiếu → regenerate 1 lần, sau đó fallback template).
- Model: Sonnet cho reading sâu (≈2–4K token output), Haiku cho Daily Oracle & câu ngắn. Prompt caching cho system + atoms lớn.
- Ước chi phí: reading sâu ≈ 0,02–0,04 USD; Daily Oracle <1.000 call/ngày ≈ 2–3 USD/ngày toàn hệ thống; Ask AI ≈ 0,005 USD/câu. Guardrail: ngân sách/user/ngày, kill-switch qua feature flag.
- Đánh giá: bộ 50 câu hỏi/locale, chấm bằng rubric (đúng facts, không bịa, giọng văn, disclaimer) tự động bằng LLM-as-judge + 10% người.

## 9. Job Daily Oracle

1. Mỗi giờ: với các múi giờ vừa sang 00:05, với mỗi `(locale, tradition_pack)` đang có user, sinh danh sách `segment_key`:
   - eastAsia: `ea:{ganzhiYearOfUser}` (60) + `ea:common`.
   - western: `w:{lifePath 1-9,11,22,33}:{sunSign}` (12×12=144) hoặc tách 2 chiều để giảm: `w:lp:{n}` + `w:sun:{sign}` + `w:common`.
2. Engine tính facts ngày (almanac theo chuẩn lịch, lá tarot ngày theo seed `(date, segment)`, personal day).
3. Haiku viết 1–2 câu/segment → `daily_content`.
4. Job push: query users có `daily_hour` = giờ hiện tại theo `tz` → gửi tiêu đề từ payload.
5. FE `/today` chỉ ghép payload theo segment của user + facts riêng (streak).

## 10. i18n nội dung & UI phía BE

- UI messages: `packages/i18n/messages/{locale}.json` (ICU); lint thiếu key; pseudo-locale để test tràn chữ.
- Content atoms: pipeline `tooling/scripts/i18n-content.ts`: lấy atoms `en`/`vi` published → LLM dịch sang locale đích với glossary → status `draft` → reviewer duyệt trong /admin → `published`. Fallback runtime: nếu thiếu `ja` → `en`.
- Số/ngày: `Intl.*` theo locale; lịch âm hiển thị theo `calendar_standard`.
- Tên sao/cung trong Tử Vi: dùng locale của iztro (6 ngôn ngữ) — map `Locale` app → iztro language (`pt-BR`/`es` → `en-US` tạm thời).

## 11. Bảo mật, pháp lý, vận hành

- Mã hoá birth data (khoá KMS), log không chứa PII, xoá tài khoản = xoá cứng + revoke.
- GDPR/CCPA: export dữ liệu, consent analytics; không bán dữ liệu.
- Rate limit theo IP/user; WAF; secrets qua env/KMS.
- Observability: Sentry, OpenTelemetry → Grafana; SLO p95 `/today` <200ms, `/readings` engine <500ms, AI stream first token <2s.
- Backup Postgres hằng ngày, PITR 7 ngày.
- Store compliance: không dùng "entertainment purposes" làm lá chắn; disclaimer trung thực theo locale; paywall tuân Apple 3.1.2 / Google Subscriptions policy.

## 12. Ước tính chi phí hạ tầng (wave 1, 100K install, ~15K MAU)

| Hạng mục | Ước tính/tháng |
|---|---|
| Supabase Pro + compute | 50–100 USD |
| Fly.io/Railway API ×2 region | 60–120 USD |
| Upstash Redis | 10–30 USD |
| LLM (Daily ≈90 USD + readings 15K×0,03 ≈450 USD + ask ≈150 USD) | ~700 USD |
| RevenueCat | free đến 2,5K USD MTR, sau đó 1% |
| PostHog | free tier → ~50 USD |
| Sentry, CDN, email | ~50 USD |
| **Tổng** | **~1.000–1.100 USD/tháng** (≈0,07 USD/MAU) |
