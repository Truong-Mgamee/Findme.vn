# B3b – Thiết kế Backend

## 1. Nguyên tắc kiến trúc

1. **Engine chạy on-device** (TypeScript thuần, dùng chung web + mobile): Tử vi, Bát tự, chiêm tinh, thần số, tarot đều tính được không cần mạng → offline, chi phí server ≈ 0, không lộ thuật toán qua API public.
2. **Server chỉ làm 5 việc**: auth + hồ sơ, đồng bộ, entitlement (RevenueCat webhook), content pack delivery, AI hỏi đáp (v1.1) + push scheduling.
3. **Supabase** (Postgres + Auth + Storage + Edge Functions) để 1 người có thể vận hành; chuyển sang NestJS/Fastify riêng khi > 500 K MAU **[gate]**.
4. Mọi tính năng trả phí được quyết định bởi **entitlement server-side** (RevenueCat → Supabase), client chỉ cache.

## 2. Sơ đồ

```
[Expo app iOS/Android] ─┐                       ┌─ RevenueCat (IAP, StoreKit2, Play Billing)
[Expo web / PWA]       ─┼─ @fortune/engine (local)│      │ webhook
                        │                         ▼      ▼
                        └─ HTTPS ─▶ Supabase ── Postgres (profiles, people, readings, entitlements, streaks)
                                        ├── Auth (Apple, Google, email OTP, anonymous→link)
                                        ├── Storage (content-pack/<locale>/<ver>.json, PDF reports)
                                        ├── Edge Functions (TS/Deno):
                                        │     daily-push (cron 15 phút, theo giờ user)
                                        │     rc-webhook (entitlement sync)
                                        │     ask (LLM proxy, rate-limit theo tier)  [v1.1]
                                        │     report-pdf (render Deep Reading)
                                        └── Realtime (không dùng v1)
                              Expo Push / FCM / APNs ◀── daily-push
                              PostHog (analytics, feature flag, A/B giá)
                              Sentry
```

## 3. Monorepo & package

```
apps/
  mobile/            Expo (iOS, Android, web) – expo-router
packages/
  engine/            @fortune/engine – thuần TS, 0 dependency ngoài astronomy-engine, lunar-javascript
    src/astro/       ephemeris.ts, houses.ts, aspects.ts, transits.ts, natal.ts
    src/lunar/       lunar-vn.ts (patch UTC+7), ganzhi.ts, goodday.ts
    src/tuvi/        ansao.ts, cuc.ts, daihan.ts, index.ts
    src/bazi/        pillars.ts, tenGods.ts, strength.ts
    src/numerology/  core.ts, alphabet.<locale>.ts
    src/tarot/       deck.ts, spreads.ts, draw.ts (seeded RNG theo userId+date)
    src/daily/       compose.ts (gộp 4 engine → DailyCard)
    test/            oracle snapshots (lasotuvi python, astro.com)
  content/           schema/, src/<locale>/, build script → content-pack
  ui/                design system (tokens, components) – RN + web
  i18n/              locales/<locale>/ui.json, glossary.json, lingui config
  api-client/        Supabase typed client + React Query hooks
  config/            eslint, tsconfig, prettier
supabase/
  migrations/        SQL
  functions/         daily-push/, rc-webhook/, ask/, report-pdf/
  seed/
```

Tooling: pnpm workspaces + Turborepo, TypeScript strict, Vitest, ESLint, Changesets. CI: GitHub Actions (lint, test, EAS build preview).

## 4. Schema Postgres (migration 0001)

