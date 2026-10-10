# B1 — Nghiên cứu thị trường theo framework CIRCLES

> CIRCLES (Lewis C. Lin): **C**omprehend the situation → **I**dentify the customer → **R**eport customer needs → **C**ut through prioritization → **L**ist solutions → **E**valuate trade-offs → **S**ummarize recommendation.
> Quy ước độ tin cậy nguồn: **[A]** báo cáo chính thức / công bố công ty / khảo sát có phương pháp; **[B]** báo chí uy tín trích dẫn nguồn A; **[C]** blog, trang thống kê thứ cấp, số liệu tự công bố chưa kiểm chứng. Số liệu [C] chỉ dùng để định hướng, không dùng làm KPI.

---

## C1. Comprehend — Bức tranh thị trường

### 1.1 Quy mô toàn cầu (ứng dụng chiêm tinh/bói toán)

| Nguồn | 2024 | 2030 | CAGR | Độ tin cậy |
|---|---|---|---|---|
| MarkNtel Advisors (Global Astrology App Market) | ~3,0 tỷ USD | ~9,0 tỷ USD | ~20% | B |
| The Business Research Company | 4,73 tỷ USD (2025) | 5,69 tỷ USD (2026) | 20,2% | B |
| Báo cáo "Horoscope & Astrology Apps" (bảo thủ nhất) | 3,40 tỷ USD | 6,08 tỷ USD | 10,2% | C |

**Kết luận:** Khoảng tin cậy 3–4,7 tỷ USD (2024/25), tăng 10–20%/năm. Châu Á – Thái Bình Dương là khu vực dẫn đầu theo MarkNtel. Dù lấy kịch bản thấp nhất, thị trường vẫn tăng gấp ~1,8 lần trong 6 năm → đủ lớn cho một sản phẩm đa ngôn ngữ.

### 1.2 Theo khu vực / quốc gia

#### 🇺🇸 Mỹ + khối tiếng Anh (US, CA, UK, AU)
- **Nhu cầu nền:** Pew Research (khảo sát 9.593 người, 10/2024, công bố 5/2025) [A]: **30%** người trưởng thành Mỹ dùng chiêm tinh/tarot/thầy bói ít nhất 1 lần/năm; **20%** "cho vui", **10%** vì tin có insight hữu ích. **43%** phụ nữ 18–49 tin chiêm tinh (vs 16% nam 50+). **54%** người LGBT xem chiêm tinh hằng năm (gấp đôi mức chung 28%).
- **Đối thủ & doanh thu:**
  - Co-Star: ~450K MAU tại Mỹ (data.ai/Statista, 2/2024) [A]; ~4,3 triệu MAU toàn cầu (Sensor Tower qua Bloomberg Law, 7/2026, khi Midjourney mua lại) [B]; ~30 triệu tài khoản (7/2023) [B]. Thị trường top: US 450K, CA 70K, AU 42K, UK 42K active users [A]. Freemium, bán báo cáo lẻ + hỏi "The Void".
  - Nebula (OBRIO, Ukraine): app horoscope có doanh thu cao nhất tại Mỹ, ~**516K USD/tháng** (Surfshark 5/2025) [B]; ARR ~50 triệu USD năm 2023 (tech.eu) [B]; mô hình pay-per-chat với psychic từ 1 USD/phút + subscription tuần 7,99 USD (3 ngày trial), 3 tháng 29,99–39,99 USD, lifetime 49,99–119,99 USD tuỳ nguồn [C]. **Rủi ro:** OBRIO bị FTC kiện năm 2026 về billing subscription [B] → bài học thiết kế thanh toán minh bạch.
  - Sanctuary: Sanctuary+ 14,99 USD/tháng kèm 5 phút đọc miễn phí; reading đầu 4,99 USD/5 phút; sau đó tính theo phút [A, App Store]. Review 2026 than phiền timer chạy khi còn xếp hàng 20–45 phút [C].
  - Apps AI mới nổi: Starla 430K downloads/tuần, ~2,18 triệu USD/tháng; Astro 100K downloads/ngày, ~300K USD/tháng (blog vendor) [C] → tín hiệu AI + astrology đang là "wave".
