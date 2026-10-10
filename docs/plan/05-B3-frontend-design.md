# B3c – Thiết kế Frontend (mobile-first, có web)

## 1. Stack

| Lớp | Chọn | Lý do |
|---|---|---|
| Framework | **Expo SDK mới nhất (≥ 55, New Architecture bắt buộc)** + React Native + **react-native-web** | 1 codebase iOS/Android/web; EAS Build/Submit/Update (OTA) |
| Routing | expo-router (file-based, deep link, web URL thật) | SEO cho web, universal links cho share |
| State | Zustand (UI) + TanStack Query (server) + MMKV (persist) | Nhẹ, offline-first |
| Styling | NativeWind (Tailwind cho RN) + tokens trong `packages/ui` | Web/mobile cùng class |
| i18n | Lingui (ICU, extract/compile, pseudo-locale test) | Plural/gender chuẩn; đổi locale runtime |
| Charts | react-native-svg (natal wheel, lá số 12 cung) + Skia cho hiệu ứng lật bài | Vẽ vector, export ảnh share |
| IAP | react-native-purchases (RevenueCat) + Paywall UI | Chuẩn StoreKit2/Play Billing, A/B giá |
| Push | expo-notifications + widget: iOS WidgetKit (expo-apple-targets), Android Glance | Hook hằng ngày |
| Analytics | PostHog RN + Sentry | |
| Test | Vitest (engine), RNTL (component), Maestro (E2E onboarding + paywall) | |

Web: cùng app chạy `expo export -p web` → static + PWA (manifest, offline cache content pack). Trang landing/SEO riêng (`apps/web-landing`, Astro) để Wave 2 **[tuỳ chọn]**.

## 2. Information Architecture

```
Tab bar (5):
  Hôm nay (Home/DailyCard)   – mặc định
  Lá số (Destiny Profile: tabs theo hệ)
  Lịch (Good-day Calendar / Moon calendar theo locale)
  Khám phá (Readings, Tarot spreads, Compatibility, Library)
  Tôi (Profile, People, Subscription, Settings, About/Licenses)
Modal/stack:
  Onboarding (7 bước) · Paywall · ReadingDetail · ShareSheet · DayDetail · CompareResult · Ask (v1.1)
```

Route (expo-router):
```
app/
  (onboarding)/lang.tsx intent.tsx birth.tsx place.tsx preview.tsx push.tsx paywall.tsx
  (tabs)/index.tsx profile/[system].tsx calendar.tsx explore.tsx me.tsx
  reading/[id].tsx  tarot/[spread].tsx  compare/[a]/[b].tsx  day/[date].tsx
  paywall.tsx  settings/*.tsx  ask.tsx
```

## 3. Màn hình chính – spec ngắn

| Màn | Thành phần | Free/Plus | Ghi chú i18n |
|---|---|---|---|
| **DailyCard** | Header ngày (dương · âm · can chi hoặc moon phase), 4 thanh điểm, 3 câu, lá tarot lật, lucky color/number, nên/tránh, Share, streak chip | Free | Câu ghép từ template ICU có biến `{name}`, `{element}`, `{planet}` |
| **Onboarding/Birth** | DatePicker (dương, hiện âm bên dưới ở locale Á), TimePicker **2 chế độ** (12 canh giờ có icon con giáp / 24h), toggle "không rõ giờ" | – | Canh giờ chỉ hiện với `vi, zh, ko, ja` |
| **Onboarding/Place** | Search GeoNames offline (SQLite bundle 2 MB) → lat/lng/tz | – | Tên thành phố có alternate names theo locale |
| **ProfilePreview** | 4 "huy hiệu": Mệnh ngũ hành · Sun/Moon/ASC · Life Path · Lá tarot bản mệnh + 1 câu | Free | Thứ tự huy hiệu theo locale |
| **Paywall** | 2 gói (annual highlight), Deep Reading lẻ, dòng giá/chu kỳ/ngày charge, link huỷ, Restore, "Tiếp tục Free" | – | Giá format `Intl.NumberFormat` theo store |
| **Profile/TuVi** | Lá số 12 cung SVG (sao + trạng thái màu), tap cung → sheet 3 lớp nội dung | Lớp 1–2 Free, 3 Plus | Tên sao giữ Hán-Việt + tooltip |
| **Profile/Astro** | Natal wheel SVG (planets, houses, aspects), bảng vị trí | như trên | Glyph font chiêm tinh (OFL) |
| **Profile/Numerology** | Lưới 3×3 + core numbers | như trên | Alphabet map theo locale |
| **Calendar** | Month grid tô màu, filter việc, DayDetail (giờ hoàng đạo, hướng, lý do) | Free cơ bản, Plus filter theo tuổi | EN: moon phase + personal day |
| **Compare** | Chọn 2 hồ sơ, kết quả theo hệ + tổng điểm + share | 1/ngày Free | |
| **Tarot spread** | Chọn spread, shuffle (gesture), lật từng lá, giải nghĩa theo vị trí | 1 lá Free, spread Plus | Ảnh PD, deck Marseille cho Plus |
| **Settings** | Locale, giờ push, hệ mặc định, quản lý sub, xoá tài khoản, Licenses | – | |

## 4. Design system (packages/ui)

- Tokens: màu (dark mặc định, light), spacing 4-pt, radius, typography Noto Sans (+ Noto Serif cho tiêu đề), glyph font.
- Components: `Card`, `ScoreBar`, `Chip`, `Sheet`, `TabsScroll`, `TarotCard` (flip), `WheelChart`, `TuViChart`, `Paywall`, `ShareCanvas` (render ảnh 1080×1920).
- Accessibility: contrast ≥ 4,5:1, dynamic type, VoiceOver label cho biểu đồ (mô tả text).
- Motion: lật bài 400 ms, loading "lập lá số" 2 s có progress 4 engine.

## 5. i18n & localization rules

1. Không hard-code chuỗi; `t\`...\`` Lingui; CI fail nếu có chuỗi chưa extract.
2. Pseudo-locale (`en-XA`) để test tràn UI; JA/KO/ZH test font fallback.
3. Số, ngày, tiền: `Intl.*`; lịch âm hiển thị song song ở `vi, zh-Hant, ko` (ko dùng âm lịch cho Seollal), `ja` không hiển thị âm lịch (Nhật bỏ âm lịch từ 1873) → hiển thị 六曜 (rokuyō) thay thế **[Wave 2]**.
4. Content pack tải theo locale, fallback `en`; đoạn nào thiếu hiển thị EN + tag "chưa dịch" trong dev.
5. Glossary thuật ngữ cố định (`packages/i18n/glossary.json`): mỗi thuật ngữ có `term`, `keep_original`, bản dịch theo locale.
6. Hình ảnh/biểu tượng không chứa chữ; share image render chữ theo locale.

## 6. Offline & performance

- Engine on-device; content pack cache MMKV/filesystem; DailyCard tính sẵn cho 7 ngày.
- App size mục tiêu < 60 MB (ảnh tarot 720px WebP ≈ 6 MB; GeoNames SQLite 2 MB).
- Cold start < 2 s; DailyCard render < 300 ms.

## 7. Store assets (chuẩn bị song song)

- Screenshot 6 ngôn ngữ, video 15 s "4 hệ – 1 hồ sơ".
- Metadata từ khoá né "fortune telling": "lunar calendar", "birth chart", "numerology", "tarot", "self-knowledge", "daily guidance".
- App Review Notes: bảng khác biệt (B2 §4) + tài khoản demo + video.
