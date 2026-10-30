# B3.1 — Nguồn dữ liệu, engine & nội dung (phần quan trọng nhất)

> Nguyên tắc: **tách 3 lớp** — (1) *Engine tính toán* (thuật toán tất định, thư viện mã nguồn mở license cho phép thương mại), (2) *Dữ liệu nền* (bộ bài, quẻ, bảng sao: public domain hoặc tự biên soạn), (3) *Nội dung diễn giải* (meaning atoms + LLM + reviewer). Mỗi lớp có nguồn, license, trạng thái verify riêng.
> Tất cả thư viện dưới đây đã được **tải từ npm và chạy thử thành công** trong môi trường này ngày 2026-10-10 (log ở mục 6).

## 1. Bảng tổng hợp theo môn

| Môn | Khu vực | Engine (license, version đã verify) | Dữ liệu nền | Nội dung diễn giải | i18n sẵn có | Trạng thái |
|---|---|---|---|---|---|---|
| **Tử Vi Đẩu Số** (紫微斗數) | VI, ZH, (KO/JA phụ) | `iztro` 2.6.1 — **MIT** | Bảng an sao nằm trong lib; cấu hình `algorithm: 'default' \| 'zhongzhou'`, tuỳ biến `mutagens` (tứ hoá) → mô phỏng được Khâm Thiên Tứ Hoá/Nam Phái như tinhmenhdo | Sách cổ PD: 紫微斗數全書 (Minh), 紫微斗數捷覽; tiếng Việt tự biên soạn + LLM + reviewer | **6 locale trong lib: en-US, ja-JP, ko-KR, vi-VN, zh-CN, zh-TW** (đã kiểm tra thư mục `lib/i18n/locales`) | ✅ sẵn sàng |
| **Bát Tự / Tứ Trụ / Saju / Shichū Suimei** | VI, ZH, KO, JA | `lunar-typescript` 1.8.6 — **MIT** (bản TS của `lunar-javascript` 1.7.1, tác giả 6tail) | Can chi, nạp âm, thập thần, thai nguyên, mệnh cung, **Yun/DaYun/LiuNian/LiuYue/XiaoYun** (đại vận, lưu niên, lưu nguyệt, tiểu vận) có sẵn | Sách PD: 淵海子平, 三命通會, 滴天髓, 窮通寶鑑, 子平真詮; diễn giải tự biên soạn | Lib chỉ có `chs`, `en` → **tự làm bảng thuật ngữ** vi/ja/ko/zh-TW (≈300 từ) | ✅ sẵn sàng, cần glossary |
| **Lịch Vạn Niên / Xem ngày / Cửu Tinh** | VI, ZH, KO, JA | `lunar-typescript` (宜忌 `getDayYi/Ji`, cát thần hung sát `getDayJiShen/XiongSha`, trực `getZhiXing`, nhị thập bát tú `getXiu/XiuLuck`, xung `getDayChongDesc`, Bành Tổ, hướng hỷ/tài thần, **NineStar năm/tháng/ngày/giờ**, 24 tiết khí, Phật lịch `Foto`, Đạo lịch `Tao`) | Thuật toán theo chuẩn TQ (UTC+8) | Giải thích ngắn tự biên soạn | `chs`, `en` | ✅ nhưng **phải ghép với lịch VN** (dưới) |
| **Lịch âm Việt Nam** | VI | `lunar-date-vn` 1.0.6 — **ISC** (remake thuật toán Hồ Ngọc Đức 2004, UTC+7); dự phòng: `amlich.js` 1.0.6 MIT | — | — | — | ✅ **bắt buộc** cho VN: khác lịch TQ (xem 6.3) |
| **Kinh Dịch** (I Ching) | VI, ZH, EN, (KO/JA) | Tự viết (gieo 3 đồng xu/cỏ thi, hào động, quẻ biến ≈150 dòng TS) | 64 quẻ + 384 hào: bản dịch **James Legge 1882/1899 – public domain** (text tại sacred-texts/baharna.com); Hán văn gốc PD; tiếng Việt: tự dịch từ Legge + Hán văn (không dùng bản dịch hiện đại còn bản quyền nếu chưa xác minh) | Legge + LLM diễn giải hiện đại | — | ✅ cần làm dataset JSON |
| **Tarot** | EN, ES, PT, JA, VI, KO | Tự viết (xáo/rút/trải bài, upright/reversed ≈100 dòng) | **Ảnh Rider-Waite-Smith 1909**: PD tại Mỹ (trước 1929) và UK/EU từ 1/1/2022 (Pamela Colman Smith mất 1951 +70). Lấy scan từ Wikimedia Commons (repo `mixvlad/TarotCards` có SOURCES.md). **Tránh** bản tô màu lại 1971 của U.S. Games và tên thương hiệu "Rider-Waite" trong marketing (trademark) → gọi "Classic 1909 deck". Text: A.E. Waite, *The Pictorial Key to the Tarot* (1911) PD; dataset JSON tham khảo `Tarotoo-com/tarotoo-tarot-dataset` (kiểm tra license trước khi dùng) hoặc tự tạo từ Waite | Waite + LLM viết lại hiện đại, đa ngôn ngữ | — | ✅ |
| **Thần số học** (Pythagorean + Chaldean) | EN, ES, PT, VI | Tự viết (life path, expression, soul urge, personality, birthday, maturity, personal year/month/day, master numbers 11/22/33, karmic debt; ≈250 dòng TS) — thuật toán PD | Bảng chữ cái→số; cần bảng cho ký tự có dấu (vi, pt, es, de) chuẩn hoá NFD | Tự biên soạn + LLM; không sao chép sách hiện đại | — | ✅ |
| **Chiêm tinh phương Tây** (sun/moon/rising, transit) | EN, ES, PT (wave 2) | `astronomy-engine` 2.1.19 — **MIT**, ±1 arcmin, Sun→Pluto; **không dùng Swiss Ephemeris** (AGPL hoặc license trả phí không công bố giá) | Nhà (houses) Placidus/Whole sign tự tính (công thức PD); timezone lịch sử: `@vvo/tzdb` hoặc `geo-tz` | Tự biên soạn | — | ✅ wave 2 |
| **12 con giáp / cung hoàng đạo ngày** | Tất cả | `iztro.getZodiacBySolarDate/getSignBySolarDate` + engine lịch | — | LLM theo segment | — | ✅ |
| **Vedic (Jyotish)** | HI (wave 3) | Cần sidereal (ayanamsa Lahiri) + dasha; có thể từ astronomy-engine + tự viết; hoặc mua license Swiss Ephemeris | — | — | — | ⏳ wave 3 |

