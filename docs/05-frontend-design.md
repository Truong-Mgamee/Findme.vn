# B3.3 — Thiết kế Frontend (Mobile-first, có Web)

## 1. Stack

| Lớp | Mobile | Web |
|---|---|---|
| Framework | **Expo SDK mới nhất (Expo Router, React Native)**, EAS Build/Update | **Next.js 15 App Router**, React 19 |
| Styling | NativeWind (Tailwind cho RN) | Tailwind + shadcn/ui |
| i18n | `i18next` + `react-i18next` + `expo-localization` (ICU qua `i18next-icu`) | `next-intl` (routing `/[locale]/…`, ICU) — **cùng file messages** trong `packages/i18n` |
| State/data | TanStack Query + Zustand; client sinh từ OpenAPI (`packages/api-client`) | như mobile |
| Đồ hoạ lá số | `react-native-svg` (chạy trên web qua `react-native-web`) → **1 component SVG dùng chung** cho Tử Vi 12 cung, Bát Tự 4 trụ, Tarot spread | như mobile |
| Thanh toán | `react-native-purchases` (RevenueCat) | Stripe Checkout |
| Push | `expo-notifications` | Web Push (service worker) |
| Analytics | PostHog RN SDK | PostHog JS |
| Hình ảnh | `expo-image`, tarot deck từ CDN (webp, 2 kích thước) | `next/image` |
| Offline | Engine-core chạy local cho lịch ngày + lá số cơ bản (bundle `engine-calendar`, `engine-numerology`, `engine-tarot`), cache `/today` 24h | SSR + ISR trang lịch/landing theo locale (SEO) |

Lý do chọn Expo + Next thay vì Flutter/Native: engine viết bằng TS → chạy được cả 3 nơi; đội nhỏ 1 codebase; Expo Router hỗ trợ deep link/universal link cho mời bạn (compatibility).

## 2. Information Architecture (tab bar 4 mục + FAB)

```
Today (Daily Oracle)  |  Explore  |  (+) Ask AI  |  You (hồ sơ, người thân, gói)  |  More (lịch, cài đặt)
```

### Màn hình (wave 1)
| # | Màn | Thành phần chính | Ghi chú |
|---|---|---|---|
| S0 | Splash/Locale | auto-detect, chọn ngôn ngữ, chọn gói nội dung (Đông Á/Phương Tây/Cả hai – gợi ý theo quốc gia) | 1 chạm |
| S1 | Birth input | date wheel theo locale, time (+ "không rõ"), gender, place autocomplete (GeoNames) | validate tz/DST ngầm |
| S2 | "Đây là bạn" | 3 insight card (engine) + nút Tiếp | <300ms, không LLM |
| S3 | Daily time + push | chọn giờ, bật push (pre-permission prompt) | |
| S4 | First Reading | stream LLM, biểu đồ render trước, skeleton | aha |
| S5 | Today | Oracle card lớn (swipe: tổng quan → lịch ngày/lá bài → con số/màu → hành động), streak, share, Ask | nền của retention |
| S6 | Explore | lưới module theo gói; badge "Free hôm nay" / "Plus" | |
| S7 | Ziwei Chart | SVG 12 cung (zoom, chạm cung → bottom sheet), toggle đại hạn/lưu niên/lưu nguyệt, cảnh báo nếu không rõ giờ | VI/ZH |
| S8 | Bazi Chart | 4 trụ, ngũ hành radar, timeline đại vận (scroll ngang), lưu niên | VI/ZH/KO/JA |
| S9 | Tarot | chọn trải bài, nhập câu hỏi, animation lật, kết quả + luận | EN/ES/PT/VI/JA/KO |
| S10 | Numerology | 7 chỉ số dạng thẻ, năm/tháng/ngày cá nhân | EN/ES/PT/VI |
| S11 | I Ching | gieo 6 hào (haptic), quẻ chính/biến, luận | VI/ZH/EN |
| S12 | Almanac & Date Picker | lịch tháng (âm/dương theo chuẩn), chi tiết ngày, bộ lọc việc + tuổi | VI/ZH/KO/JA |
| S13 | Compatibility | chọn/mời hồ sơ 2, điểm tổng, chi tiết (Plus) | |
| S14 | Ask AI | chat, chip gợi ý câu hỏi theo reading, quota còn lại | |
| S15 | Paywall | 3 gói + credit, giá nội tệ, điều khoản gia hạn, restore | A/B qua PostHog flag |
| S16 | You/Settings | hồ sơ, người thân, ngôn ngữ, chuẩn lịch, gói, quyền riêng tư (xoá dữ liệu), about (ghi công GeoNames, deck 1909) | |

## 3. Luồng điều hướng (Expo Router)

