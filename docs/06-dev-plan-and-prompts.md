# B4 — Plan code chi tiết & prompt cho từng bước

> Đã rà soát lại B1–B3: (1) thị trường & mô hình thu phí đã chốt (file 01), (2) luồng đã khớp pain point (file 02), (3) mọi engine đã chạy thử và license OK (file 03), (4) kiến trúc BE/FE thống nhất 1 ngôn ngữ TS (file 04, 05). Dưới đây là plan 14 tuần cho đội 3–4 người (1 PM/coder, 2 dev, 1 designer part-time) + reviewer nội dung thuê ngoài.
> Mỗi bước có **prompt** dán thẳng vào Claude Code tại root repo. Chạy theo thứ tự; mỗi prompt kết thúc bằng tiêu chí nghiệm thu để tự kiểm tra.

## 0. Lịch tổng (wave 1: vi + en)

| Tuần | Sprint | Mục tiêu | Prompt | Mốc đo |
|---|---|---|---|---|
| 1 | S0 Foundation | Monorepo, CI, i18n khung, engine-core types | P0 | `pnpm build && pnpm test` xanh |
| 2 | S1 Engines Đông Á | engine-calendar (VN/CN), engine-bazi, engine-almanac | P1, P2 | golden tests pass (Tết 1985/2007/2030) |
| 3 | S1b | engine-ziwei (iztro wrapper + render model) | P3 | lá số mẫu khớp tinhmenhdo/iztro demo |
| 3 | S2 Engines Tây | engine-numerology, engine-tarot, engine-iching, engine-astro (cơ bản) | P4, P5 | 100% unit test, dataset JSON đủ 78 lá / 64 quẻ |
| 4–5 | S3 API & DB | Fastify + Drizzle + Supabase Auth guest + OpenAPI client | P6 | Postman/E2E: onboarding → profile → ziwei/bazi/numerology JSON |
| 5 | S4 Content | Seed content atoms (vi, en) + CMS admin + glossary | P7 | ≥60% atom high-traffic published |
| 6 | S5 AI | reading-composer + Daily Oracle job + push | P8, P9 | reading sâu <6s first token, daily job chạy đúng múi giờ |
| 7–9 | S6 Mobile MVP | Onboarding → Today → Explore → Ziwei/Bazi/Tarot/Numerology → Ask | P10 | Maestro E2E vi+en pass; TTI <1,5s |
| 9–10 | S7 Web | Next.js PWA + landing SEO + admin | P11 | Lighthouse ≥90, ISR trang lịch/tarot |
| 10 | S8 Monetization | RevenueCat + Stripe + paywall + experiments + quota | P12 | sandbox mua/huỷ/restore OK; webhook cập nhật entitlements |
| 11 | S9 i18n pipeline | LLM draft + review flow UI & atoms; pseudo-locale QA | P13 | 0 key thiếu; glossary áp dụng |
| 12 | S10 Hardening | Analytics, golden tests, bảo mật, store listing, soft launch VN + EN | P14 | checklist release 100%; crash-free ≥99,5% |
| 13–14 | Soft launch | Đo D1/D7, trial→paid, RPI; A/B giá | — | quyết định mở wave 2 |

Definition of Done chung: code có test, lint xanh, type-safe, i18n không hard-code, PR có mô tả + ảnh chụp, không secrets trong repo.

---

## P0 — Khởi tạo monorepo & nền tảng

```text
Bạn là senior full-stack TypeScript engineer. Khởi tạo monorepo cho sản phẩm "Findme" (app bói toán/huyền học đa ngôn ngữ, mobile-first + web) trong repo hiện tại.

STACK: pnpm workspaces + Turborepo; TypeScript strict; apps/api (Fastify 5 + fastify-type-provider-zod + @fastify/swagger), apps/mobile (Expo SDK mới nhất, Expo Router, NativeWind, react-native-svg), apps/web (Next.js 15 App Router, Tailwind, next-intl); packages/engine-core, engine-calendar, engine-bazi, engine-almanac, engine-ziwei, engine-numerology, engine-tarot, engine-iching, engine-astro, content, i18n, ui, api-client; tooling (eslint flat config, tsconfig base, vitest).

YÊU CẦU:
1. Tạo cấu trúc như docs/04-backend-design.md mục 4. Mỗi package có package.json (name @findme/<pkg>), tsconfig, src/index.ts, vitest config; export ESM + types.
2. packages/engine-core: định nghĩa đúng các type ở docs/04 mục 7 (Locale, TraditionPack, CalendarStandard, BirthInput, Engine<I,O>, ReadingInput, ReadingEngineOutput) + zod schema tương ứng (BirthInputSchema…), export cả type lẫn schema.
3. packages/i18n: cấu trúc messages/{vi,en}.json với namespace (common, onboarding, today, explore, paywall, settings), helper `createT(locale)` dùng ICU (intl-messageformat), script `pnpm i18n:lint` báo key thiếu giữa các locale và key không dùng; locale config (direction, dateFormat, numberFormat, defaultTraditionPack theo country, defaultCalendarStandard theo country: VN→vn, CN/TW/HK/SG/MY→cn, KR→kr, JP→jp, còn lại→cn).
4. Turbo pipeline: build, test, lint, typecheck; GitHub Actions CI chạy cả 4 trên pnpm cache; Husky + lint-staged.
5. .env.example cho api (DATABASE_URL, REDIS_URL, SUPABASE_URL/KEY, ANTHROPIC_API_KEY, REVENUECAT_WEBHOOK_SECRET, STRIPE_*), mobile (EXPO_PUBLIC_API_URL), web.
6. README gốc: cách chạy từng app, sơ đồ package.
7. Cài đúng version engine: iztro@2.6.1, lunar-typescript@1.8.6, lunar-date-vn@1.0.6, astronomy-engine@2.1.19 vào các package engine tương ứng (chưa cần code logic).

NGHIỆM THU: `pnpm install && pnpm -r build && pnpm -r test && pnpm lint && pnpm typecheck` xanh; `pnpm --filter api dev` lên /healthz và /docs (Swagger); `pnpm --filter web dev` hiển thị trang /vi và /en với chuỗi từ packages/i18n; `pnpm --filter mobile start` khởi động được. Không hard-code chuỗi UI.
```

