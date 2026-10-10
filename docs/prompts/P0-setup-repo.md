# P0 – Prompt scaffold monorepo (Sprint 1, T-SETUP-01…07)

Dán vào Claude Code trong repo đích (repo riêng hoặc Findme.vn):

```
Bạn là tech lead. Đọc docs/plan/04-B3-backend-design.md §3 và docs/plan/06-B4-code-plan.md §3 rồi scaffold monorepo "daily-fate" đúng cây thư mục đó.

Yêu cầu:
1. pnpm workspaces + Turborepo; TypeScript strict; ESLint + Prettier dùng chung từ packages/config; Vitest ở root.
2. apps/mobile: Expo SDK mới nhất (kiểm tra `npx expo --version` và docs.expo.dev), expo-router, NativeWind, Lingui (locales vi, en), expo-localization, expo-notifications, react-native-purchases, posthog-react-native, @sentry/react-native, react-native-mmkv, @tanstack/react-query, zustand, react-native-svg. Phải chạy được `pnpm --filter mobile ios`, `android`, `web`.
3. packages/engine: package `@fortune/engine`, dependency chỉ gồm astronomy-engine và lunar-javascript (cả hai MIT), export rỗng với kiểu `ProfileInput`, `Profile`, `DailyCard` theo docs/plan/04 §4 mapping.
4. packages/content: schema JSON (ajv) + script `content:build --locale`.
5. supabase/: migration 0001 đúng SQL trong docs/plan/04 §4, bật RLS owner-only, seed 1 user demo.
6. .github/workflows/ci.yml: lint, typecheck, test trên PR; job EAS preview build (dùng secret EXPO_TOKEN, bỏ qua nếu thiếu).
7. THIRD_PARTY_LICENSES.md liệt kê astronomy-engine, lunar-javascript, lasotuvi (credit), Rider-Waite-Smith 1909 (public domain, nguồn scan), deckaura tarot meanings (MIT), GeoNames (CC BY 4.0).
8. README: cách chạy, cấu trúc, link docs/plan.

Ràng buộc: không dùng Swiss Ephemeris hay bất kỳ package AGPL. Không hard-code chuỗi UI (dùng Lingui t``). Commit từng bước với message rõ ràng. Cuối cùng chạy `pnpm lint && pnpm typecheck && pnpm test` và báo kết quả thật.
```
