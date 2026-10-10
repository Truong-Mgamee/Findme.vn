# B4 – Plan code chi tiết (code được ngay)

> Giả định đội: 1 PM (Trường) + Claude Code làm dev chính + 1 reviewer content VN/EN. Sprint 1 tuần. Mọi ticket có **Definition of Done** và prompt tương ứng trong `docs/prompts/`.

## 0. Review lại kế hoạch (check trước khi code)

| Kiểm tra | Kết quả |
|---|---|
| Nguồn dữ liệu đủ cho 4 engine Wave 1? | ✅ astronomy-engine (MIT), lunar-javascript (MIT), lasotuvi (MIT, port), RWS PD, deckaura (MIT) – xem B3a |
| Mô hình thu phí đã chốt? | ✅ Freemium + weekly/annual + consumable (B1 §E2); cần Trường confirm giá VN |
| Free daily hook? | ✅ DailyCard + streak + widget (B2 F3) |
| Mobile-first + web? | ✅ Expo + RN Web, cùng codebase |
| Multi-language? | ✅ Lingui + content pack theo locale; Wave 1 vi/en |
| Rủi ro store? | ⚠️ Apple 4.3(b) – chiến lược B2 §4; Android + web phát hành trước |
| Chưa xác minh | Lịch âm VN patch cần test với bảng Tết; deckaura license cần mở repo xác nhận lần nữa; giá PPP cần A/B |

## 1. Milestones

| Mốc | Tuần | Deliverable | Gate |
|---|---|---|---|
| M0 Scaffold | 1 | Monorepo chạy iOS/Android/web "Hello", CI xanh, Supabase project, RevenueCat sandbox | `pnpm test` xanh, EAS preview build cài được |
| M1 Engine | 2–3 | `@fortune/engine` 4 engine + daily compose, test oracle ≥ 95 % pass | Snapshot 50 lá số Tử vi, 20 natal, 100 numerology, lịch âm 30 năm Tết |
| M2 Content v0 | 3–4 (song song) | Content pack vi/en: numerology + tarot + daily template đầy đủ; Tử vi/astro lớp 1–2 | Schema validate, reviewer approve ≥ 80 % |
| M3 App core | 4–6 | Onboarding → Profile → DailyCard → Calendar → Compare (Free) | Maestro E2E onboarding pass; D1 retention nội bộ ≥ 40 % (TestFlight 30 người) |
| M4 Monetize | 6–7 | Paywall, RevenueCat, entitlement, Deep Reading PDF, push, widget | Sandbox purchase/restore/cancel pass; webhook sync |
| M5 Release | 8 | Android Play (open testing → prod), Web PWA, iOS submit + review notes | Store listing 2 ngôn ngữ, privacy labels, licenses |
| M6 Learn | 9–10 | A/B giá, đo KPI gate B1 §E3, quyết định Wave 2 | Dashboard PostHog |

## 2. Ticket theo sprint

### Sprint 1 – M0 Scaffold (prompt: `P0-setup-repo.md`)

| ID | Ticket | DoD |
|---|---|---|
| T-SETUP-01 | Khởi tạo pnpm + Turborepo monorepo theo cây B3b §3 | `pnpm -r build` xanh |
| T-SETUP-02 | `apps/mobile` Expo + expo-router + NativeWind + Lingui, chạy iOS sim, Android emu, web | 3 nền tảng hiện "Hello {locale}" |
| T-SETUP-03 | `packages/config` eslint/tsconfig/prettier strict; Vitest; GitHub Actions lint+test | CI xanh trên PR |
| T-SETUP-04 | Supabase project + migration 0001 (schema B3b §4) + RLS + seed | `supabase db reset` xanh, RLS test |
| T-SETUP-05 | RevenueCat project, products sandbox (plus_weekly, plus_annual, deep_reading_year) | Sandbox purchase thành công |
| T-SETUP-06 | PostHog + Sentry wiring, event spec B3b §7 | Event hiện trên dashboard |
| T-SETUP-07 | `THIRD_PARTY_LICENSES.md`, `docs/` link, README | – |