- **Pain point hiện hữu (từ review 1–2 sao 2026):** Co-Star đẩy quá nhiều tính năng cơ bản vào paywall, push notification gây mệt; Nebula "mồi 1 USD rồi auto-renew 42–49,99 USD"; Sanctuary tính tiền khi chờ.

#### 🇮🇳 Ấn Độ (tham khảo mô hình, không phải wave 1)
- Astrotalk FY25 (4/2024–3/2025): tổng thu **₹1.214 crore** (~145 triệu USD), **+85% YoY**, lợi nhuận điều chỉnh trước thuế ₹285 crore; **700K DAU**, 20.000+ chiêm tinh gia chia doanh thu; giá **₹10–200/phút** [B, Outlook Business/Entrackr/Inc42]. Thị trường quốc tế đóng góp ~20% doanh thu FY25 và ~37% FY26 (claim của co-founder), trong đó Mỹ >60% phần quốc tế [B].
- Thị trường app Ấn Độ: 163 triệu USD (2024) → 1,8 tỷ USD (2030), CAGR 49% (MarkNtel) [B]. InstaAstro ARR ₹200 crore, 25% từ kiều bào [B].
- **Ý nghĩa:** Mô hình "chat/call tính phút với chuyên gia" rất lớn nhưng cần vận hành marketplace + Vedic astrology (engine khác hẳn) → đưa vào wave 3.

#### 🇯🇵 Nhật Bản
- Thị trường dịch vụ 占い (uranai) ~**100 tỷ yên** (~650 triệu USD) FY2023 theo Yano Research (qua Money Post 2024) [B]. ~90% khách là nữ; nữ 30–50 tuổi chiếm ~80%; **~85% câu hỏi về tình cảm** [A/B, Yano 7/2024].
- LINE占い: >200 menu, có trả phí; LINE Trông占い (chat) tăng 153% paid user, 144% doanh thu 4/2020→4/2021 [A, LY Corp PR].
- **Ý nghĩa:** Thị trường trả tiền cao, tập trung tình cảm, kênh chat/phân phối qua super-app. Môn phổ biến: Shichū Suimei (= Bát Tự), Kyūsei Kigaku (Cửu Tinh Khí Học), tarot, cung hoàng đạo. Engine Bát Tự + Cửu Tinh của ta dùng được ngay (xem file 03).

#### 🇰🇷 Hàn Quốc
- Ngành xem vận mệnh ~**3,7 tỷ USD/năm**; 66–70% người Hàn xem bói ≥1 lần/năm (Seoulz) [C].
- Jeomsin (점신): 17–19 triệu lượt tải tích luỹ, doanh thu chủ yếu **quảng cáo** (xem 5–7s ad để mở nội dung) [C]. Forceteller (포스텔러): 8,6 triệu user đăng ký, MAU +28,2% YoY cuối 2025, cá nhân hoá dựa trên 8,6 triệu hồ sơ [C].
- Tín hiệu AI: GPT chuyên Saju trên ChatGPT thu hút **3 triệu** người dịp năm mới 2026 (Herald Kyungje 2/2026) [B].
- **Ý nghĩa:** Saju = Bát Tự (cùng engine, khác múi giờ/quy ước giờ). Mô hình ads-gated hoạt động ở KR → bật rewarded ads ở đây.

#### 🇨🇳 🇹🇼 🇭🇰 Cộng đồng Hoa ngữ
- Trung Quốc: thị trường "huyền học" ước **>100 tỷ NDT** (Huxiu) [C]; hashtag #玄学 trên Xiaohongshu ~4,5 tỷ view, 65,6 triệu bài (7/2025) [B]. Cece (测测, Tencent hậu thuẫn): ~24 triệu lượt tải (Sensor Tower qua Mezha) [B], 2,49 triệu MAU +57% YoY (Sixth Tone) [B]; kết hợp tarot + Tử Vi + AI bot + livestream.
- **Rào cản pháp lý:** Quy định dịch vụ thông tin tôn giáo trên Internet 2021, sàn TMĐT gỡ gian hàng liên quan [B]. → **Không phát hành tại đại lục**; phục vụ zh-TW/HK/SG/MY và kiều bào qua locale zh-TW/zh-CN.