## P1 — engine-calendar: chuẩn lịch theo quốc gia + giờ mặt trời thực

```text
Bạn là engineer chuyên lịch pháp Đông Á. Implement packages/engine-calendar.

BỐI CẢNH (docs/03-data-sources.md mục 2, 6.3): lịch âm Việt Nam (UTC+7, thuật toán Hồ Ngọc Đức, lib lunar-date-vn) khác lịch Trung Quốc (UTC+8, lib lunar-typescript). Ví dụ đã verify: 1985-01-21 là mùng 1 Tết VN nhưng là 1/12 âm (năm trước) theo TQ; 2007-02-17 và 2030-02-02 là mùng 1 Tết VN nhưng TQ là 30/12. Mọi can chi của user Việt phải tính theo chuẩn VN.

YÊU CẦU:
1. API:
   - `resolveBirthMoment(input: BirthInput): BirthMoment` → { localDateTime (ISO, tz nơi sinh), utc, trueSolarDateTime? (áp dụng equation of time + hiệu chỉnh kinh độ khi useTrueSolarTime=true; dùng astronomy-engine), dstApplied: boolean, warnings[] }. Dùng luxon + @vvo/tzdb cho DST lịch sử; nếu place.tz thiếu → geo-tz từ lat/lng.
   - `toLunar(moment, std: CalendarStandard): LunarDate` → { year, month, isLeapMonth, day, ganzhi: {year, month, day, hour} (chuỗi Hán + mã số 0-59), jieqi hiện hành, isBeforeLichun }. std='vn' → lunar-date-vn; 'cn' → lunar-typescript; 'kr'/'jp' → tạm dùng lunar-typescript với offset múi giờ +9 và đánh dấu `approximation: true` (TODO xác minh KASI).
   - Quy ước can chi tháng/năm theo tiết khí (Lập Xuân) cho Bát Tự, tách khỏi mùng 1 âm (dùng cho Tử Vi) — expose cả 2: `ganzhiBySolarTerms` và `ganzhiByLunarNewYear`.
   - Quy ước giờ Saju Hàn: option `koreanSolarTimeAdjust` (-30 phút) khi std='kr'.
   - Ranh giới giờ Tý: option `earlyLateZi` ('split' | 'merged').
2. Golden tests (vitest): bảng ≥30 ngày gồm 1985-01-21, 1985-02-20, 2007-02-17/18, 2030-02-02/03, các ngày quanh Lập Xuân, ngày DST ở US/EU, tháng nhuận 2023 (VN & CN), so sánh output với giá trị mong đợi (ghi nguồn trong comment: lunar-date-vn/lunar-typescript đã chạy ở docs/03 mục 6.3 và bảng Hồ Ngọc Đức).
3. Thuần hàm, không I/O, chạy được trên React Native (không dùng Node API).
4. README package: giải thích khác biệt chuẩn lịch, 2 kiểu can chi, giờ mặt trời thực.

NGHIỆM THU: tests pass; `toLunar('1985-01-21', 'vn')` = 1985/1/1 và `'cn'` = 1984/12/1; bundle không import node:*.
```

## P2 — engine-bazi + engine-almanac