### Sprint 2–3 – M1 Engine (prompt: `P4-sprint-execution.md` + `P3a` cho oracle)

| ID | Ticket | DoD |
|---|---|---|
| T-ENG-01 | `lunar/lunar-vn.ts`: wrap lunar-javascript, tham số tz, patch sóc UTC+7 | Test 30 năm Tết VN đúng; can chi ngày khớp 100 ngày mẫu |
| T-ENG-02 | `lunar/goodday.ts`: hoàng đạo/hắc đạo, 12 trực, 28 sao, xung tuổi, giờ hoàng đạo, hướng | Test 20 ngày so với lịch vạn niên in |
| T-ENG-03 | `bazi/`: tứ trụ, thập thần, ngũ hành vượng suy, dụng thần đơn giản | Test 30 case |
| T-ENG-04 | `tuvi/`: port lasotuvi → TS (an sao, cục, đại hạn, tuần triệt) | Snapshot 50 lá số = Python oracle |
| T-ENG-05 | `astro/`: ephemeris wrapper, ASC/MC, Placidus + Whole Sign, aspects, natal object | 20 chart ≤ 0,1° vs astro.com |
| T-ENG-06 | `astro/transits.ts`: transit hôm nay vs natal, moon phase, void-of-course | Test 10 ngày |
| T-ENG-07 | `numerology/`: core numbers + alphabet vi/en + personal day | 100 case table-driven |
| T-ENG-08 | `tarot/`: deck JSON, seeded draw (userId+date), spreads | Deterministic test |
| T-ENG-09 | `daily/compose.ts`: DailyCard = f(profile, date, locale) → scores + slots để ghép template | Snapshot 7 ngày × 3 profile |
| T-ENG-10 | `compat/`: so sánh 2 hồ sơ (ngũ hành/can chi, synastry cơ bản, life path) | Test đối xứng A-B = B-A |
| T-ENG-11 | Public API `@fortune/engine`: `buildProfile(input)`, `dailyCard(profile, date)`, `compare(a,b)`, `goodDays(profile, month)` + typedoc | 100 % typed, bundle < 400 KB |

### Sprint 3–4 – M2 Content (prompt: `P3a-data-pipeline.md`)

| ID | Ticket | DoD |
|---|---|---|
| T-DATA-01 | JSON schema cho 6 loại content (B3a §1.5) + validator + `content:build` | Schema test |
| T-DATA-02 | Seed tarot EN từ deckaura (MIT) → chuẩn hoá schema → VI | 78×2×3 đoạn approved |
| T-DATA-03 | Numerology 12 số × 8 loại, vi+en | 300 đoạn approved |
| T-DATA-04 | Daily templates ICU (500) vi+en | Render 7 ngày không trùng câu |
| T-DATA-05 | Tử vi lớp 1–2 (14 chính tinh × 12 cung), vi trước, en sau | 168×2 đoạn |
| T-DATA-06 | Astro lớp 1–2 (10 hành tinh × 12 cung + 12 nhà) en trước, vi sau | 264 đoạn |
| T-DATA-07 | Upload pipeline → Supabase Storage + bảng `content_packs` | App tải pack theo locale |

### Sprint 4–6 – M3 App core (prompt: `P3c-frontend.md`, `P4`)

| ID | Ticket | DoD |
|---|---|---|
| T-FE-01…07 | Onboarding 7 bước (B2 F1) incl. canh giờ, GeoNames offline, preview | Maestro E2E, ≤ 90 s |
| T-FE-10…12 | DailyCard + ShareCanvas + streak | Render < 300 ms, ảnh share 1080×1920 |
| T-FE-20…24 | Profile tabs + TuViChart SVG + NatalWheel SVG + NumerologyGrid + BaziTable | VoiceOver mô tả |
| T-FE-40…42 | Calendar month + DayDetail + filter việc | |
| T-FE-50…51 | People + Compare | |
| T-FE-70 | Settings (locale runtime switch, giờ push, xoá tài khoản) | |
| T-BE-01 | Supabase auth anonymous → link Apple/Google; sync profile/people | |
| T-BE-02 | Content pack loader + cache + fallback en | |