#### 🇻🇳 Việt Nam (thị trường nhà, tham chiếu tinhmenhdo.com)
- Nhu cầu: tuvi.vn ~**711K visit/tháng**, 97,9% từ VN; từ khoá "lá số tử vi" ~**65K lượt tìm/tháng** (Ahrefs) [C]. App "Lịch Vạn Niên 2025" tự công bố **>15 triệu lượt tải**, rating >4,5 (FPT Shop) [C]; app khác 6M+ [C]. MoMo chạy event "Xem tử vi đầu năm với AI" 1/2025, ~154K view trang sự kiện [C].
- Mùa vụ rất rõ: đỉnh Tết (tử vi năm), cưới hỏi/động thổ (xem ngày), thi cử.
- **tinhmenhdo.com (đối thủ tham chiếu được yêu cầu):** Lập lá số Tử Vi theo nơi sinh (có kinh độ/múi giờ), hỗ trợ nhiều trường phái (Khâm Thiên Tứ Hoá, Nam Phái, Phi Tinh, Lương Phái, Trung Châu), Tứ Trụ, gieo quẻ Kinh Dịch, Lục Hào, Kỳ Môn, Thái Ất, "Gieo quẻ hỏi việc", lịch tiết khí theo giờ địa phương (có cả Đài Loan 2063), blog huyền học; **không lưu dữ liệu cá nhân sau khi tính**; định vị "học thuật, miễn phí" đối lập dịch vụ AI thu phí; bài 3/2026 chỉ ra **chatbot AI thường lập lá số sai** [A, site]. Similarweb: rank ~496K toàn cầu, thời lượng ~1:53 [C].
  - **Điểm học:** độ chính xác theo trường phái + địa điểm sinh là tiêu chuẩn người dùng VN "hardcore" đòi hỏi. **Điểm hở:** web-only, không có loop hằng ngày, không cá nhân hoá, không đa ngôn ngữ, không mô hình doanh thu rõ.

#### 🇧🇷 🇲🇽 Mỹ Latinh (es, pt-BR)
- Brazil: **tarot là thực hành tâm linh được tìm kiếm nhiều nhất** trên Google, trên cả chiêm tinh, bản đồ sao, thần số học (Band/Google, 4/2025) [B]. App psychic tiếng Tây Ban Nha/Bồ tự công bố >1 triệu lượt tải, top 3 nhiều nước LatAm [C]. Người dùng trả theo tuần/tháng bằng BRL [A, App Store].
- **Ý nghĩa:** Tarot + thần số học là đúng "khẩu vị", chi phí thuê bao thấp → bán theo tuần + credit.

#### 🇹🇭 🇮🇩 Đông Nam Á khác
- Thái Lan: "kinh tế niềm tin" (mutelu) tăng, 170 doanh nghiệp đăng ký ngành niềm tin, vốn 221,95 triệu baht (DBD, 5/2025) [B]; chưa có số liệu app. → wave 3.

### 1.3 Benchmark hành vi trả phí (áp dụng khi dựng mô hình doanh thu)
- RevenueCat State of Subscription Apps 2025 (75K app, >10 tỷ USD) [A]: median trial→paid ngày 35: **hard paywall 10,7% vs freemium 2,1%**; **30%** người đăng ký năm huỷ trong tháng đầu; app AI đạt revenue/install **0,63 USD** sau 60 ngày (gấp đôi median 0,31 USD). Báo cáo 2026: trial ≥17 ngày chuyển đổi 42,5% vs ≤4 ngày 25,5% (tương quan, không nhân quả).
- Chính sách cửa hàng: Apple Guideline 4.3 (Spam) **nêu đích danh** app horoscope/fortune telling là nhóm bão hoà, chỉ duyệt khi "unique, high-quality" [A]; Google Play: ghi "for entertainment purposes" **không** miễn trừ chính sách lừa dối; metadata phải khớp chức năng (Co-Star từng bị gỡ 10 giờ năm 2020) [A].