```text
Bạn là engineer am hiểu Tứ Trụ (Bát Tự) và lịch vạn niên. Implement packages/engine-bazi và packages/engine-almanac trên nền packages/engine-calendar và lunar-typescript@1.8.6 (đã verify có EightChar, Yun, DaYun, LiuNian, LiuYue, XiaoYun, NineStar, getDayYi/Ji, getDayJiShen/XiongSha, getZhiXing, getXiu/XiuLuck, getDayChongDesc, getDayPositionXiDesc/CaiDesc, JieQi).

engine-bazi:
1. `computeBazi(input: BirthInput): BaziChart` → 4 trụ (can, chi, tàng can, nạp âm, thập thần theo nhật chủ), ngũ hành thống kê (đếm + trọng số theo tháng lệnh), cường/nhược nhật chủ (rule đơn giản, ghi rõ phương pháp), dụng thần/hỷ thần gợi ý, thai nguyên, mệnh cung, đại vận (10 kỳ: start age, can chi, năm bắt đầu), lưu niên cho năm hiện tại ±5, warnings (không rõ giờ → trụ giờ null + confidence 'medium').
   - Lấy can chi từ engine-calendar với `ganzhiBySolarTerms` và `std` của user; KHÔNG để lunar-typescript tự tính từ dương lịch khi std='vn'. Nếu lunar-typescript cần Lunar object, dựng từ can chi đã quy đổi (dùng Lunar.fromYmd theo ngày TQ tương ứng rồi override) — viết hàm adapter rõ ràng và test.
2. `atomKeysForBazi(chart)` → danh sách key content atoms (ví dụ `bazi.daymaster.geng.strong`, `bazi.shishen.zhengguan.month`, `bazi.dayun.<ganzhi>`).
3. Thuật ngữ: bảng map Hán → vi/en/ja/ko/zh-TW cho 10 can, 12 chi, 10 thập thần, 60 nạp âm, ngũ hành (packages/engine-bazi/src/terms.ts) — engine trả cả mã Hán lẫn `labels[locale]`.

engine-almanac:
1. `getDayAlmanac(date, std, locale)` → ngày âm (theo std), can chi ngày, hoàng đạo/hắc đạo (từ getDayTianShenLuck), trực (ZhiXing), nhị thập bát tú + cát/hung, 宜/忌 (mã + label), cát thần/hung sát, xung (con giáp, can chi), Bành Tổ, hướng hỷ thần/tài thần, giờ hoàng đạo (12 giờ với cát/hung), Cửu Tinh ngày, tiết khí.
2. `personalizeAlmanac(almanac, profileCore)` → cờ `clashesWithUser`, `favorableForUser` (ngũ hành ngày vs dụng thần), lucky number/color đơn giản có giải thích.
3. `pickDates({task, from, to, profiles[]})` → xếp hạng ngày: điểm = 宜 khớp task + hoàng đạo + trực tốt + tú tốt − xung tuổi từng profile − hung sát; trả top N kèm lý do có cấu trúc (để LLM/FE hiển thị). Danh mục task: wedding, opening, moving, contract, travel, groundbreaking, haircut, surgery(không gợi ý y tế, chỉ 宜/忌 truyền thống), pray.
4. Tests: so sánh 10 ngày với output lunar-typescript gốc (std='cn'); kiểm tra std='vn' dùng can chi VN; pickDates loại đúng ngày xung tuổi.

NGHIỆM THU: tests pass; ví dụ sinh 1997-12-24 12:00 Hà Nội (std vn, nữ) trả 4 trụ 丁丑 壬子 庚子 壬午, đại vận bắt đầu ~4 tuổi, chuỗi 癸丑 2002, 甲寅 2012 (như docs/03 mục 6.2); `getDayAlmanac('2026-10-10','cn','vi')` có 宜 gồm 嫁娶 và trực 危.
```

## P3 — engine-ziwei (iztro wrapper)

```text
Bạn là engineer am hiểu Tử Vi Đẩu Số. Implement packages/engine-ziwei bọc iztro@2.6.1 (MIT; locale có sẵn en-US, ja-JP, ko-KR, vi-VN, zh-CN, zh-TW; config: mutagens, brightness, yearDivide, horoscopeDivide, ageDivide, dayDivide, algorithm 'default'|'zhongzhou').

YÊU CẦU:
1. `computeZiwei(input: BirthInput, opts: {school: 'default'|'zhongzhou'|'khamThienTuHoa', locale}): ZiweiChart`:
   - Ngày âm & giờ lấy từ engine-calendar theo `std` của user (quan trọng cho VN) → gọi `astro.byLunar(...)` của iztro với lunar date đã quy đổi (không dùng bySolar cho std='vn'); giờ sinh → chỉ số giờ 0-12 (xử lý early/late Tý theo option); không rõ giờ → mặc định giờ Ngọ + confidence 'low' + warning.
   - Trường phái: 'khamThienTuHoa' = cấu hình `mutagens` theo bảng tứ hoá Khâm Thiên (đưa bảng vào src/schools/khamThien.ts, ghi nguồn tham khảo tinhmenhdo.com/kham-thien-tu-hoa và tài liệu công khai; đánh dấu cần chuyên gia xác nhận).
   - Output JSON chuẩn hoá để render: 12 palaces (index, name đa ngôn ngữ, heavenlyStem/earthlyBranch, majorStars[{key, name, brightness, mutagen}], minorStars, adjectiveStars, changsheng12, boshi12, jiangqian12, suiqian12, isBodyPalace, decadal {range, stem, branch}), center (soul, body, fiveElementsClass, lunar date, solar date, gender, zodiac, sign), warnings.
   - `horoscope(chart, dateISO)` → decadal/yearly/monthly/daily/hourly: cung trọng tâm, sao lưu, tứ hoá lưu.
   - `atomKeysForZiwei(chart)` → key theo chính tinh × cung Mệnh/Thân/Phu Thê/Tài/Quan + tứ hoá + cách cục cơ bản (phát hiện ≥10 cách cục phổ biến: Tử Phủ đồng cung, Sát Phá Tham, Cơ Nguyệt Đồng Lương, Nhật Nguyệt…; mỗi rule có test).
2. Map locale app → iztro language (pt-BR/es/hi/th/id/fr/de → en-US).
3. Tests: snapshot lá số 1997-12-24 giờ Ngọ nữ (vi-VN) khớp docs/03 mục 6.1 (Mệnh Phá Quân, Thân Thiên Tướng, Thủy Nhị Cục); test std='vn' vs 'cn' cho ngày sinh 1985-01-21 cho ra lá số khác nhau (năm Sửu vs Tý) và có warning giải thích.

NGHIỆM THU: tests pass; output không chứa object iztro thô (serializable JSON); thời gian tính <50ms.
```

