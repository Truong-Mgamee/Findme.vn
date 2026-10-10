# Daily Fate (working name) – monorepo

App bói toán đa hệ (Tử vi · Bát tự · Chiêm tinh · Thần số · Tarot), đa ngôn ngữ, mobile-first + web, một codebase Expo.

- Kế hoạch sản phẩm: **[docs/plan/00-overview.md](docs/plan/00-overview.md)** (B1 research → B4 code plan), prompt từng bước trong `docs/prompts/`.
- Tiến độ thực thi: [docs/plan/CHANGELOG.md](docs/plan/CHANGELOG.md).

## Cấu trúc

```
apps/mobile          Expo (iOS · Android · web) – màn Daily Card demo dùng engine thật
packages/engine      @fortune/engine – thuần TypeScript, chạy on-device, 131 test
supabase/migrations  schema Postgres + RLS
docs/                plan + prompts
```

## Chạy

```bash
pnpm install                 # Node 22, pnpm 10 (node-linker=hoisted cho Expo)
pnpm engine:test             # 131 test: 50 lá số Tử vi vs oracle Python, 41 năm Tết, chiêm tinh, thần số, tarot
pnpm web                     # build engine rồi mở app trên trình duyệt
pnpm mobile                  # Expo dev server (quét QR bằng Expo Go hoặc chạy ios/android)
```

## Engine API (packages/engine)

```ts
import { buildProfile, dailyCard, compare, goodDays, buildTuViChart, natalChart, baziChart, numerologyProfile, drawSpread } from "@fortune/engine";
const p = buildProfile({ id: "u1", displayName: "Nguyễn Văn A", gender: "male", year: 1997, month: 12, day: 24, hour: 8, precision: "exact", utcOffsetHours: 7, latitude: 21.03, longitude: 105.85, locale: "vi" });
const today = dailyCard(p, { year: 2026, month: 10, day: 10 }); // scores 1–5, tarot, hoàng đạo, personal day, transit
```

Nguồn dữ liệu & license: [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) (tất cả MIT / public domain; không dùng Swiss Ephemeris AGPL).