---

## I. Identify — Khách hàng mục tiêu

| Persona | Khu vực/locale | Đặc điểm (có số liệu) | Môn quan tâm | Sẵn sàng trả |
|---|---|---|---|---|
| **Linh**, 27, nhân viên văn phòng | VN (vi) | Xem lịch âm/ngày tốt thường xuyên; xem tử vi năm dịp Tết (đỉnh tìm kiếm); từng dùng tuvi.vn, Lịch Vạn Niên | Lịch ngày, Tử Vi, Bát Tự, Thần số học | Thấp–trung; thích gói nhỏ, ví điện tử (MoMo/ZaloPay) |
| **Maya**, 24, Gen Z | US/CA/UK/AU (en) | Thuộc nhóm 43% nữ 18–49 tin chiêm tinh; mệt vì push của Co-Star và paywall mập mờ; thích chia sẻ lên social | Tarot, Numerology, Birth chart, Compatibility | Trung; thuê bao tuần/tháng nếu minh bạch |
| **Yuna**, 34 | JP/KR (ja/ko) | Nằm trong nhóm nữ 30–50 chiếm 80% khách Nhật; 85% câu hỏi về tình cảm; quen trả theo lần đọc | Shichū Suimei/Saju, Tarot, Cửu Tinh | Cao; mua báo cáo lẻ, thuê bao tháng |
| **Camila**, 30 | BR/MX/ES (pt-BR/es) | Tarot là thực hành tìm kiếm số 1 ở Brazil; nhạy giá; mua theo tuần | Tarot hằng ngày, Numerology | Thấp–trung; weekly + credit |
| **Wei**, 38 | TW/HK/SG (zh-TW) | Đòi độ chính xác Tử Vi theo trường phái; so lá số với app chuyên (文墨天機, 天翼) | Tử Vi, Bát Tự, Kinh Dịch | Trung–cao; mua báo cáo chuyên sâu |

Phân khúc ưu tiên MVP: **Linh** (thị trường nhà, lợi thế nội dung) và **Maya** (thị trường trả phí lớn nhất, nội dung tarot/numerology dễ nguồn hoá, tiếng Anh dùng lại cho toàn cầu).

---

## R. Report — Nhu cầu người dùng (tổng hợp từ dữ liệu trên)

1. **Biết hôm nay nên làm gì** (lịch ngày, lá bài/quẻ ngày) → nhu cầu tần suất cao nhất, là nền cho tính năng free hằng ngày. Bằng chứng: Lịch Vạn Niên 15M tải; Jeomsin 17–19M tải với vận ngày; Co-Star xây thương hiệu trên push ngày.
2. **Hiểu bản thân / định hướng** (lá số, bát tự, life path) → nhu cầu "aha" lúc onboarding, giá trị cảm nhận cao nhất để bán.
3. **Tình cảm & hợp tuổi** (85% ở Nhật) → compatibility là tính năng trả phí số 1.
4. **Quyết định thời điểm** (cưới, khai trương, chuyển nhà, ký hợp đồng) → xem ngày theo tuổi; thị trường VN/CJK.
5. **Hỏi đáp tức thì** (AI chat) → 3 triệu người Hàn dùng GPT Saju; Cece dùng AI bot; nhưng người dùng **không tin chatbot tự tính** (tinhmenhdo).
6. **Minh bạch & kiểm soát chi tiêu** (phản ứng với Nebula/Sanctuary) → cần giá rõ, huỷ dễ, không "timer khi chờ".
7. **Riêng tư** dữ liệu ngày sinh (tinhmenhdo không lưu; Surfshark xếp hạng privacy app chiêm tinh) → mã hoá, cho phép dùng không tài khoản.

