# Release checklist (soft launch VN + EN)

## Kỹ thuật
- [ ] `pnpm -r typecheck && pnpm -r test` xanh; golden snapshots không đổi ngoài ý muốn
- [ ] Engine: 20 profile golden + 3 profile người thật đối chiếu với thầy/reader (Tử Vi, Bát Tự, Tarot)
- [ ] API: p95 `/today` < 200 ms, `/readings` engine < 500 ms, AI first token < 3 s (staging)
- [ ] AI: eval ≥ 4/5 trên 20 case vi + 20 case en; kill-switch `ai_enabled` test được
- [ ] Daily job chạy đúng múi giờ 3 ngày liên tiếp trên staging; push không trùng
- [ ] Mã hoá birth data (kiểm tra DB không có plaintext), xoá tài khoản end-to-end
- [ ] Rate limit, helmet, CORS, secrets ngoài repo; `pnpm audit` không lỗi high
- [ ] Sentry release + sourcemaps; dashboard PostHog theo `docs/analytics-events.md`
- [ ] Backup DB + PITR bật

## Thanh toán & chính sách
- [ ] Sandbox mua/huỷ/restore iOS + Android; Stripe web; webhook idempotent
- [ ] Paywall: giá đầy đủ, chu kỳ gia hạn, huỷ 1 chạm, Restore; nhắc 24 h trước hết trial
- [ ] Không chữ "for entertainment purposes" làm lá chắn; disclaimer trung thực theo locale
- [ ] Privacy policy + Terms theo locale (vi, en), Data Safety form (Play), App Privacy (App Store)

## Store
- [ ] Listing vi/en: tiêu đề, phụ đề, từ khoá, 6 screenshot đúng chức năng
- [ ] Review notes nêu điểm "unique": engine chuẩn lịch quốc gia, compute-then-explain (Apple 4.3)
- [ ] Age rating; không nội dung y tế/pháp lý/tài chính cụ thể trong mô tả
- [ ] TestFlight + Play Internal 3 ngày dogfood, crash-free ≥ 99,5%

## Soft launch
- [ ] VN + 1 nước EN (CA hoặc AU), 2 tuần, ngân sách UA 100 USD/ngày
- [ ] Mục tiêu: D1 ≥ 40 %, D7 ≥ 20 %, trial start ≥ 5 %, trial→paid ≥ 25 %, refund < 2 %
- [ ] Quyết định go/no-go wave 2 theo `docs/01-market-research.md` mục S

## Runbook
- Rollback JS: EAS Update về bản trước; rollback API: deploy tag trước
- Khoá AI: flag `ai_enabled=false` → readings dùng template
- Sự cố thanh toán: tạm ẩn paywall qua flag `paywall_enabled`
- Hoàn tiền: theo store; ghi `refund` event; không tranh cãi với user