## P4 — engine-numerology + engine-astro (cơ bản)

```text
Implement packages/engine-numerology và packages/engine-astro (thuần TS, chạy trên RN).

engine-numerology:
1. Hệ Pythagorean (mặc định) + Chaldean (option). Chỉ số: lifePath (giảm theo tháng/ngày/năm riêng, giữ master 11/22/33), birthday, expression/destiny, soulUrge (nguyên âm; Y xử lý theo quy tắc ghi rõ), personality (phụ âm), maturity, personalYear/Month/Day (theo ngày tham chiếu), karmicDebt (13/14/16/19), challenge & pinnacle numbers, hiddenPassion, cornerstone/capstone.
2. Tên: chuẩn hoá Unicode NFD, bỏ dấu (vi: đ→d, Đ→D; pt/es: ç→c, ñ→n…), hỗ trợ nhập "tên khai sinh" và "tên thường dùng"; input tên CJK → bỏ qua chỉ số theo tên và trả warning (tên Hán cần phương pháp khác – TODO wave 2).
3. `atomKeysForNumerology(result)`; `compatibility(a, b)` → điểm + lý do theo cặp lifePath/expression.
4. Tests từ ví dụ đã tính tay (ghi trong test): ví dụ 1997-12-24 → lifePath 8 (1+9+9+7=26→8; 12→3; 24→6; 8+3+6=17→8).

engine-astro (wave 1 chỉ cần cho Daily Oracle & onboarding):
1. Dùng astronomy-engine@2.1.19: `sunSign(dateUTC)`, `moonSign(dateUTC)`, `risingSign(dateUTC, lat, lng)` (tính ASC từ LST + obliquity; công thức chuẩn), `planetPositions(dateUTC)` (Sun→Pluto, ecliptic lon/lat, retrograde flag), `moonPhase(date)`.
2. Nhà Whole Sign + Placidus (có test với 2 lá số mẫu từ nguồn công khai, sai số ≤0,5°).
3. `dailySky(date, tz)` → Mặt Trăng ở cung nào, pha, void-of-course đơn giản (optional), hành tinh nghịch hành.

NGHIỆM THU: tests pass; 1997-12-24T05:00Z → Sun Capricorn (~272.4°), Moon Libra (~207.4°) như docs/03 mục 6.4.
```

## P5 — engine-tarot + engine-iching + dataset

```text
Implement packages/engine-tarot và packages/engine-iching kèm dataset trong packages/content.

engine-tarot:
1. Dataset `content/tarot/deck-classic-1909.json`: 78 lá {id, arcana, suit, number, name_en, keywords_upright[], keywords_reversed[], image: 'classic-1909/<id>.webp', waite_pd_excerpt (trích ngắn từ The Pictorial Key to the Tarot 1911, public domain)}; script `scripts/fetch-tarot-images.ts` tải scan 1909 từ Wikimedia Commons (ghi URL nguồn + license vào SOURCES.md; KHÔNG dùng bản tô màu 1971; không dùng tên "Rider-Waite" trong UI, dùng "Classic 1909 deck").
2. `drawCards({spread, seed, allowReversed})` với RNG có seed (xorshift/mulberry32) để Daily Oracle tái lập được theo (date, segment); spreads: one, three (past/present/future), five (situation/challenge/advice/outcome/hidden), celticCross (10).
3. `atomKeysForTarot(draw)` → `tarot.<id>.<upright|reversed>` + `tarot.position.<spread>.<pos>`.
4. Tests: 78 lá duy nhất, seed tái lập, phân bố reversed ~50%.

engine-iching:
1. Dataset `content/iching/hexagrams.json`: 64 quẻ {number, name_zh, name_pinyin, name_en (Legge), trigrams, judgment_legge, image_legge, lines[6]{text_legge}} — nguồn James Legge 1882/1899 (public domain); script tạo dataset từ text thuần (đặt nguồn trong SOURCES.md). Để trống field `name_vi`, `text_vi` cho pipeline nội dung (P7/P13).
2. `castHexagram({method: 'coins'|'yarrow', seed})` → 6 hào (6/7/8/9), quẻ chính, hào động, quẻ biến; `lookup(lines)`; `atomKeysForIching(cast)`.
3. Tests: 64 quẻ map đúng từ 6 hào; xác suất coins (1/8,3/8,3/8,1/8) với 100k mẫu ±1%.

NGHIỆM THU: tests pass; `pnpm --filter content validate` kiểm tra JSON schema (zod) cho 2 dataset.
```

## P6 — API + DB + Auth + OpenAPI client