## 2. Dữ liệu địa lý & thời gian (quan trọng cho độ chính xác)

| Nhu cầu | Nguồn | License |
|---|---|---|
| Autocomplete nơi sinh (thành phố, toạ độ) | GeoNames `cities15000` | CC BY 4.0 (ghi công) |
| Múi giờ lịch sử + DST tại thời điểm sinh | IANA tzdb qua `@vvo/tzdb` / `luxon`; `geo-tz` (toạ độ→tz) | MIT / public domain |
| Giờ mặt trời thực (真太阳时) cho Bát Tự/Tử Vi | Tính từ kinh độ + equation of time (`astronomy-engine` hỗ trợ) | MIT |
| Quy ước giờ Saju Hàn (kinh tuyến 127,5°E vs giờ chuẩn 135°E → lệch 30 phút) | Rule cấu hình theo locale | tự viết |
| Chuẩn lịch âm theo quốc gia | VN: UTC+7 (Hồ Ngọc Đức); TQ/TW/HK: UTC+8 (lunar-typescript); KR: UTC+9 (KASI) — cần kiểm chứng thêm cho KR/JA | — |

## 3. Nội dung diễn giải: "meaning atoms" + pipeline LLM

### 3.1 Cấu trúc
```
content_atoms(id, tradition, key, locale, title, body_md, tone, source_ref, author, reviewer, status[draft|reviewed|published], version)
```
Ví dụ key: `ziwei.star.ziwei.palace.ming`, `bazi.shishen.zhengguan.strong`, `tarot.major.00.upright`, `iching.hex.01.line.1`, `numerology.lifepath.7`, `almanac.yi.jiaqu`.

Ước lượng khối lượng wave 1 (vi + en):
| Môn | Số atom | Nguồn gốc |
|---|---|---|
| Tử Vi | 14 chính tinh × 12 cung + 4 hoá + phụ tinh ≈ 300 | biên soạn từ sách cổ + chuyên gia |
| Bát Tự | 10 thập thần × 3 cường độ + 60 can chi ngày + nạp âm ≈ 150 | như trên |
| Lịch ngày | ≈80 mục 宜/忌 + 12 trực + 28 tú + 9 tinh ≈ 130 | như trên |
| Tarot | 78 × 2 = 156 (+ vị trí trong trải bài) | Waite 1911 (PD) viết lại |
| Kinh Dịch | 64 + 384 = 448 | Legge (PD) viết lại |
| Numerology | ≈ 9×7 chỉ số + master ≈ 75 | biên soạn |
| **Tổng** | **≈1.260 atom × 2 locale** | — |

