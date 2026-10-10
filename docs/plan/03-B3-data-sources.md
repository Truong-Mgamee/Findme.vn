# B3a – Nguồn dữ liệu & license (QUAN TRỌNG NHẤT)

> Nguyên tắc: chỉ dùng nguồn **MIT / BSD / Public Domain / CC0 / CC-BY** hoặc **tự biên soạn**. Không dùng AGPL (Swiss Ephemeris) để tránh phải mở source toàn bộ app. Mọi license dưới đây đã được kiểm tra trực tiếp trên repo/nguồn ngày 2026-10-10, trừ dòng đánh dấu ⚠️.

## 1. Bảng nguồn theo engine

### 1.1 Tính toán thiên văn (nền cho Chiêm tinh Tây phương + lịch âm độ chính xác cao)

| Nguồn | Dùng để | License | Đã verify | Ghi chú |
|---|---|---|---|---|
| **astronomy-engine** (cosinekitty) – JS/TS, Python, C, C#, Kotlin | Vị trí Mặt trời, Mặt trăng, 8 hành tinh; mọc/lặn; pha trăng; ascendant qua sidereal time | **MIT** | ✅ npm + GitHub | Sai số ≤ 1 arcminute so với NOVAS; bundle JS 116 KB; chạy **on-device** → không cần server cho natal chart. [GitHub](https://github.com/cosinekitty/astronomy) |
| Swiss Ephemeris | (không dùng) | AGPL hoặc mua license thương mại từ Astrodienst | ✅ astro.com | Chỉ cân nhắc khi cần tiểu hành tinh/Chiron/độ chính xác giây. [astro.com](https://www.astro.com/swisseph/swephprg.htm) |
| Tự viết: house systems (Placidus, Whole Sign, Equal), aspects, transits | Natal wheel, synastry, transit hằng ngày | Tự code (công thức Meeus, public) | – | Thuật toán Placidus là công thức toán công khai; test bằng so với astro.com free chart 20 case |

### 1.2 Lịch âm, Can Chi, Bát tự, ngày tốt, Tử vi

| Nguồn | Dùng để | License | Đã verify | Ghi chú |
|---|---|---|---|---|
| **lunar-javascript** (6tail) – có bản Python/Java/Go/C# | Lịch âm–dương, can chi năm/tháng/ngày/giờ, **Bát tự + ngũ hành + thập thần**, 24 tiết khí, hoàng đạo/hắc đạo, 12 trực, 28 sao, nạp âm, cát thần/hung sát, hướng tài thần/hỷ thần, ngày xung tuổi | **MIT** (đọc file LICENSE: "MIT License, Copyright (c) 2018 6tail") | ✅ raw LICENSE | 0 dependency. Lịch âm là **lịch Trung Quốc (UTC+8)**; VN dùng UTC+7 → lệch ngày ở 1 số năm (vd Tết 1985) → cần **patch múi giờ** (xem §3.1). [GitHub](https://github.com/6tail/lunar-javascript) |
| **lasotuvi** (doanguyen) – Python | An sao Tử vi đẩu số phái VN: 14 chính tinh, phụ tinh, đại hạn, tiểu hạn, lưu niên | **MIT** (README + setup.py) | ✅ GitHub | 49★, 51 commit, ít bảo trì → **port sang TypeScript** (thuật toán an sao là bảng tra cố định, ~800 dòng). Dùng làm test oracle. [GitHub](https://github.com/doanguyen/lasotuvi) |
| Bảng an sao Tử vi (tri thức công cộng) | Đối chiếu port | Public domain (tri thức cổ) | – | Các bảng Tử Vi tinh hệ, Thiên Phủ tinh hệ, vòng Thái Tuế/Lộc Tồn/Trường Sinh là tri thức truyền thống, không bản quyền |
| Lịch âm VN chuẩn (Hồ Ngọc Đức – thuật toán công bố) | Kiểm chứng lịch âm VN UTC+7 | Thuật toán công khai | ⚠️ chưa fetch được trong session | Dùng để viết test so sánh với lunar-javascript sau patch múi giờ |

### 1.3 Thần số học (Pythagorean)

| Nguồn | Dùng để | License | Ghi chú |
|---|---|---|---|
| Thuật toán | Life Path, Expression/Destiny, Soul Urge, Personality, Birthday, Maturity, Personal Year/Month/Day, Challenge, Pinnacle, master numbers 11/22/33, Karmic debt | Công thức công cộng (bảng chữ→số 1–9) | Tự code ~300 dòng; không cần thư viện |
| Bảng chữ cái đa ngôn ngữ | Tên có dấu (VN), kana (JA), hangul (KO) | Tự biên soạn | Quy ước: VN bỏ dấu + chuyển "Đ→D"; JA/KO dùng romaji/romanization (Hepburn / Revised Romanization) – ghi rõ trong UI |
| Nội dung luận giải | Ý nghĩa số 1–9, 11, 22, 33 cho từng loại số | **Tự biên soạn** bằng LLM + biên tập viên, lưu `content-pack` | Chi phí thấp nhất: ~12 số × 8 loại × 3 lớp ≈ 300 đoạn/ngôn ngữ |

### 1.4 Tarot

| Nguồn | Dùng để | License | Đã verify | Ghi chú |
|---|---|---|---|---|
| **mixvlad/TarotCards** – ảnh Rider-Waite-Smith 1909 (bản scan Steve-P.org), 78 lá, JPG full + PNG 720px | Ảnh lá bài mặc định | **Public Domain** (RWS 1909, Pamela Colman Smith mất 1951 → PD ở Mỹ từ 1966 do xuất bản trước 1930; EU PD từ 2022) | ✅ GitHub | Repo còn Marseille, Sola Busca, Visconti-Sforza (PD) → deck thứ 2 cho Plus. **Tránh** scan của U.S. Games (có © ở góc). [GitHub](https://github.com/mixvlad/TarotCards) |
| **deckaura/tarot-card-meanings** (JSR + Hugging Face) | Ý nghĩa upright/reversed 78 lá, keyword | **MIT** | ⚠️ theo listing JSR/HF, chưa mở được HF trong session | Dùng làm **seed EN**, biên tập lại rồi dịch. [JSR](https://jsr.io/@deckaura/tarot-card-meanings) |
| tarotoo-tarot dataset | Backup seed | CC BY 4.0 / MIT (listing mâu thuẫn) | ⚠️ | Chỉ dùng nếu deckaura thiếu |
| Spread definitions (3 lá, Celtic Cross, quan hệ) | Vị trí & câu hỏi | Tri thức công cộng | – | Tự định nghĩa JSON |

### 1.5 Nội dung luận giải (content pack) – phần tốn công nhất

| Loại nội dung | Số lượng ước tính / ngôn ngữ | Cách tạo | Nguồn tham chiếu |
|---|---|---|---|
| Tử vi: 14 chính tinh × 12 cung × (miếu/vượng/đắc/hãm) + ~40 phụ tinh + cách cục | ~1 200 đoạn | LLM draft từ sách công cộng (Tử Vi Đẩu Số Toàn Thư – cổ thư, PD) → biên tập viên VN duyệt | Cổ thư PD; **không** copy từ web VN hiện đại (bản quyền) |
| Bát tự: 10 thiên can × 12 địa chi, thập thần, dụng thần, ngũ hành vượng suy | ~400 đoạn | như trên | Tam Mệnh Thông Hội (cổ thư) |
| Chiêm tinh: 10 hành tinh × 12 cung × 12 nhà + aspects + transit | ~1 500 đoạn | LLM draft → astrologer duyệt | Tri thức chung |
| Thần số: 12 số × 8 loại | ~300 đoạn | LLM draft → duyệt | Tri thức chung |
| Tarot: 78 × 2 chiều × 3 ngữ cảnh (tình/việc/tiền) | ~470 đoạn | seed MIT + LLM mở rộng | deckaura |
| Daily templates: câu ghép theo điểm/yếu tố | ~500 template có biến | Copywriter | – |
| **Tổng** | **~4 400 đoạn/ngôn ngữ** | | |

**Pipeline tạo content (prompt ở `docs/prompts/P3a-data-pipeline.md`):**
1. Schema JSON cố định cho từng loại (`packages/content/schema/*.json`).
2. Generate EN + VI trước bằng LLM theo batch, có `source_note` cho mỗi đoạn.
3. Reviewer (1 người/ngôn ngữ) duyệt trong sheet, đánh dấu `approved`.
4. Dịch sang ngôn ngữ Wave 2 từ EN **có glossary thuật ngữ** (vd "Tử Vi" giữ nguyên + chú thích; "Life Path" → "Số chủ đạo"), dịch máy + duyệt bản địa.
5. Build → `content-pack.<locale>.json` versioned, tải về app theo locale (lazy, cache).

### 1.6 Dữ liệu địa lý & múi giờ

| Nguồn | Dùng để | License |
|---|---|---|
| **GeoNames cities15000** | Autocomplete nơi sinh (≈ 30 000 thành phố, có lat/long/timezone) | CC BY 4.0 |
| **IANA tzdata** (qua `@date-fns/tz` hoặc Intl API) | Múi giờ lịch sử theo nơi sinh (VN đổi múi giờ 1975, v.v.) | Public domain |
| **@vvo/tzdb** | Map thành phố → IANA zone | MIT |

### 1.7 Dữ liệu KHÔNG dùng và lý do

| Nguồn | Lý do bỏ |
|---|---|
| Swiss Ephemeris | AGPL; wrap microservice vẫn rủi ro pháp lý ([roxyapi phân tích](https://roxyapi.com/blogs/swiss-ephemeris-agpl-licensing-saas)) |
| Aztro / các horoscope API free | Đã ngừng hoặc text tĩnh 12 cung, không cá nhân hoá, không kiểm soát bản quyền |
| Astrology API thương mại (astrologyapi.com, prokerala, roxyapi) | Phí theo call, lock-in; chỉ dùng khi cần Vedic (Wave 3) |
| VedAstro | Tính qua cloud engine, license chưa rõ → chỉ cân nhắc Wave 3 |
| Scan Tarot U.S. Games | Có watermark ©, không PD |

## 2. Dữ liệu ngôn ngữ (i18n)

| Hạng mục | Quyết định |
|---|---|
| Locale Wave 1 | `vi`, `en` |
| Locale Wave 2 | `ja`, `ko`, `pt-BR`, `es` |
| Locale Wave 3 | `zh-Hant`, `th`, `id`, `hi` |
| Chuỗi UI | ICU MessageFormat (plural/gender/select), file `locales/<locale>/ui.json`, quản lý bằng **Lingui** hoặc i18next + `intl-messageformat` |
| Content pack | JSON riêng theo locale, versioned, lazy load |
| Lịch/ngày/số | `Intl.DateTimeFormat`, `Intl.NumberFormat`, hiển thị song song lịch âm ở locale Á |
| RTL | Chưa (không có locale RTL trong 3 wave) |
| Font | Noto Sans (CJK + Vietnamese) – OFL |

## 3. Việc kỹ thuật phải làm với dữ liệu (ticket B4 T-DATA-*)

### 3.1 Patch lịch âm VN cho lunar-javascript
lunar-javascript tính sóc/tiết khí theo UTC+8. VN dùng UTC+7 → một số tháng âm lệch (ví dụ Tết Ất Sửu 1985: VN 21/1, TQ 20/2). Cách làm: fork hàm tính sóc, nhận tham số `tzOffsetHours`, mặc định 8, VN truyền 7. Viết test với 30 năm Tết VN đã biết (nguồn: bảng Tết Nguyên Đán VN trên lịch nhà nước).

### 3.2 Port lasotuvi sang TypeScript
Input: `{ year, month, day, hour(0–23) | canhGio(0–11), gender, isLunar, tz }` → Output JSON: 12 cung với sao + trạng thái (miếu/vượng/đắc/hãm), tuần/triệt, đại hạn, cục, mệnh chủ/thân chủ. Test: 50 lá số chạy bằng lasotuvi Python gốc làm oracle (snapshot JSON).

### 3.3 Chiêm tinh
Dùng astronomy-engine: `GeoVector`/`Ecliptic` cho kinh độ hoàng đạo, `SiderealTime` cho ASC/MC, tự tính Placidus. Test: 20 natal chart so với astro.com (sai số ≤ 0,1°).

### 3.4 Thần số học
Pure functions, test table-driven 100 case.

### 3.5 Content pack build
Script `pnpm content:build --locale vi` → validate schema → gzip → upload Supabase Storage `content/<locale>/<version>.json`.

## 4. Checklist pháp lý trước launch

- [ ] File `THIRD_PARTY_LICENSES.md` liệt kê astronomy-engine (MIT), lunar-javascript (MIT), lasotuvi (MIT – ghi credit), RWS images (PD, ghi nguồn scan), deckaura (MIT), GeoNames (CC BY – ghi attribution trong Settings → About).
- [ ] Disclaimer "for entertainment and self-reflection" trong onboarding + store listing (yêu cầu phổ biến của Apple với app bói toán, và giảm rủi ro consumer-law ở EU/JP).
- [ ] Privacy: ngày giờ nơi sinh = dữ liệu cá nhân → GDPR/PDPA VN (Nghị định 13/2023): xoá tài khoản 1 chạm, export JSON.