```text
Implement apps/api theo docs/04-backend-design.md (mục 5, 6, 7).

YÊU CẦU:
1. Drizzle schema + migrations cho: users, profiles (birth_enc AES-256-GCM với khoá từ env BIRTH_ENC_KEY, birth_hash sha256), readings, ai_messages, content_atoms, glossary, daily_content, entitlements, credits_ledger, streaks, push_tokens, experiments. RLS policies (Supabase) cho bảng user-owned.
2. Auth: POST /v1/auth/guest (tạo users + JWT ký bằng JWT_SECRET, 180 ngày), POST /v1/auth/link (xác minh Supabase access token, gắn auth_uid, merge dữ liệu guest), middleware `auth` chấp nhận cả 2 loại token.
3. Routes (zod schema + OpenAPI tags): /me, /profiles (POST tính core_json bằng engine-ziwei/bazi/numerology/astro theo tradition_pack), /profiles/:id/ziwei, /profiles/:id/bazi, /almanac, /almanac/pick, /readings (POST tạo reading: chạy engine sync, lưu engine_json, trả 202 + id; GET), /readings/:id/stream (SSE, tạm trả engine summary; AI gắn ở P8), /content/atoms, /entitlements, /healthz, /metrics (prom-client).
4. Middleware `requireEntitlement(feature)` đọc entitlements + credits + quota (Redis) theo bảng quota ở docs/04 mục 6; trả 402 với body {reason, paywall: true}.
5. Locale: đọc X-Locale/Accept-Language → `req.locale`; chuẩn lịch mặc định từ country (packages/i18n).
6. Tests: vitest + supertest với Postgres test container (hoặc pglite) cho luồng guest → profile → ziwei/bazi/numerology; test mã hoá (DB không chứa ngày sinh plain).
7. Sinh packages/api-client từ OpenAPI (openapi-typescript + openapi-fetch) trong `pnpm gen:client`.
8. Logging pino (redact PII), Sentry, rate-limit (@fastify/rate-limit, Redis store).

NGHIỆM THU: `pnpm --filter api test` xanh; Swagger /docs đầy đủ; curl luồng guest→profile→/profiles/:id/ziwei trả lá số vi-VN cho user VN; query DB không thấy ngày sinh plaintext.
```

## P7 — Content atoms, glossary & CMS admin

```text
Xây hệ nội dung "meaning atoms" theo docs/03 mục 3.

YÊU CẦU:
1. packages/content: schema zod cho atom {id, tradition, key, locale, title, body_md, tone, source_ref, author, reviewer, status, version}; thư mục `atoms/{tradition}/{locale}.jsonl`; script `pnpm content:seed` nạp vào DB (upsert theo key+locale+version), `pnpm content:validate`.
2. Sinh bộ key đầy đủ bằng script từ engine (`atomKeysFor*` với toàn bộ tổ hợp): ziwei (~300), bazi (~150), almanac (~130), tarot (156 + vị trí), iching (448), numerology (~75). Xuất `content/keys-manifest.json` + báo cáo coverage theo locale.
3. Tone guide + glossary: `content/tone/{vi,en}.md` (giọng văn: ấm, cụ thể, không phán tuyệt đối, có hành động; en: tránh "fortune"/"guarantee"; vi: xưng "bạn"), `content/glossary.csv` (term_key, vi, en, zh-TW, ja, ko) tối thiểu 150 thuật ngữ (danh sách mẫu ở docs/03 mục 3.3).
4. Script `pnpm content:draft --tradition tarot --locale en`: gọi Claude (model sonnet) với system = tone guide + glossary + nguồn PD (Waite/Legge excerpt từ dataset), sinh atom status 'draft', batch 20 key/lần, lưu JSONL, idempotent (bỏ qua key đã có). Giới hạn chi phí qua tham số --max-usd.
5. apps/web /admin (bảo vệ bằng Supabase role 'editor'): danh sách atom lọc theo tradition/locale/status, editor markdown, diff version, nút Approve → status 'reviewed'/'published', hàng đợi review ưu tiên theo `priority` (key xuất hiện trong core_json nhiều nhất).
6. Seed thật: chạy draft cho tarot/en, numerology/en, almanac/vi, bazi/vi, ziwei/vi (giới hạn 20 USD), commit JSONL (ghi rõ status draft).

NGHIỆM THU: coverage report cho vi & en ≥ 100% key có atom (draft hoặc hơn); admin đổi status và API /content/atoms chỉ trả published.
```

## P8 — AI reading-composer (compute-then-explain)