### 3.2 Pipeline
1. **Draft:** LLM (Claude) viết atom theo template + glossary + tone guide của locale, có trích nguồn PD làm context.
2. **Review:** reviewer bản địa có chuyên môn (VN: thầy tử vi; EN: tarot reader) duyệt trong CMS (status → reviewed). Chi phí tham chiếu: dịch máy ~0,001 USD/từ, người ~0,04–0,08 USD/từ (Crowdin) → ngân sách review wave 1 ≈ 1.260 × 2 × 150 từ × 0,05 ≈ **19K USD** nếu thuê ngoài toàn bộ; giảm còn ~5K USD nếu chỉ review 30% atom "high-traffic".
3. **Runtime:** reading = engine JSON + atoms liên quan (retrieval theo key, không cần vector DB ở MVP) → LLM "biên tập" thành bài đọc mạch lạc theo locale. Atom là "source of truth", LLM không được thêm facts mới.

### 3.3 Glossary bắt buộc (ví dụ)
| vi | zh-TW | en | ja | ko |
|---|---|---|---|---|
| Tử Vi | 紫微 | Zi Wei (Emperor star) | 紫微 | 자미 |
| Cung Mệnh | 命宮 | Life Palace | 命宮 | 명궁 |
| Chính Quan | 正官 | Direct Officer | 正官 | 정관 |
| Hoàng đạo (ngày) | 黃道吉日 | Auspicious day | 吉日 | 길일 |
| Đại vận | 大運 | Decade luck cycle | 大運 | 대운 |

## 4. Rủi ro bản quyền & cách xử lý

| Rủi ro | Xử lý |
|---|---|
| Sách tử vi/bát tự tiếng Việt hiện đại (tác giả còn bảo hộ: đời + 50 năm theo Luật SHTT VN) | Không sao chép; chỉ dùng làm tài liệu đọc cho reviewer; nội dung tự viết |
| Bản dịch Kinh Dịch tiếng Việt (ví dụ Ngô Tất Tố, mất 1954) | Có thể đã PD tại VN (50 năm sau khi mất) nhưng **cần luật sư xác nhận** trước khi dùng; mặc định dịch từ Legge/Hán văn |
| Ảnh Tarot: bản 1971 recolour của U.S. Games, tên "Rider-Waite" | Chỉ dùng scan 1909 từ Wikimedia; đặt tên "Classic 1909" |
| Swiss Ephemeris | Không dùng (AGPL) |
| GeoNames | Ghi công CC BY trong màn About |
| Nội dung LLM "ảo giác" | Guardrail: facts chỉ từ JSON + atoms; disclaimer; log & chấm điểm mẫu 1% |

## 5. Danh sách gói npm (chốt cho P0)

```json
{
  "iztro": "2.6.1",
  "lunar-typescript": "1.8.6",
  "lunar-date-vn": "1.0.6",
  "astronomy-engine": "2.1.19",
  "@vvo/tzdb": "latest",
  "geo-tz": "latest",
  "luxon": "latest"
}
```

## 6. Bằng chứng chạy thử (2026-10-10, Node 20, môi trường này)

### 6.1 iztro (locale `vi-VN`, sinh 1997-12-24 giờ Ngọ, nữ)
```
IZTRO soul/body: Phá Quân Thiên Tướng | fiveElementsClass: Thủy Nhị Cục | zodiac: Trâu | sign: Cung Ma Kết
IZTRO palaces: Tài Bạch: | Tử Nữ:Thiên Phủ(Đắc) | Phu Thê:Thái Âm(Hạn)[Lộc] | Huynh Đệ:Liêm Trinh(Hạn),Tham Lang(Hạn)
IZTRO horoscope decadal: Đại Hạn MậuThân | yearly: BínhNgọ mutagen [ 'Thiên Đồng', 'Thiên Cơ', 'Văn Xương', 'Liêm Trinh' ]
```
Thư mục locale trong gói: `en-US ja-JP ko-KR vi-VN zh-CN zh-TW`. Config type: `mutagens, brightness, yearDivide('normal'|'exact'), horoscopeDivide, ageDivide('normal'|'birthday'), dayDivide('current'|'forward'), algorithm('default'|'zhongzhou')`.