### Sprint 6–7 – M4 Monetize (prompt: `P3b-backend.md`, `P4`)

| ID | Ticket | DoD |
|---|---|---|
| T-FE-60…61 | Paywall (2 gói + consumable, text tuân thủ 3.1.2), ManageSub | Sandbox purchase/restore |
| T-BE-03 | Edge `rc-webhook` → `entitlements`; client gate `can()` | Webhook test với RevenueCat sandbox events |
| T-FE-30…33 | Readings list/detail, Tarot spread, Library | |
| T-BE-04 | Edge `report-pdf` (Deep Reading) | PDF 2 ngôn ngữ |
| T-BE-05 | Edge `daily-push` cron + expo-notifications; push "trial ends tomorrow" | Nhận push đúng giờ ở 2 tz |
| T-FE-71 | Widget iOS/Android | Hiển thị điểm ngày |

### Sprint 8 – M5 Release (prompt: `P5-store-release.md`)

| ID | Ticket | DoD |
|---|---|---|
| T-REL-01 | Play Console: listing vi/en, data safety, open testing 14 ngày → production | Live |
| T-REL-02 | Web PWA deploy (Vercel/Cloudflare) + landing SEO | Lighthouse ≥ 90 |
| T-REL-03 | App Store Connect: listing, privacy labels, IAP review, **App Review Notes** (B2 §4), video demo | Submit |
| T-REL-04 | Kế hoạch appeal 4.3(b) viết sẵn | Doc |
| T-REL-05 | Dashboard KPI gate (B1 §E3) | PostHog board |

## 3. Cấu trúc file khởi tạo (T-SETUP-01/02) – copy được

```
daily-fate/
  package.json            { "private": true, "workspaces": ["apps/*","packages/*"] }
  pnpm-workspace.yaml
  turbo.json
  apps/mobile/
    app.json              (expo, scheme, plugins: expo-router, expo-notifications, expo-localization)
    app/_layout.tsx       (providers: Lingui, QueryClient, RevenueCat, PostHog)
    app/(onboarding)/...  app/(tabs)/...
    src/features/{daily,profile,calendar,compare,readings,paywall}/
    src/lib/{engine,content,supabase,purchases,analytics}.ts
    locales/{vi,en}/messages.po
  packages/engine/src/...  (B3b §3)
  packages/content/{schema,src,scripts}
  packages/ui/src/{tokens,components}
  packages/i18n/{glossary.json,lingui.config.ts}
  supabase/{migrations,functions,seed}
  .github/workflows/ci.yml
  THIRD_PARTY_LICENSES.md
```

## 4. Definition of Done chung

- TypeScript strict, không `any` ở public API.
- Unit test cho engine (≥ 90 % line), component test cho màn hình có logic, E2E cho onboarding + paywall.
- Mọi chuỗi UI qua Lingui; `pnpm i18n:extract` không có chuỗi mới chưa dịch ở vi/en.
- Event analytics theo spec B3b §7.
- PR có screenshot 3 nền tảng (iOS, Android, web) cho ticket FE.

## 5. Rủi ro & phương án

| Rủi ro | Xác suất | Phương án |
|---|---|---|
| Apple từ chối 4.3(b) | Cao | Android/web trước; appeal với bảng khác biệt; metadata "lunar calendar & self-knowledge"; PWA |
| Lịch âm VN lệch | Trung bình | Test 30 năm Tết; fallback bảng tra cứng 1900–2100 |
| Content chất lượng thấp / "bịa" | Trung bình | Schema + reviewer + `source_note`; AI Ask chỉ trả lời từ snapshot |
| Weekly sub bị coi là "dark pattern" | Thấp–TB | Nhắc trước trial 24 h, huỷ 1 chạm, hiển thị giá đầy đủ |
| Nhập sai giờ sinh → kết quả sai | Cao | Chế độ "không rõ giờ" giảm độ tin + giải thích |