```text
Implement module `apps/api/src/ai/reading-composer.ts` theo docs/04 mục 8.

YÊU CẦU:
1. Hàm `composeReading({kind, locale, facts, atoms, question?, profileLabels})` dùng Anthropic SDK (model map: sonnet cho reading sâu, haiku cho daily/short), prompt caching cho system; structured output theo zod schema {summary, sections[{title, body, atomRefs[]}], actions[], caveats[], disclaimer}; streaming SSE cho /readings/:id/stream (gửi section khi hoàn thành).
2. System prompt: vai trò "biên tập viên huyền học" theo locale; QUY TẮC: chỉ dùng FACTS và ATOMS; mỗi câu khẳng định phải có atomRefs; không chẩn đoán y tế/pháp lý/tài chính cụ thể; không dự báo tuyệt đối; nếu confidence 'low' (không rõ giờ) phải nói rõ; ngôn ngữ = locale; dùng glossary; độ dài theo kind.
3. Validator sau sinh: kiểm tra mọi atomRefs tồn tại; phát hiện tên sao/quẻ không có trong facts (regex theo glossary) → regenerate 1 lần → fallback template (ghép atoms thuần).
4. Cost guard: ghi tokens/cost vào readings; ngân sách/user/ngày (Redis) và kill-switch flag `ai_enabled` (PostHog/ENV).
5. Ask AI: POST /v1/ai/ask với context = core_json + reading gần nhất + 10 message gần nhất; quota free 3/ngày; từ chối lịch sự chủ đề ngoài phạm vi; trả gợi ý 3 câu tiếp theo.
6. Eval: `apps/api/eval/reading-eval.ts` chạy 20 case/locale (vi, en) qua LLM-as-judge với rubric (facts đúng, không bịa, giọng văn, có hành động, disclaimer) → báo cáo điểm; CI job thủ công.

NGHIỆM THU: tạo reading ziwei_full cho profile mẫu (vi) stream xong <15s, first token <3s; validator chặn atomRefs sai (test giả lập); eval ≥4/5 trung bình.
```

## P9 — Daily Oracle job + push + streak

```text
Implement worker `apps/api/src/jobs/daily-oracle.ts` và push theo docs/02 F2 và docs/04 mục 9.

YÊU CẦU:
1. BullMQ repeatable job mỗi giờ: xác định múi giờ vừa qua 00:05 → cho mỗi (locale, tradition_pack) có user active 30 ngày: sinh segment keys (eastAsia: ea:<ganzhiYear 60> + ea:common; western: w:lp:<1-9,11,22,33> + w:sun:<12> + w:common; both: cả hai); với mỗi segment: facts = engine-almanac (std theo locale mặc định; VN dùng vn) + engine-tarot drawCards(one, seed=date+segment) + engine-numerology personalDay + engine-astro dailySky → Haiku viết {headline ≤60 ký tự, body ≤2 câu, focus, luckyHint} → upsert daily_content. Idempotent, retry, log chi phí.
2. GET /v1/today: ghép payload theo user (segment của user + facts riêng: clashesWithUser, lucky number/color, streak), cache Redis 1h/user; nếu daily_content chưa có → tính on-demand (fallback) và ghi lại.
3. Push: job mỗi 15 phút chọn user có daily_hour trùng giờ địa phương & push bật → Expo Push (batch 100, xử lý DeviceNotRegistered); nội dung = headline; deep link findme://today. Tối đa 1 push/ngày/user; tôn trọng quiet hours.
4. Streak: cập nhật khi GET /today lần đầu trong ngày (theo tz user); API trả current/longest; event `daily_oracle_viewed`.
5. Tests: job sinh đúng số segment; /today trả đúng theo tradition_pack; push không gửi 2 lần/ngày.

NGHIỆM THU: chạy job local với 2 user (vi/eastAsia, en/western) → daily_content có ≥3 segment; /today trả payload đúng ngôn ngữ; chi phí job <5 USD/ngày với 13 locale giả lập.
```

## P10 — Mobile MVP (Expo)

```text
Implement apps/mobile theo docs/05 (mục 2, 3, 4, 5, 6).

YÊU CẦU:
1. Expo Router với cấu trúc ở docs/05 mục 3; NativeWind; theme tối/sáng; font theo locale (Inter + Noto Sans CJK tải theo locale).
2. i18n: i18next + expo-localization, messages từ packages/i18n; đổi ngôn ngữ runtime; định dạng ngày/số bằng Intl; RTL-safe styles.
3. Onboarding S0–S4: locale + tradition pack (gợi ý theo country), birth input (date/time wheel, "không rõ giờ", place autocomplete gọi /v1/places?q= – implement route này trong api dùng GeoNames cities15000 nạp vào Postgres với trigram index), S2 insights từ core_json, S3 daily hour + pre-permission push, S4 First Reading (SSE stream, render ZiweiChartSVG/BaziPillars/NumerologyGrid/TarotSpread theo pack) ; guest token tự tạo.
4. Tabs: Today (OracleCard swipe pages, streak, share qua react-native-view-shot, nút Ask), Explore (grid module theo pack, badge Free/Plus), Ask (chat SSE, quota hiển thị), You (hồ sơ, thêm người thân, gói), More (Almanac & Date Picker, settings, privacy/xoá dữ liệu, about ghi công GeoNames & Classic 1909 deck).
5. Màn module: Ziwei (SVG 12 cung + bottom sheet sao + toggle đại hạn/lưu niên), Bazi (4 trụ + radar + LuckTimeline), Tarot (chọn spread, câu hỏi, animation lật Reanimated, kết quả), Numerology, I Ching (gieo 6 lần, haptics), Compatibility (chọn hồ sơ 2 / mời link), Reading detail.
6. Paywall modal placeholder (hook `useEntitlement`, 402 → mở paywall) — tích hợp mua ở P12.
7. Offline: engine-calendar + engine-almanac + engine-numerology + engine-tarot chạy local cho Today khi mất mạng (cache 24h bằng MMKV).
8. Analytics PostHog: events onboarding_step, profile_created, first_reading_done, daily_oracle_viewed, reading_started/finished, paywall_shown/cta, share_clicked.
9. Tests: RNTL cho OracleCard/ZiweiChartSVG; Maestro flows `onboarding-vi.yaml`, `onboarding-en.yaml` (install → first reading → today).

NGHIỆM THU: chạy trên iOS simulator + Android emulator; Maestro 2 flow pass; TTI Today <1,5s trên máy tầm trung; không chuỗi hard-code (pnpm i18n:lint xanh); screenshot 6 màn chính đính kèm PR.
```

