# Findme — Ứng dụng bói toán / huyền học đa ngôn ngữ

Mobile-first (Expo) + Web (Next.js). Đông Á: Tử Vi, Bát Tự/Saju, Lịch ngày tốt xấu, Kinh Dịch. Phương Tây: Thần số học, Tarot, Chiêm tinh. Nguyên tắc **compute-then-explain**: engine tất định tính theo chuẩn lịch từng quốc gia, LLM chỉ diễn giải trên dữ liệu đã tính.

- **Plan & nghiên cứu:** [`docs/README.md`](./docs/README.md) (B1 thị trường → B4 plan code + prompt).
- **Chạy thử engine:** [`spikes/engine-smoke`](./spikes/engine-smoke/README.md).

## Cấu trúc

| Thư mục | Nội dung | Trạng thái |
|---|---|---|
| `packages/engine-core` | Types, zod schema, can chi, RNG có seed | ✅ |
| `packages/engine-calendar` | Giờ mặt trời thực, múi giờ/DST, tiết khí, 4 trụ, lịch âm VN/CN/KR/JP | ✅ |
| `packages/engine-bazi` · `engine-almanac` · `engine-ziwei` | Bát Tự + đại vận; lịch ngày + chọn ngày; Tử Vi (iztro) + cách cục + vận hạn | ✅ |
| `packages/engine-numerology` · `engine-astro` · `engine-tarot` · `engine-iching` | Thần số học; chiêm tinh (astronomy-engine); Tarot 1909; Kinh Dịch (Legge) | ✅ |
| `packages/ai-composer` | Prompt + structured output + validator + fallback + chi phí | ✅ |
| `packages/content` | Dataset PD, atoms (160 vi/en), glossary, manifest key, pipeline draft | ✅ |
| `packages/i18n` | Catalog vi/en, cấu hình locale, lint key, pseudo-locale, draft bằng LLM | ✅ |
| `apps/api` | Fastify + Drizzle (PGlite/pg): auth guest, hồ sơ mã hoá, readings + AI stream, Daily Oracle, admin, billing, push | ✅ 35 test |
| `packages/api-client` | OpenAPI → openapi-fetch client | ✅ |
| `apps/mobile` · `packages/ui` | Expo Router, NativeWind, SVG chart dùng chung | 🚧 |
| `apps/web` | Next.js 15: SEO hub, PWA, admin CMS | 🚧 |
| `tooling/golden` | 20 hồ sơ biên × 8 engine, 41 snapshot | ✅ |

## Chạy

```bash
pnpm install
pnpm -r --filter './packages/*' test          # engines, composer, content, i18n
pnpm --filter @findme/api test                 # API trên PGlite in-memory
pnpm --filter @findme/api dev                  # http://localhost:3001/docs
pnpm --filter @findme/api content:seed -- --publish-reviewed   # nạp atoms + glossary
pnpm --filter @findme/api job:daily -- 2026-10-11 vi,en         # sinh Daily Oracle
```

Biến môi trường chính (`apps/api/.env.example`): `DATABASE_URL`, `JWT_SECRET`, `BIRTH_ENC_KEY`, `ANTHROPIC_API_KEY` (+`AI_ENABLED`), `ADMIN_TOKEN`, `REVENUECAT_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`/`STRIPE_PRICES`, `PUSH_ENABLED`.