---

## C2. Cut through — Ưu tiên thị trường & môn

Điểm 1–5 (5 tốt nhất). Trọng số: Quy mô 30%, Sẵn sàng trả 25%, Khả thi dữ liệu/engine 25%, Cạnh tranh (càng thấp càng tốt) 20%.

| Thị trường (locale) | Quy mô | Trả phí | Khả thi data | Cạnh tranh | **Điểm** | Wave |
|---|---|---|---|---|---|---|
| EN (US/CA/UK/AU + global) | 5 | 5 | 5 (tarot/numerology PD) | 2 | **4,4** | 1 |
| VI (Việt Nam) | 3 | 2 | 5 (iztro vi-VN, lịch VN) | 4 | **3,6** | 1 |
| JA (Nhật) | 4 | 5 | 4 (Bát Tự/Cửu Tinh có engine; cần bản địa hoá sâu) | 2 | **3,8** | 2 |
| KO (Hàn) | 4 | 4 | 4 | 2 | **3,6** | 2 |
| ZH-TW/HK/SG | 3 | 4 | 5 (iztro gốc Hoa ngữ) | 2 | **3,6** | 2 |
| ES / PT-BR | 4 | 3 | 5 | 3 | **3,8** | 2 |
| HI (Ấn Độ) | 5 | 4 | 2 (cần Vedic engine + marketplace) | 1 | **3,2** | 3 |
| TH / ID | 3 | 2 | 3 | 4 | **3,0** | 3 |

> JA/KO/ZH điểm cao nhưng xếp wave 2 vì chi phí bản địa hoá nội dung (thuật ngữ, giọng văn, chuẩn giờ sinh) cao; cần nền tảng i18n ổn định trước. EN và VI cho phép kiểm chứng cả hai "gói nội dung" (Tây và Đông Á) với chi phí thấp nhất.

---

## L. List — Giải pháp sản phẩm

| Module | Khu vực chính | Free | Paid |
|---|---|---|---|
| Daily Oracle ("Hôm nay của bạn") | Tất cả | Toàn bộ (ads tuỳ chọn ở VN/KR/ID) | Phiên bản "deep" + lịch sử 30 ngày |
| Lịch vạn niên / xem ngày theo tuổi | VI, ZH, KO, JA | Lịch + hoàng đạo/hắc đạo | Chọn ngày tốt theo việc + tuổi, xuất lịch |
| Tử Vi Đẩu Số (iztro) | VI, ZH | Lá số + 3 cung tóm tắt | Luận giải đầy đủ 12 cung, đại hạn, lưu niên |
| Bát Tự / Saju / Shichū Suimei (lunar-typescript) | VI, ZH, KO, JA | 4 trụ + ngũ hành | Đại vận, dụng thần, năm/tháng |
| Kinh Dịch gieo quẻ | VI, ZH, EN | 1 quẻ/ngày | Không giới hạn + lưu + hỏi AI |
| Numerology (Pythagorean + Chaldean) | EN, ES, PT, VI | Life path + personal day | Báo cáo đầy đủ 7 chỉ số + năm cá nhân |
| Tarot (RWS) | EN, ES, PT, JA, VI | 1 lá/ngày | Trải bài 3/5/10 lá + AI luận + lưu nhật ký |
| Compatibility (hợp tuổi/đôi) | Tất cả | Điểm tổng quát | Báo cáo chi tiết |
| Ask AI (chat trên nền lá số đã tính) | Tất cả | 3 câu/ngày | Không giới hạn trong gói |
| Western natal chart (astronomy-engine) | EN, ES, PT | Sun/Moon/Rising | Full chart + transit (wave 2) |

---

## E. Evaluate — Đánh đổi chính