## P11 — Web (Next.js) + SEO hub + PWA

```text
Implement apps/web theo docs/05 mục 3 (web mirror) và mục 8.

YÊU CẦU:
1. next-intl routing /[locale] (vi, en; sẵn sàng thêm locale), messages dùng chung packages/i18n; hreflang; sitemap theo locale.
2. Marketing + SEO pages (ISR 1h, không LLM lúc request): /vi/lich-am-hom-nay, /vi/lich-am/[yyyy-mm], /vi/xem-ngay-tot/[task], /vi/tu-vi-12-con-giap/[chi], /en/tarot-card-of-the-day, /en/tarot/[card-slug], /en/life-path-number/[n], /en/moon-today; nội dung từ engine + atoms published; JSON-LD; smart app banner + deep link.
3. App PWA tại /[locale]/app/* dùng lại components từ packages/ui (react-native-web) cho Today, Ziwei, Bazi, Tarot, Numerology, I Ching, Almanac, Compatibility, Ask; auth Supabase + guest.
4. /admin: CMS atoms (P7), bảng daily_content preview, dashboard cost AI (đọc readings.cost_usd).
5. Stripe Checkout + Customer Portal cho Plus & credit (web) — webhook ở P12.
6. Lighthouse ≥90 (perf/SEO/a11y) cho trang SEO; Playwright test 3 trang.

NGHIỆM THU: `pnpm --filter web build` xanh; /vi/lich-am-hom-nay hiển thị đúng ngày âm chuẩn VN (so với engine-calendar std vn); /en/tarot-card-of-the-day trùng lá của Daily Oracle segment w:common cùng ngày.
```

## P12 — Monetization: RevenueCat + Stripe + paywall + experiments

```text
Implement thanh toán và paywall theo docs/01 mục S (bảng giá) và docs/02 F4.

YÊU CẦU:
1. Cấu hình RevenueCat: products plus_weekly (trial 7 ngày), plus_monthly, plus_yearly, credits_1/5/15; offerings theo country (PPP) — tạo file `apps/mobile/config/offerings.md` liệt kê product id & giá theo bảng docs/01; mobile dùng react-native-purchases, màn Paywall (S15) hiển thị 3 gói + credit + điều khoản gia hạn + Restore; biến thể A/B qua PostHog flag `paywall_variant` (soft vs hard sau first reading).
2. API: webhooks /v1/webhooks/revenuecat (xác thực secret) và /v1/webhooks/stripe (chữ ký) → upsert entitlements, credits_ledger; idempotent theo event id; GET /v1/entitlements.
3. Quota & gating: requireEntitlement cho readings (lần 2+), ai/ask (>3/ngày), almanac/pick nâng cao, compatibility chi tiết, lịch sử >7 ngày; hỗ trợ "dùng 1 credit" thay subscription (POST /readings {payWith:'credit'}).
4. Trial reminder: job gửi push + email (Resend) 24h trước khi hết trial; màn quản lý gói + link huỷ (App Store/Play/Stripe portal).
5. Events: paywall_shown (variant, trigger), trial_started, purchase, cancel, refund; dashboard PostHog: funnel first_reading → paywall → trial → paid; RPI 60 ngày.
6. Tests: webhook sandbox payloads (RevenueCat TEST, Stripe CLI) → entitlements đúng; gating 402 → paywall; credit trừ đúng và không âm (transaction).

NGHIỆM THU: sandbox mua/huỷ/restore trên iOS & Android OK; web mua Plus qua Stripe → app thấy Plus (cùng user); không có dark pattern: giá đầy đủ, ngày gia hạn, huỷ 1 chạm (checklist trong PR).
```

## P13 — Pipeline i18n (UI + nội dung) & QA đa ngôn ngữ