```sql
-- người dùng (Supabase auth.users là nguồn chính)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  locale text not null default 'en',
  gender text check (gender in ('male','female','other')),
  birth_date date not null,
  birth_time time,                       -- null = không rõ giờ
  birth_time_precision text not null default 'exact'
      check (birth_time_precision in ('exact','canh_gio','unknown')),
  birth_place_id int,                    -- geonames id
  birth_lat double precision, birth_lng double precision,
  birth_tz text,                         -- IANA
  is_lunar_input boolean not null default false,
  default_system text not null default 'astro'
      check (default_system in ('tuvi','bazi','astro','numerology')),
  daily_push_hour smallint default 8, daily_push_minute smallint default 0,
  push_token text, push_enabled boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- người thân để so sánh
create table people (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles on delete cascade,
  label text not null, relation text,
  gender text, birth_date date not null, birth_time time,
  birth_time_precision text default 'unknown',
  birth_lat double precision, birth_lng double precision, birth_tz text,
  created_at timestamptz default now()
);

-- entitlement từ RevenueCat
create table entitlements (
  user_id uuid primary key references profiles on delete cascade,
  tier text not null default 'free' check (tier in ('free','plus')),
  product_id text, store text, expires_at timestamptz,
  is_trial boolean default false, will_renew boolean,
  rc_app_user_id text, updated_at timestamptz default now()
);

-- báo cáo đã mua / đã tạo
create table readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  kind text not null,              -- 'year_2027','love','career','compat','tarot_celtic'
  system text,                     -- engine
  subject_people_ids uuid[],
  input_hash text not null,        -- để cache
  result jsonb not null,           -- JSON engine + content đã render
  pdf_path text,
  paid_via text,                   -- 'plus' | 'consumable:<tx>'
  created_at timestamptz default now()
);

-- streak & daily card log (để analytics + widget)
create table daily_logs (
  user_id uuid references profiles on delete cascade,
  day date not null,
  opened_at timestamptz, shared boolean default false,
  tarot_card smallint, score jsonb,
  primary key (user_id, day)
);

create table streaks (
  user_id uuid primary key references profiles on delete cascade,
  current int default 0, longest int default 0, last_day date
);

-- content pack versions
create table content_packs (
  locale text, version int, storage_path text, checksum text,
  published_at timestamptz default now(), primary key (locale, version)
);

-- AI hỏi đáp (v1.1)
create table ask_messages (
  id bigserial primary key, user_id uuid references profiles on delete cascade,
  role text, content text, tokens int, created_at timestamptz default now()
);

-- RLS: mọi bảng bật row level security, policy owner-only; content_packs public read.
```

## 5. API (Supabase client + Edge Functions)

| Endpoint | Auth | Mô tả |
|---|---|---|
| `auth.*` | – | Sign in with Apple / Google / email OTP; **anonymous session mặc định**, link khi user muốn sync |
| `profiles` CRUD (PostgREST) | RLS | Hồ sơ sinh |
| `people` CRUD | RLS | Người thân |
| `GET content_packs?locale=` + Storage download | public | Content pack mới nhất, client cache theo `version` |
| `POST /functions/v1/rc-webhook` | RevenueCat signature | Cập nhật `entitlements` |
| `POST /functions/v1/report-pdf` | JWT + entitlement | Nhận JSON engine → render PDF → Storage → ghi `readings` |
| `POST /functions/v1/ask` (v1.1) | JWT | Body `{question, engineSnapshot}` → LLM (Claude) với system prompt "chỉ trả lời từ snapshot" → rate limit theo tier |
| `cron daily-push` (mỗi 15 phút) | service | Chọn user có `push_hour:minute` trong cửa sổ theo `birth_tz`/device tz → gửi câu đầu DailyCard (tính server-side bằng cùng `@fortune/engine`, chạy trong Deno) |

## 6. Entitlement & paywall

- RevenueCat offerings: `plus_weekly` (trial 3 ngày), `plus_annual`, consumables `deep_reading_*`.
- Client: `Purchases.getCustomerInfo()` → cache; **server** là nguồn sự thật qua webhook.
- Feature gate trong code: `can('reading.full')`, `can('compat.unlimited')`, `can('tarot.spread3')`, `can('ask', {quota})`.
- Giá theo nước: cấu hình trong App Store Connect / Play Console; A/B giá qua RevenueCat Experiments (PostHog flag làm fallback).

## 7. Observability & analytics (event spec tối thiểu)

| Event | Props |
|---|---|
| `onboarding_step` | step, locale |
| `profile_created` | precision, system_default, has_place |
| `daily_card_viewed` | day, streak, source(push/widget/open) |
| `daily_card_shared` | platform |
| `paywall_viewed` / `trial_started` / `purchase` / `cancel` | placement, product, price_tier |
| `reading_generated` | kind, system, paid_via |
| `compat_run` | systems |
| `push_delivered` / `push_opened` | |

Dashboard PostHog: funnel Onboarding → Profile → Paywall → Trial → Paid; retention D1/D7/D30 cohort theo locale; so sánh với gate ở B1 §E3.

## 8. Bảo mật & tuân thủ

- RLS owner-only; service key chỉ trong Edge Functions.
- PII tối thiểu: không lưu địa chỉ chi tiết, chỉ lat/lng làm tròn 2 chữ số + tz.
- Xoá tài khoản: hàm `delete_user()` cascade + xoá Storage.
- Rate limit `ask` theo tier; log token.
- Secrets qua Supabase Vault / EAS secrets.
