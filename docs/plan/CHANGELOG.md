# Tiến độ thực thi

## 2026-10-10 – Sprint 1 (M0 scaffold) + phần lớn M1 engine, làm trong 1 phiên

**Quyết định mặc định (chưa được Trường xác nhận, đổi được bất cứ lúc nào):** tên tạm "Daily Fate"; Wave 1 = vi + en; không có marketplace người thật ở v1.

### Đã xong
| Ticket | Kết quả | Bằng chứng |
|---|---|---|
| T-SETUP-01/02/03 | pnpm + Turborepo monorepo; Expo SDK 57 (React Native 0.86, New Architecture) chạy web + native; TypeScript strict; Vitest; ESLint; CI GitHub Actions | `pnpm engine:test`, `.github/workflows/ci.yml` |
| T-SETUP-04 (một phần) | Migration `supabase/migrations/0001_init.sql` đầy đủ schema + RLS + delete_user | file SQL; chưa chạy trên project Supabase thật (cần tài khoản) |
| T-SETUP-07 | `THIRD_PARTY_LICENSES.md`, README | |
| T-ENG-01 | **Lịch âm VN** port thuật toán Hồ Ngọc Đức, tham số múi giờ (7 VN / 8 TQ) thay vì patch lunar-javascript | 41 năm Tết 1985–2030 đúng, round-trip 366 ngày 2024; chứng minh lệch 1985 và 2030 giữa VN/TQ |
| T-ENG-02 | Ngày tốt: hoàng đạo/hắc đạo, 12 trực, 28 sao, xung tuổi, giờ hoàng đạo, hướng tài/hỷ/phúc, lọc theo việc | test `almanac-bazi.test.ts` |
| T-ENG-03 | Bát tự: tứ trụ, thập thần, tàng can, tỷ lệ ngũ hành, vượng/nhược, dụng thần đơn giản, 8 đại vận | test 1985-01-21 |
| T-ENG-04 | **Tử vi đẩu số** port lasotuvi (MIT): 110 sao, miếu/vượng/đắc/hãm, đại hạn, tiểu hạn, tuần, triệt, cục, mệnh chủ/thân chủ | **50/50 lá số khớp oracle Python** (`test/oracle/tuvi-oracle.json`) |
| T-ENG-05/06 | Chiêm tinh: 10 hành tinh (astronomy-engine, ±1′), ASC/MC, Whole Sign + Placidus, aspects, retrograde, pha trăng, transit | kiểm chứng vật lý: MC đối Mặt trời lúc nửa đêm, ASC = kinh độ Mặt trời lúc mọc, Mercury retrograde 8/2024 |
| T-ENG-07 | Thần số học: Life Path (master 11/22/33), Expression, Soul Urge, Personality, Maturity, Attitude, Challenges, Pinnacles, Personal Year/Month/Day; chuẩn hoá tên tiếng Việt | test table-driven |
| T-ENG-08 | Tarot 78 lá RWS, draw deterministic theo seed (userId + ngày), 4 spread | test |
| T-ENG-09 | `dailyCard(profile, date)`: điểm 1–5 cho 5 mục, gộp lịch ngày tốt + ngũ hành + transit + tarot + personal day | test deterministic, đổi theo ngày |
| T-ENG-10 | `compare(a, b)`: nạp âm, lục hợp/tam hợp/xung, nguyên tố cung, synastry, life path; đối xứng | test |
| T-ENG-11 | `@fortune/engine` public API typed, build ESM | `pnpm engine:build` |
| App demo | `apps/mobile/App.tsx`: màn "Hôm nay" dùng engine thật, đổi vi/en runtime | typecheck xanh; web export (xem ghi chú) |

### Phát hiện khi code (đã ghi vào thiết kế)
- lasotuvi có **bug ma trận sinh khắc** (Thủy mệnh – Hỏa cục trả "sinh" thay vì "khắc"); engine TS dùng quy tắc ngũ hành chuẩn, test ghi chú rõ.
- lasotuvi dùng **singleton sao có state** nên oracle phải deep-copy; script oracle đã patch.
- Tết 2030: sóc 02/02/2030 16:08 UTC → VN (UTC+7) ăn Tết **2/2**, TQ (UTC+8) **3/2** – đúng như B3a §3.1 dự đoán, nay có test.
- Tên nạp âm: engine dùng chính tả chuẩn (Lộ Bàng Thổ, Giản Hạ Thủy), lasotuvi viết khác; test so sánh theo hành.

### Chưa làm (ticket còn mở)
- T-SETUP-02: Lingui/ICU (hiện là dictionary tối giản `apps/mobile/src/i18n.ts`), NativeWind, expo-router, MMKV, RevenueCat, PostHog, Sentry.
- T-SETUP-04/05/06: tạo project Supabase, RevenueCat, PostHog thật (cần tài khoản của Trường).
- T-DATA-*: content pack (chưa có câu luận giải nào; app demo mới hiện số liệu engine).
- T-FE-*: onboarding, lá số SVG, lịch, so sánh, paywall.
- Ảnh tarot RWS chưa tải vào assets.