| Quyết định | Lựa chọn | Lý do (dữ liệu) | Rủi ro & cách giảm |
|---|---|---|---|
| Mô hình doanh thu | **Freemium + subscription + credit**, không live expert ở MVP | Nebula/Co-Star/Forceteller chứng minh freemium; Astrotalk/Sanctuary cần vận hành 20K chuyên gia, queue, QA → ngoài năng lực đội nhỏ | Freemium conversion thấp (2,1%) → bù bằng soft paywall sau "aha" + trial 7 ngày, đo trial→paid mục tiêu ≥25% |
| Paywall | **Soft** (free loop hằng ngày + 1 reading sâu miễn phí, sau đó trial) | Hard paywall 10,7% nhưng giết retention/viral; app bị Apple 4.3 soi nếu không "unique" | A/B hard vs soft ở tuần 10 |
| Quảng cáo | Rewarded ads **chỉ** VN/KR/ID; không ads ở EN/JA | Jeomsin thành công nhờ ads ở KR; ở US ads làm giảm cảm nhận premium (Nebula/Co-Star không ads) | Cờ remote config theo quốc gia |
| Engine thiên văn | **astronomy-engine (MIT)** thay Swiss Ephemeris | Swiss Ephemeris AGPL buộc mở toàn bộ mã hoặc mua license không công bố giá; ±1 arcmin đủ cho cung hoàng đạo/transit phổ thông | Nếu cần độ chính xác giây cung (Vedic) → mua license sau |
| AI | LLM chỉ **diễn giải JSON đã tính** + guardrails | Người dùng không tin chatbot tự tính (tinhmenhdo 3/2026); đồng thời AI apps có RPI gấp đôi | Chi phí token → cache theo (locale, segment, ngày); giới hạn câu/ngày ở free |
| Đa ngôn ngữ | Kiến trúc i18n từ ngày 1, nội dung roll-out theo wave | Chi phí dịch LLM ~0,001 USD/từ vs người 0,04–0,08 USD/từ (Crowdin) → dịch máy + reviewer bản địa | Thuật ngữ huyền học dễ sai → glossary bắt buộc |
| Trung Quốc đại lục | Không phát hành | Quy định 2021 | Phục vụ zh-TW/HK/SG |

---

## S. Summarize — Khuyến nghị & mô hình thu phí chốt

### Thị trường
- **Wave 1 (tháng 1–3):** `vi`, `en`. Store: VN, US, CA, UK, AU, SG, PH (English).
- **Wave 2 (tháng 4–6):** `es`, `pt-BR`, `ja`, `ko`, `zh-TW`.
- **Wave 3 (tháng 7+):** `hi` (kèm Vedic + marketplace nếu dữ liệu wave 1–2 ủng hộ), `th`, `id`, `fr`, `de`.

### Mô hình thu phí (quyết định trước khi build)

**Nguyên tắc:** 1 free loop mỗi ngày không giới hạn thời gian; mọi thứ "sâu" nằm trong gói **Plus**; báo cáo lẻ mua bằng **credit** cho người không thích thuê bao (LatAm, VN, JP mua theo lần).

| Gói | US/UK/CA/AU | VN | BR/MX | JP | KR | Bao gồm |
|---|---|---|---|---|---|---|
| Free | 0 | 0 | 0 | 0 | 0 | Daily Oracle, lịch, lá số/bát tự cơ bản, 1 lá tarot/ngày, 3 câu AI/ngày, 1 reading sâu đầu tiên |
| Plus tuần | 4,99 USD (trial 7 ngày) | 29K VND | R$ 12,90 | ¥ 600 | ₩ 4.900 | Không giới hạn reading, AI, compatibility, lịch sử |
| Plus tháng | 9,99 USD | 69K VND | R$ 24,90 | ¥ 1.200 | ₩ 9.900 | như trên |
| Plus năm | 39,99 USD | 349K VND | R$ 99,90 | ¥ 4.800 | ₩ 39.000 | như trên + 1 báo cáo năm |
| Credit pack | 4,99 / 9,99 / 19,99 USD | 49K / 99K / 199K | tương ứng PPP | tương ứng | tương ứng | 1 credit = 1 báo cáo sâu (Tử Vi năm, Bát Tự đại vận, trải 10 lá) |