### 6.2 lunar-typescript (Bát Tự + Đại Vận + lịch ngày)
```
BAZI: 丁丑 壬子 庚子 壬午 | shishen: 正官 食神 食神 | nayin: 壁上土
YUN start: 4 y 1 m | DaYun: 1997: 2002:癸丑 2012:甲寅 2022:乙卯
TODAY lunar(CN): 二〇二六年九月初一 | yi: 嫁娶,求嗣,纳采,进人口 | ji: 上梁,作灶,伐木 | zhiXing: 危 | xiu: 柳 凶 | nineStar: 四绿木天权 | chong: (辛亥)猪
EN: 2026年九月初一 Marriage,Seek heirs,Proposing
```
Class có trong gói: `DaYun EightChar Foto Fu Holiday JieQi LiuNian LiuYue Lunar LunarMonth LunarTime LunarYear NineStar ShuJiu Solar SolarSeason Tao XiaoYun Yun …`; `I18n.setLanguage('chs'|'en')`.

### 6.3 Lịch VN (lunar-date-vn, UTC+7) vs lịch TQ (lunar-typescript, UTC+8) — **khác nhau thật**
```
1985-01-21: CN lunar=1984/12/1   VN lunar=1985/1/1   ← Tết VN sớm hơn TQ 1 tháng
1985-02-20: CN lunar=1985/1/1    VN lunar=1985/2/1
2007-02-17: CN lunar=2006/12/30  VN lunar=2007/1/1   ← lệch 1 ngày
2007-02-18: CN lunar=2007/1/1    VN lunar=2007/1/2
2030-02-02: CN lunar=2029/12/30  VN lunar=2030/1/1   ← lệch 1 ngày
2030-02-03: CN lunar=2030/1/1    VN lunar=2030/1/2
```
Hệ quả thiết kế: **mọi phép tính can chi năm/tháng/ngày cho user Việt phải đi qua lớp `CalendarProvider('vi')`**, không gọi thẳng lunar-typescript. Ngược lại 宜/忌, trực, tú vẫn lấy từ lunar-typescript theo **can chi ngày đã quy đổi**.

### 6.4 astronomy-engine
```
ASTRO sun lon 272.41 Capricorn | moon lon 207.43 Libra   (1997-12-24T05:00Z)
```

## Nguồn
- iztro (GitHub/npm, MIT): https://github.com/SylarLong/iztro ; README en: https://cdn.jsdelivr.net/npm/iztro@2.5.8/README-en_US.md
- lunar-javascript / lunar-typescript (6tail, MIT): https://github.com/6tail/lunar-javascript ; API: https://6tail.cn/calendar/api.html
- lunar-date-vn (Hồ Ngọc Đức algorithm): https://npmjs.com/package/lunar-date-vn ; amlich.js: https://npmjs.org/package/amlich.js ; khác biệt VN/TQ: https://invent.kde.org/plasma/kdeplasma-addons/-/merge_requests/1015 ; https://socket.dev/npm/package/calendaryjs-plugin-lunar
- Swiss Ephemeris license: https://www.astro.com/swisseph/swephinfo_e.htm ; phân tích AGPL cho SaaS: https://roxyapi.com/blogs/swiss-ephemeris-agpl-licensing-saas
- astronomy-engine (MIT, ±1 arcmin): https://github.com/cosinekitty/astronomy ; npm: https://snyk.io/advisor/npm-package/astronomy-engine
- Tarot PD: https://globalspiritualstudies.com/is-rider-waite-smith-public-domain/ ; https://wildhunt.org/2021/01/rider-waite-smith-tarot-deck-may-enter-public-domain.html ; ảnh: https://github.com/mixvlad/TarotCards ; dataset JSON: https://libraries.io/npm/tarotoo-tarot ; `@cometpisces/tarot-kit` (MIT): https://cdn.jsdelivr.net/npm/@cometpisces/tarot-kit@0.2.0/README.md
- I Ching Legge: https://baharna.com/iching/legge/index.htm ; https://librivox.org/yi-king-i-ching-the-book-of-changes-by-confucius
- Numerology lib tham khảo (Python, cấu trúc chỉ số): https://pypi.org/project/numerology
- Chi phí dịch/review: https://br.crowdin.com/blog/ai-translation-cost
