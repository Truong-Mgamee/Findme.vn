# Analytics events (PostHog) — nguồn sự thật cho dashboard

Quy ước: `snake_case`, props tối thiểu; không gửi ngày sinh/họ tên. Mọi event tự gắn `locale`, `tradition_pack`, `calendar_standard`, `country`, `platform`, `app_version`, `is_plus`, `experiment_variants`.

| Event | Khi nào | Props | Màn |
|---|---|---|---|
| `app_open` | mở app / foreground | `source` (push/deeplink/icon) | — |
| `onboarding_step` | vào mỗi bước | `step` (locale/pack/birth/insights/daily_time/first_reading), `index` | S0–S4 |
| `onboarding_completed` | xong S4 | `duration_ms`, `time_unknown` | S4 |
| `profile_created` | POST /profiles OK | `is_self`, `time_unknown`, `tz_estimated`, `has_name` | S1 |
| `first_reading_done` | reading đầu stream xong | `kind`, `first_token_ms`, `total_ms`, `used_fallback_template` | S4 |
| `daily_oracle_viewed` | GET /today render | `streak`, `segment_key`, `from_cache`, `clash_day` | S5 |
| `push_permission` | sau prompt | `granted` | S3 |
| `push_received` / `push_opened` | SDK | `campaign` (daily) | — |
| `module_opened` | vào module | `module` (ziwei/bazi/tarot/numerology/iching/almanac/compat/astro) | S6→S7..S12 |
| `reading_started` | POST /readings | `kind`, `paid_by` (free_first/subscription/credit) | S7–S11 |
| `reading_finished` | stream done | `kind`, `attempts`, `used_fallback_template`, `cost_usd`, `sections` | — |
| `reading_rated` | thumbs | `kind`, `score` (1/−1) | — |
| `ask_sent` | POST /ai/ask | `quota_left`, `has_reading_context` | S14 |
| `paywall_shown` | mở S15 | `trigger` (second_reading/ask_quota/compat/pick/history), `variant` | S15 |
| `paywall_cta` | bấm gói | `product`, `variant` | S15 |
| `trial_started` | RevenueCat webhook | `product` | — |
| `purchase` | webhook | `product`, `price_usd`, `country`, `source` (ios/android/web) | — |
| `cancel` / `refund` | webhook | `product`, `days_active` | — |
| `credit_purchased` / `credit_spent` | webhook / POST readings | `pack`/`kind` | — |
| `share_clicked` / `share_completed` | share card | `type` (today/ziwei/tarot), `channel` | S5,S7,S9 |
| `invite_sent` / `invite_accepted` | compat invite | — | S13 |
| `date_pick_run` | POST /almanac/pick | `task`, `range_days`, `profiles` | S12 |
| `settings_changed` | — | `key` (locale/calendar_standard/daily_hour) | S16 |
| `data_delete_requested` | DELETE /me | — | S16 |
| `error_shown` | lỗi hiển thị | `code`, `route` | — |

## Dashboard tối thiểu
- North Star: `daily_oracle_viewed` unique users/tuần.
- Funnel: `app_open` → `onboarding_completed` → `first_reading_done` → `paywall_shown` → `trial_started` → `purchase`.
- Retention cohort theo `onboarding_completed` (D1/D7/D30), cắt theo `locale`, `tradition_pack`.
- Chi phí AI: sum(`reading_finished.cost_usd`) / DAU; tỉ lệ `used_fallback_template`.
- Chất lượng: `reading_rated` score trung bình theo `kind`/`locale`.
