# P3b – Prompt backend (T-SETUP-04, T-BE-01…05)

```
Đọc docs/plan/04-B3-backend-design.md. Trong supabase/:
1. Migration 0001 đúng schema §4 + RLS owner-only; policy content_packs public read; function delete_user() cascade + xoá Storage.
2. Edge Function rc-webhook (Deno/TS): verify Authorization header bằng RC webhook secret; map event INITIAL_PURCHASE/RENEWAL/CANCELLATION/EXPIRATION/BILLING_ISSUE/PRODUCT_CHANGE → upsert entitlements; idempotent theo event id; test bằng payload mẫu của RevenueCat.
3. Edge Function daily-push: cron mỗi 15 phút; chọn profiles có push_enabled và (push_hour, push_minute) rơi vào cửa sổ theo tz; import @fortune/engine (build ESM cho Deno) để tính DailyCard; gửi Expo Push; ghi daily_logs. Giới hạn 1 push/user/ngày.
4. Edge Function report-pdf: nhận {kind, engineResult, locale}; render HTML template → PDF; lưu Storage readings/<user>/<id>.pdf; insert readings. Kiểm tra entitlement/consumable trước khi render.
5. packages/api-client: Supabase typed client (gen types), React Query hooks: useProfile, usePeople, useEntitlement, useContentPack(locale), useReadings.
6. Test: RLS (user A không đọc được B), webhook idempotency, cron chọn đúng user ở 2 tz.
Không dùng service key ở client. Ghi README cho từng function (env cần có).
```
