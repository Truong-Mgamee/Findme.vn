# P3c – Prompt frontend (T-FE-*)

## Prompt chung cho 1 màn hình
```
Đọc docs/plan/05-B3-frontend-design.md và docs/plan/02 flow {F#}. Implement màn {SCREEN} trong apps/mobile theo route {ROUTE}.
- Dùng component từ packages/ui; nếu thiếu, tạo trong packages/ui kèm story.
- Chuỗi qua Lingui; chạy `pnpm i18n:extract` và điền vi + en.
- Dữ liệu từ @fortune/engine (local) và hooks trong packages/api-client; không gọi Supabase trực tiếp.
- Gate tính năng bằng can('{feature}') từ entitlement; Free phải thấy được giá trị trước khi gặp paywall.
- Analytics: bắn event theo docs/plan/04 §7.
- Accessibility: label cho biểu đồ, touch target ≥ 44pt.
- Test: RNTL cho logic; nếu là onboarding/paywall thêm Maestro flow.
- Chụp screenshot iOS, Android, web đính kèm PR.
```

## Prompt riêng: TuViChart / NatalWheel
```
Vẽ lá số Tử vi 12 cung (lưới 4×4, cung giữa hiện thông tin mệnh) bằng react-native-svg từ output engine.tuvi; sao chính tinh đậm, trạng thái miếu/vượng/đắc/hãm bằng màu token; tuần/triệt vẽ chữ chắn. Tap cung → bottom sheet 3 lớp nội dung từ content pack. Natal wheel: 12 nhà, glyph hành tinh (font OFL), aspect lines theo loại. Xuất được ảnh PNG để share.
```

## Prompt riêng: Paywall
```
Implement paywall theo docs/plan/02 F7 và Apple 3.1.2: hiển thị giá đầy đủ từ RevenueCat offerings (Intl.NumberFormat), chu kỳ, ngày thu tiền đầu tiên sau trial, nút Restore, link Terms/Privacy, nút "Tiếp tục với bản Free" rõ ràng. A/B biến thể qua RevenueCat Experiments / PostHog flag `paywall_variant`. Bắn paywall_viewed, trial_started, purchase, với placement.
```