> Giá là **giả thuyết khởi điểm** neo theo đối thủ (Nebula 7,99 USD/tuần, Sanctuary 14,99 USD/tháng, Co-Star bán lẻ) và PPP; bắt buộc A/B 2 mức giá ở mỗi thị trường trong 8 tuần đầu. Mua trong app qua RevenueCat (IAP) + Stripe trên web; VN thêm MoMo/ZaloPay trên web ở wave 2.

### Mô hình đơn vị (unit economics) để lập KPI

Giả định 100.000 install đầu (tháng 1–3), tham chiếu benchmark RevenueCat:

| Chỉ số | Mục tiêu | Căn cứ |
|---|---|---|
| D1 / D7 / D30 retention | 45% / 25% / 12% | Loop ngày + push; lifestyle apps median D30 ~8–10% (RevenueCat/ngành) |
| Free → bắt đầu trial | 6% | Soft paywall sau "aha"; freemium median 2,1% trial→paid ⇒ cần tăng số vào trial |
| Trial → paid | 30% | Trial 7 ngày (4–16 ngày: 25–42%) |
| Paid 100K install | ~1.800 subs | 100K × 6% × 30% |
| ARPPU blended | 6 USD/tháng | Mix tuần/tháng/năm, PPP |
| MRR cuối tháng 3 | ~10,8K USD + credit (~15%) ≈ 12,5K USD | — |
| RPI 60 ngày | ≥0,35 USD (vượt median 0,31; mục tiêu 0,6 nhờ AI) | RevenueCat |
| Churn tháng 1 (annual) | <25% | Benchmark 30% |

Mô hình được coi là **đạt** nếu sau 12 tuần: RPI ≥0,35 USD **và** D30 ≥10% ở ít nhất 1 trong 2 locale wave 1. Khi đó mới mở wave 2.

---