```
app/
  (onboarding)/locale.tsx, birth.tsx, insights.tsx, daily-time.tsx, first-reading.tsx
  (tabs)/today.tsx, explore/index.tsx, ask.tsx, you.tsx, more.tsx
  reading/[id].tsx
  ziwei/[profileId].tsx, bazi/[profileId].tsx, tarot/new.tsx, numerology/[profileId].tsx, iching/new.tsx
  almanac/index.tsx, almanac/pick.tsx
  compat/index.tsx, invite/[code].tsx
  paywall.tsx (modal)
```
Web mirror: `app/[locale]/(marketing)/page.tsx` (landing SEO theo locale: "lịch âm hôm nay", "tarot card of the day"), `app/[locale]/app/...` (PWA), `app/admin/...` (CMS atoms + review queue).

## 4. Design system

- Tokens trong `packages/ui/tokens.ts`: màu (nền tối mặc định "night sky" + chế độ sáng), typography theo script: Latin (Inter), Việt (Inter có dấu đầy đủ), CJK (Noto Sans SC/TC/JP/KR, tải theo locale), Thai/Devanagari ở wave 3. Chữ Hán trong lá số dùng Noto Serif cho cảm giác cổ điển.
- Kích thước chạm ≥44pt; contrast WCAG AA; hỗ trợ Dynamic Type.
- Text expansion: thiết kế nút chịu +35% chiều dài (de/pt), CJK ngắn hơn → tránh truncation; dùng pseudo-locale khi QA.
- RTL-ready (I18nManager) dù wave 1 không có ar; không hard-code left/right.
- Motion: lật bài, gieo quẻ, lá số "vẽ" dần — có `reduceMotion`.

## 5. Component dùng chung (packages/ui)

| Component | Props chính | Dùng ở |
|---|---|---|
| `ZiweiChartSVG` | `chart: ZiweiChart, highlight?: PalaceId, horoscope?: {decadal, yearly, monthly}` | S7, share card |
| `BaziPillars` | `chart: BaziChart, showHidden?: bool` | S8, S13 |
| `LuckTimeline` | `dayun[], liunian[], current` | S8 |
| `TarotSpread` | `spread: 'one'|'three'|'celtic', cards[], flipState` | S9, S5 |
| `NumerologyGrid` | `numbers: {lifePath, expression,…}` | S10 |
| `HexagramView` | `lines[6], changing[]` | S11 |
| `AlmanacDayCard` | `almanac: DayAlmanac, forProfile?: ProfileCore` | S5, S12 |
| `OracleCard` | `payload: DailyPayload, streak` | S5 |
| `PaywallSheet` | `offerings, experimentVariant` | S15 |
| `ShareCard` | `type, data` → PNG (react-native-view-shot / satori trên web) | S5, S7, S9 |

## 6. i18n UI — quy tắc

1. Mọi chuỗi qua `t('key', {vars})`; key theo namespace `onboarding.birth.title`. Không nối chuỗi; dùng ICU plural/select (ví dụ `{count, plural, one {# lá} other {# lá}}`).
2. Định dạng ngày/giờ/số/tiền bằng `Intl` theo locale; lịch âm hiển thị theo `calendarStandard`.
3. Thuật ngữ huyền học lấy từ `glossary` (không dịch tự do trong UI).
4. Ảnh/biểu tượng không chứa chữ; màu may mắn có nhãn text.
5. Font fallback theo locale; kiểm tra `fontFamily` cho CJK trên Android.
6. Pipeline: `pnpm i18n:extract` → LLM draft (glossary) → file `{locale}.json` với flag `_draft` → reviewer duyệt (PR) → CI chặn key thiếu.

## 7. Hiệu năng & chất lượng

- Budget: TTI màn Today <1,5s (cold), bundle JS mobile <6MB, ảnh deck lazy theo lá.
- Skeleton + optimistic cho Today; engine local để không phụ thuộc mạng ở lịch ngày.
- Accessibility: label cho mọi SVG (cung/sao đọc được bằng screen reader), haptics có tắt.
- Test: Jest + RNTL (unit), Maestro (E2E onboarding→first reading→today→paywall, chạy cho vi và en), Playwright cho web, Chromatic/Storybook cho `packages/ui`.
- Release: EAS Update cho hotfix JS; phased rollout; store listing theo locale (ASO) với screenshot đúng chức năng (tránh Apple 4.3/Google metadata).

## 8. Web riêng: SEO content hub (kênh acquisition miễn phí)

- Trang ISR theo locale: `/vi/lich-am-hom-nay`, `/vi/xem-ngay-tot/{thang-nam}`, `/en/tarot-card-of-the-day`, `/en/life-path-number/{n}`, `/vi/tu-vi/{can-chi}`… sinh từ engine + atoms published (không LLM lúc request).
- Căn cứ: "lá số tử vi" ~65K lượt tìm/tháng ở VN; tarot là thực hành được tìm nhiều nhất ở Brazil → trang web kéo install qua smart banner + deep link.