```text
Hoàn thiện pipeline đa ngôn ngữ theo docs/04 mục 10 và docs/05 mục 6, chuẩn bị wave 2 (es, pt-BR, ja, ko, zh-TW).

YÊU CẦU:
1. UI: script `pnpm i18n:draft --locale ja` gọi Claude dịch messages từ en (ngữ cảnh: key, mô tả, giới hạn ký tự, glossary) → file ja.json với `"_meta": {"draft": true}`; CI chặn build production nếu locale enabled còn draft key; pseudo-locale `en-XA` (kéo dài 35%, dấu) để test tràn chữ; snapshot screenshot Maestro/Playwright cho từng locale.
2. Content: `pnpm content:translate --from vi --to zh-TW --tradition ziwei` và `--from en --to es --tradition tarot`: dịch atoms published với glossary + tone guide locale đích → status draft → review trong /admin; fallback runtime locale→en đã có.
3. Glossary mở rộng ≥300 thuật ngữ cho 7 locale (vi, en, zh-TW, ja, ko, es, pt-BR); lint: body_md atom không được chứa thuật ngữ ngoài glossary ở locale đích (cảnh báo).
4. Calendar/culture config cho wave 2: kr (Saju -30 phút, std kr), jp (std jp, Kyūsei Kigaku từ NineStar), zh-TW (std cn, phồn thể, iztro zh-TW), es/pt-BR (western, weekly pricing), định dạng ngày & tiền.
5. Báo cáo coverage i18n (UI key %, atoms %, glossary %) trong README docs/i18n-status.md tự sinh.

NGHIỆM THU: bật `ja` ở staging: app chạy hoàn toàn bằng tiếng Nhật với 0 key thiếu (fallback en được phép cho atoms draft, UI thì không); pseudo-locale không vỡ layout ở 6 màn chính.
```

## P14 — Hardening, analytics, release checklist, soft launch

```text
Chuẩn bị soft launch VN + EN.

YÊU CẦU:
1. Golden test suite tổng: `tooling/golden/` gồm 50 hồ sơ sinh (đa quốc gia, DST, tháng nhuận, không rõ giờ) → snapshot output ziwei/bazi/numerology/astro; CI fail nếu thay đổi không được duyệt (cập nhật snapshot có review).
2. Bảo mật: audit deps (pnpm audit), kiểm tra PII trong logs, rotate khoá, RLS test, rate limit test, OWASP headers (web), App Transport Security; privacy policy & terms theo locale (template, ghi rõ dữ liệu ngày sinh, xoá, không bán dữ liệu); màn "Xoá dữ liệu" hoạt động end-to-end.
3. Observability: Sentry release tags, OpenTelemetry traces cho /today, /readings; dashboard SLO (p95), alert chi phí AI/ngày > ngưỡng.
4. Analytics: tài liệu `docs/analytics-events.md` (tên event, props, màn), kiểm tra bằng PostHog live; dashboard: North Star (Daily Oracle đọc/tuần), D1/D7/D30, funnel paywall, RPI, cost/DAU.
5. Store: listing vi/en (title/subtitle/keywords/screenshots đúng chức năng, không hứa hẹn tuyệt đối, disclaimer trung thực), age rating, review notes nêu "unique experience" (engine chuẩn lịch quốc gia + compute-then-explain) để qua Apple 4.3; Play Data safety form.
6. Soft launch plan: VN + 1 nước EN (CA hoặc AU) 2 tuần, 100 USD/ngày UA, mục tiêu kiểm định D1 ≥40%, D7 ≥20%, trial start ≥5%, trial→paid ≥25%, refund <2%; quyết định go/no-go wave 2 theo bảng docs/01 mục S.
7. Runbook: incident, rollback EAS Update, khoá AI, hoàn tiền.

NGHIỆM THU: checklist release 100% trong `docs/release-checklist.md`; build TestFlight + Play Internal; crash-free ≥99,5% sau 3 ngày dogfood; dashboard hiện đủ chỉ số.
```

---

## Phụ lục A — Prompt "nhiệm vụ nghiên cứu bổ sung" (chạy khi cần số liệu cấp 1)

```text
Bạn là research analyst. Với thị trường {country}, thu thập và trích nguồn cấp 1 cho: (1) quy mô thị trường dịch vụ bói toán/chiêm tinh online, (2) top 5 app theo doanh thu & MAU (Sensor Tower/data.ai/Appfigures nếu có), (3) mô hình giá của 3 app đầu (subscription/credit/per-minute/ads), (4) quy định pháp lý về nội dung tâm linh & thanh toán, (5) môn phổ biến nhất và thuật ngữ bản địa. Xuất bảng + độ tin cậy A/B/C + link. Bổ sung vào docs/01-market-research.md mục 1.2.
```

## Phụ lục B — Checklist "trước khi code" (đã rà soát ngày 2026-10-10)

- [x] Thị trường wave 1/2/3 chọn theo dữ liệu (docs/01 C2)
- [x] Mô hình thu phí chốt + bảng giá giả thuyết + KPI go/no-go (docs/01 S)
- [x] Tính năng free hằng ngày định nghĩa + chi phí vận hành (docs/02 F2, docs/04 mục 9)
- [x] Nguồn dữ liệu: engine MIT/ISC chạy thử OK; nội dung PD xác định; rủi ro bản quyền có phương án (docs/03)
- [x] Khác biệt lịch VN/TQ xử lý ở kiến trúc (CalendarProvider)
- [x] Kiến trúc BE/FE một ngôn ngữ, i18n từ ngày 1 (docs/04, 05)
- [ ] Việc cần người thật: ký reviewer nội dung (1 thầy Tử Vi/Bát Tự VN, 1 tarot reader EN), xác nhận pháp lý bản dịch Kinh Dịch tiếng Việt, tạo tài khoản Apple/Google/RevenueCat/Stripe/Supabase/PostHog.