## Nguồn
- MarkNtel Advisors, Global Astrology App Market 2025–30: https://www.marknteladvisors.com/press-release/astrology-app-market-size ; India: https://www.marknteladvisors.com/query/talk-to-our-consultant/india-astrology-app-market.html
- The Business Research Company (qua GII): https://cn.gii.tw/report/tbrc1978437-astrology-app-global-market-report.html
- Pew Research Center, "30% of Americans Consult Astrology, Tarot Cards or Fortune Tellers" (21/5/2025): https://www.pewresearch.org/religion/2025/05/21/3-in-10-americans-consult-astrology-tarot-cards-or-fortune-tellers/
- Statista/data.ai, Co-Star top markets by active users (2/2024): https://statista.com/statistics/1451972/costar-app-top-markets-by-active-users ; downloads: https://www.statista.com/statistics/1451816/costar-app-downloads-us-and-global
- Bloomberg Law, Midjourney mua Co-Star (Sensor Tower 4,3M MAU): https://news.bloomberglaw.com/private-equity/ai-lab-midjourney-buys-astrology-startup-co-star-plans-new-apps
- Surfshark, Astrology apps privacy & revenue (5/2025): https://surfshark.com/research/chart/astrology-apps-privacy
- tech.eu, OBRIO/Nebula ARR 50M USD (12/2023): https://tech.eu/2023/12/05/obrio/ ; Wikipedia Nebula: https://en.wikipedia.org/wiki/Nebula_(spiritual_guidance)
- Nebula pricing (Republic World 2026 / unitq / Unstar): https://www.republicworld.com/initiatives/nebula-app-review-2026-features-cost-and-who-its-for-2026-09-16-137105 ; https://unstar.app/blog/is-nebula-legit-astrology-app-reviews-2026
- Sanctuary App Store: https://apps.apple.com/app/id1417411962 ; so sánh review 2026: https://unstar.app/blog/co-star-sanctuary-pattern-nebula-stellium-astrology-apps-ranked-2026
- Astrotalk FY25: https://www.outlookbusiness.com/news/astrotalk-reports-85-revenue-growth-in-fy25-as-tier-i-cities-boost-platform-activity ; https://entrackr.com/snippets/astrotalk-appoints-deepak-khetan-as-cfo-ahead-of-planned-ipo-9673650 ; quốc tế: https://inc42.com/features/can-astrotalk-chart-a-future-beyond-astrology/ ; InstaAstro: https://india.entrepreneur.com/?p=99050 ; Business Today/RedSeer: https://businesstoday.in/magazine/story/how-astrotech-is-reinventing-astrology-466381-2025-03-01
- Nhật: Yano Research press release: https://www.yano.co.jp/press-release/show/press_id/3662 ; Money Post (100 tỷ yên): https://www.moneypost.jp/1399543/2/ ; LY Corp (LINE Trông占い): https://www.lycorp.co.jp/news/archive/L/ja/ja20210610_C.pdf
- Hàn: Seoulz saju industry: https://www.seoulz.com/korea-saju-industry/ ; superstition economy: https://www.seoulz.com/korea-superstition-economy/ ; Innoforest báo cáo nền tảng vận mệnh: https://www.innoforest.co.kr/report/NS00000275 ; Herald (GPT Saju 3 triệu): https://www.heraldk.com/article/2026021004400018775
- Trung Quốc: Sixth Tone: https://www.sixthtone.com/news/1016792/zest-for-zen%3A-brands-tap-spiritual-shift-in-young-spenders ; Mezha (Sensor Tower 24M): https://mezha.net/eng/?p=3417730 ; Taipei Times: https://www.taipeitimes.com/News/feat/archives/2025/07/03/2003839646 ; Huxiu: https://www.huxiu.com/article/4846456.html ; Sinopsis (quy định): https://sinopsis.cz/en/chinas-superstition-boom-in-a-godless-state/
- Việt Nam: Ahrefs tuvi.vn: https://ahrefs.com/websites/tuvi.vn ; FPT Shop Lịch Vạn Niên: https://fptshop.com.vn/tin-tuc/thu-thuat/tai-ung-dung-lich-van-nien-2025-166641 ; MoMo: https://www.momo.vn/tin-tuc/tin-tuc-su-kien/xem-tu-vi-dau-nam-voi-ai-tren-momo-7102 ; tinhmenhdo.com: https://tinhmenhdo.com/ , https://tinhmenhdo.com/tu-vi/kham-thien-tu-hoa-nam-phai/ , https://tinhmenhdo.com/cach-xem-la-so-tu-vi-bang-ai-chinh-xac/ , https://tinhmenhdo.com/gieo-que-hoi-viec/ , https://tinhmenhdo.com/privacy/ ; Similarweb: https://www.similarweb.com/website/tinhmenhdo.com/vs/xem.tracuutuvi.com/
- Brazil: Band/Google tarot: https://www.band.com.br/nacional/brasil/taro-lidera-pesquisas-google
- Thái Lan: Nation Thailand faith business: https://www.nationthailand.com/life/art-culture/40051548
- RevenueCat State of Subscription Apps 2025: https://revenuecat.com/state-of-subscription-apps-2025 ; tóm tắt: https://subscriptioninsider.com/article-type/news/revenuecats-state-of-subscription-apps-2025-report-ais-dominance-retention-challenges-and-the-shift-away-from-pure-subscriptions ; trial length: https://www.revenuecat.com/blog/growth/free-trial-length
- Apple 4.3 từ chối app astrology: https://developer.apple.com/forums/thread/737999 ; https://mjtsai.com/blog/2020/06/24/struck-rejected-from-the-app-store/ ; Google Play deception policy: https://support.google.com/googleplay/android-developer/answer/9887877 ; Co-Star bị gỡ: https://gizmodo.com.au/?p=1202999
- Chi phí dịch AI (Crowdin, Atlassian): https://br.crowdin.com/blog/ai-translation-cost ; https://www.atlassian.com/blog/how-we-build/scaling-localization-at-atlassian-keeping-translation-at-the-pace-of-ai-era-development
