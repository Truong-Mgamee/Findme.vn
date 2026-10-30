# B1 – Nghiên cứu thị trường theo framework CIRCLES

> CIRCLES = **C**omprehend situation · **I**dentify customer · **R**eport needs · **C**ut through prioritization · **L**ist solutions · **E**valuate trade-offs · **S**ummarize.
> Mọi con số có link nguồn. Số không có nguồn được đánh dấu **[giả định]**.

---

## C1. Comprehend – Bối cảnh thị trường

### 1.1 Thị trường có thật, đang tăng, nhưng số liệu "market size" toàn cầu không tin được

Các báo cáo vendor cho cùng năm 2025 chênh nhau 6 lần: 1,16 tỷ USD ([360iResearch](https://www.360iresearch.com/library/intelligence/horoscope-astrology-apps)) → 4,75 tỷ ([ResearchAndMarkets](https://www.researchandmarkets.com/reports/6090017/astrology-app-market-report)) → 7,11 tỷ ([MarkNtel](https://www.marknteladvisors.com/research-library/astrology-app-market.html)). **Kết luận: không dùng market-size toàn cầu để ra quyết định.** Dùng số liệu cấp công ty và cấp quốc gia dưới đây.

### 1.2 Bằng chứng cấp công ty (số công bố / kiểm toán)

| Công ty | Thị trường | Số liệu cứng | Mô hình thu phí | Nguồn |
|---|---|---|---|---|
| **Astrotalk** (Ấn Độ) | IN + diaspora | Doanh thu FY25 **₹1 214 crore (~145 M USD)**, +85 % YoY; lợi nhuận ròng ~₹250 crore; 4 crore (40 M) user luỹ kế; định giá 1 tỷ USD | Marketplace chat/call với thầy bói tính theo phút + D2C bán vật phẩm (₹140 crore năm đầu) | [Outlook Business](https://www.outlookbusiness.com/start-up/news/astrotalk-reports-85-revenue-growth-in-fy25-as-tier-i-cities-boost-platform-activity), [Inc42](https://inc42.com/buzz/astrotalk-joins-unicorn-club-after-esop-buyback-at-1-bn-valuation/) |
| **Nebula / OBRIO** (Ukraine, bán toàn cầu) | US/EU/LatAm | ARR **~50 M USD** (2023, Forbes UA xem số App Store nội bộ); 4,3 M MAU (đầu 2024); 65 M user luỹ kế | Subscription **tuần 7,99–9,99 USD** sau trial 3 ngày + tư vấn trả phí + ads | [tech.eu](https://tech.eu/2023/12/05/obrio/), [dev.ua](https://dev.ua/en/news/ukrainskyi-astrozastosunok-nebula-pro-50-mln-dokhodu-ta-ukrainsku-movu-1689768558), [Google Play](https://play.google.com/store/apps/details?id=genesis.nebula&hl=en_US) |
| **Co-Star** (US) | US/EN | >20 M download; ước ~300 K USD/tháng iOS (Adapty, 9/2024) | Freemium → Pro 8,99–15 USD/tháng, free tier bị thu hẹp dần từ 2022 | [Adapty](https://adapty.io/paywall-library/co-star-personalized-astrology/), [unstar.app](https://unstar.app/blog/co-star-sanctuary-pattern-nebula-stellium-astrology-apps-ranked-2026) |
| **Jeomsin / TechLabs** (Hàn) | KR | 17–19 M download luỹ kế; doanh thu hợp nhất **₩83 tỷ (~60 M USD) 2023** | Freemium + quảng cáo + bán nội dung Saju | [Seoulz](https://www.seoulz.com/korea-saju-industry/) |
| **Forceteller** (Hàn) | KR | 8,6 M user đăng ký; MAU +28,2 % YoY (cuối 2025) | Subscription + report trả phí | [Seoulz](https://www.seoulz.com/korea-superstition-economy/) |
| **Cece / 测测** (Tencent-backed, TQ) | CN | >100 M download | Freemium + report + tư vấn | [Taipei Times 7/2025](https://www.taipeitimes.com/News/feat/archives/2025/07/03/2003839646) |
| **Lịch Vạn Niên – Lịch Việt** (VN) | VN | Tự khai "15 M download"; Pro **65 000 đ/tháng · 809 000 đ/năm** | Freemium + subscription | [FPT Shop](https://fptshop.com.vn/tin-tuc/thu-thuat/tai-ung-dung-lich-van-nien-2025-166641), [App Store](https://apps.apple.com/ng/app/l%E1%BB%8Bch-v%E1%BA%A1n-ni%C3%AAn-2025-%C3%A2m-l%E1%BB%8Bch/id6475258676) |

**Insight:** 3 mô hình đã được chứng minh ở quy mô ≥50 M USD/năm: (a) subscription tuần (Nebula), (b) marketplace theo phút (Astrotalk), (c) freemium + ads + report (Jeomsin). v1 của chúng ta đi theo (a) + report consumable; (b) để v2.

---

## C2. Identify customer – Nhu cầu & quy mô theo quốc gia

### 2.1 Bảng so sánh thị trường (số liệu đã kiểm chứng)

| Nước | Quy mô / mức độ tin | Hệ bói ưa chuộng | Ai dùng | Mức giá tham chiếu | Nguồn |
|---|---|---|---|---|---|
| **Mỹ** | **30 % người lớn** dùng chiêm tinh/tarot/thầy bói ≥1 lần/năm; 14 % hằng tháng; 6 % hằng tuần; **20 % "cho vui", 10 % "để có insight"** (Pew, n = 9 593, 10/2024) | Chiêm tinh Tây phương (natal chart), tarot | Nữ trẻ, LGBTQ+ (~50 % dùng) | Co-Star 8,99–15 USD/tháng; Nebula 7,99–9,99 USD/**tuần** | [Pew Research](https://www.pewresearch.org/religion/2025/05/21/3-in-10-americans-consult-astrology-tarot-cards-or-fortune-tellers/) |
| **Nhật** | Thị trường dịch vụ bói **99,7 tỷ yên (FY2023, Yano)**; 5/6 phân khúc tăng, riêng "Web占い (app/SNS)" đi ngang; spiritual business 4,24 nghìn tỷ yên | Uranai tổng hợp (tử vi phương Tây 12 cung, tứ trụ 四柱推命, tarot, 姓名判断) | **Nữ 30–50**, 85 % hỏi về tình cảm | Điện thoại/chat tính phút; app subscription 300–980 yên/tháng **[giả định]** | [Yano press 12/2024](https://www.yano.co.jp/press-release/show/press_id/3662), [Nikkei](https://www.nikkei.com/article/DGXZRSP683359_W4A201C2000000/) |
| **Hàn** | **₩1,4 nghìn tỷ (~1 tỷ USD) 2024** (InnoForest); ước khác 3,7 tỷ USD (không xác minh); 5 app đầu bảng MAU gộp 1,24 M (IGAWorks) | **Saju (tứ trụ)**, tarot, tử vi phương Tây | Gen Z–30s, cả nam nữ (Saju là văn hoá đại chúng) | Jeomsin free+ads; Forceteller subscription | [Seoulz](https://www.seoulz.com/korea-saju-industry/), [Seoul Economic Daily](https://en.sedaily.com/finance/2026/08/13/ai-powered-fortune-telling-apps-surge-reaching-1-billion) |
| **Trung Quốc / Đài Loan** | AI divination market **>12 tỷ RMB**, >70 % user 18–30 (iiMedia); 68 % người 18–35 tin ≥1 nguyên lý huyền học (CASS 2025); hashtag 玄学 >5 tỷ view Xiaohongshu | Bát tự, Tử vi đẩu số, Tarot, MBTI-hoá | Gen Z lo âu kinh tế | Report 9,9–68 RMB **[giả định]** | [Daxue Consulting](https://daxueconsulting.com/spiritual-economy/), [Daoinsights](https://daoinsights.com/opinions/emotional-consumption-in-2025-what-are-young-people-paying-for/) |
| **Ấn Độ** | App chiêm tinh **15 crore (150 M) download T1–T9**, +75 % YoY (Sensor Tower); Astrotalk 145 M USD/năm | Vedic (Kundli), numerology, tarot | Rộng, tier-1 city tăng mạnh | Chat theo phút ₹10–50/phút | [Aman Shanti/Sensor Tower](https://amanshantinews.com/religious-spiritual-astrology-apps-see-nearly-30cr-downloads-in-jan-sept/) |
| **Brazil / LatAm** | Brazil #3 thế giới về lượt tải app (Adjust 2025); personare.com.br ~3,1 M search traffic/tháng, astrolink 1,5 M (Ahrefs 7/2025); Co-Star/Astrolink thành trào lưu 2026 (Correio Braziliense) | Chiêm tinh Tây phương, tarot | Nữ trẻ, đô thị | **[giả định]** 9,90–19,90 BRL/tháng | [Ahrefs](https://ahrefs.com/websites/brazil/people-and-society), [Adjust](https://www.adjust.com/es/blog/latin-america-app-trends/) |
| **Việt Nam** | Thị trường app 1,29 tỷ USD, 2,88 tỷ lượt cài 2025 (Ken Research); Lịch Vạn Niên tự khai 15 M download | Tử vi, bát tự, phong thuỷ, ngày tốt, thần số học | Rộng, lịch âm là nhu cầu hằng ngày | 65 000 đ/tháng · 809 000 đ/năm | [Ken Research](https://www.kenresearch.com/vietnam-apps-market), [App Store](https://apps.apple.com/ng/app/l%E1%BB%8Bch-v%E1%BA%A1n-ni%C3%AAn-2025-%C3%A2m-l%E1%BB%8Bch/id6475258676) |

### 2.2 Mapping hệ bói ↔ thị trường (đây là lý do cần 4 engine)

| Engine | Thị trường chính | Thị trường phụ |
|---|---|---|
| Tử Vi đẩu số + Bát tự + Lịch âm/ngày tốt | VN, TW, HK, CN (diaspora), KR (Saju ≈ Bát tự) | JA (四柱推命) |
| Chiêm tinh Tây phương (natal, transit, daily) | US, UK, BR, MX, ES, JA (12 cung rất phổ biến) | KR, PH |
| Thần số học (Pythagorean) | US, VN (đang hot), IN, PH, BR | toàn cầu – chi phí content thấp nhất |
| Tarot (RWS 78 lá) | US, BR, KR, JA, FR, ES | toàn cầu – thị giác, viral, không cần giờ sinh |

### 2.3 Persona chính (chi tiết ở B2)

- **P1 "Ritual seeker"** (US/BR/JA, nữ 18–34): mở app 30 giây buổi sáng, muốn 1 câu "hôm nay thế nào", chia sẻ lên story. → hook free.
- **P2 "Decision maker"** (VN/KR/TW, 25–40, cả nam nữ): sắp quyết định (cưới, mua nhà, đổi việc, xuất hành) cần ngày tốt / luận giải sâu. → mua report / sub.
- **P3 "Relationship checker"** (mọi nước, 85 % nhu cầu ở Nhật): hợp tuổi, hợp cung, compatibility. → viral loop + paid.

---

## R. Report customer needs – Nhu cầu & pain (tóm tắt, chi tiết B2)

| Nhu cầu | Bằng chứng | Hiện trạng đối thủ |
|---|---|---|
| Nhanh, hằng ngày, "cho vui" | Pew: 20 % cho vui, chỉ 6 % hằng tuần → tần suất thấp, cần hook cực nhẹ | Co-Star làm tốt nhưng push "xúc phạm" gây fatigue (unstar.app review) |
| Tin cậy / "đúng" theo văn hoá mình | Mỗi nước 1 hệ khác nhau (bảng 2.2); app Tây không có Tử vi, app Á không có natal chart | Chưa có app nào gộp Á + Âu đa ngôn ngữ đúng chuẩn |
| Minh bạch giá, không bị charge bất ngờ | Nebula: complaint phổ biến về trial 3 ngày auto-charge tuần ([Google Play reviews](https://play.google.com/store/apps/details?id=genesis.nebula&hl=en_US)) | Cơ hội: paywall rõ ràng, nhắc trước khi hết trial |
| Hỏi về tình cảm / quyết định cụ thể | Yano: 85 % use-case là tình cảm | Marketplace người thật (Astrotalk/Sanctuary) – v2 |

---

## C3. Cut through – Ưu tiên thị trường

Điểm = (Bằng chứng nhu cầu × Khả năng thanh toán × Chi phí content/i18n × Rủi ro store) – chấm 1–5 (5 tốt nhất).

| Nước | Nhu cầu | Thanh toán | Chi phí content | Cạnh tranh | Tổng | Wave |
|---|---|---|---|---|---|---|
| VN | 5 | 3 | 5 (đội nhà, nguồn Tử vi MIT) | 3 | **16** | 1 |
| US/EN | 5 (Pew) | 5 | 4 (tarot/numerology/astro EN có sẵn) | 2 (Co-Star, Nebula) | **16** | 1 |
| JA | 5 (Yano 99,7 tỷ yên) | 5 | 2 (cần biên tập bản địa, 姓名判断 khác) | 2 | 14 | 2 |
| KO | 5 | 4 | 3 (Saju ≈ Bát tự engine dùng lại) | 2 (Jeomsin) | 14 | 2 |
| PT-BR | 4 | 3 | 4 | 3 | 14 | 2 |
| ES (MX/ES) | 4 | 3 | 4 | 3 | 14 | 2 |
| ZH-TW | 4 | 4 | 4 (engine Tử vi dùng lại) | 3 | 15 | 2–3 (store TW ok, CN mainland không phát hành) |
| HI/EN-IN | 5 | 2 (ARPU thấp nhưng volume lớn) | 2 (cần Vedic engine riêng) | 1 (Astrotalk) | 10 | 3 |
| TH / ID | 4 | 2 | 3 | 3 | 12 | 3 |

**Wave 1 = VN + EN.** Lý do: 2 ngôn ngữ nhưng phủ 4 engine, và EN là ngôn ngữ fallback cho mọi thị trường khác.

---

## L. List solutions – Các hướng sản phẩm đã cân nhắc

| # | Hướng | Mô tả | Bỏ/Chọn |
|---|---|---|---|
| S1 | Daily horoscope app thuần | 12 cung + push | **Bỏ** – đúng cái Apple 4.3(b) gọi là "fortune telling… indistinguishable" |
| S2 | Marketplace thầy bói (clone Astrotalk) | Chat theo phút | Bỏ ở v1 – cần supply 2 phía, KYC, payout từng nước |
| S3 | **Multi-system "Destiny profile" + daily ritual** | 1 hồ sơ sinh → 4 engine → thẻ hằng ngày tổng hợp, so sánh Á/Âu, lịch ngày tốt | **Chọn** – khác biệt thật (chưa app nào gộp Tử vi + natal + numerology + tarot đa ngôn ngữ) |
| S4 | AI chat "hỏi thầy" bằng LLM | Chat tự do | Giữ làm **feature trong S3** (v1.1), bounded bằng dữ liệu engine để không "bịa" |

---

## E. Evaluate – Mô hình thu phí (quyết định trước khi build)

### E1. Benchmark hành vi thanh toán (RevenueCat, 115 000 app, 16 tỷ USD)

| Chỉ số | Giá trị | Nguồn |
|---|---|---|
| Doanh thu theo gói: **weekly 55,5 %**, monthly 11,7 %, annual phần còn lại (2025) | weekly tăng từ 43,3 % (2023) | [Medium tổng hợp SoSA](https://chuvak-pavel.medium.com/state-of-app-monetization-2026-key-trends-from-revenuecat-and-adapty-8bdc23a4bb6f) |
| Download → trial start: median 6,2 %, P90 20,3 %; app giá cao convert tốt hơn (9,8 % vs 4,3 %) | | [RevenueCat 2025](https://www.revenuecat.com/state-of-subscription-apps-2025) |
| Trial → paid (D35): **hard paywall 10,7 %** vs freemium 2,1 % | | [RevenueCat 2026](https://www.revenuecat.com/state-of-subscription-apps) |
| Trial dài 17–32 ngày convert 42,5 % vs trial <4 ngày 25,5 % | | [RevenueCat 2026](https://www.revenuecat.com/state-of-subscription-apps) |
| 82 % trial start xảy ra **ngay ngày cài** | → onboarding phải kết thúc bằng paywall | [RevenueCat 2025](https://www.revenuecat.com/state-of-subscription-apps-2025) |
| Lifestyle: trial làm giảm LTV 21,2 % (người mua thẳng ở lại lâu hơn) | → test "no-trial weekly" ở Lifestyle | Medium tổng hợp (second-hand) |
| Retention app trung bình D1 25,3 %, D30 5,7 % (Adjust 2024) | → mục tiêu D30 ≥ 12 % nhờ daily hook | [trysonar](https://trysonar.app/blog/app-user-retention-benchmarks-and-what-moves-it.md) |

### E2. Mô hình chọn: **Freemium + Subscription (weekly/annual) + Consumable report**

| Tầng | Nội dung | Giá US | Giá VN | Ghi chú |
|---|---|---|---|---|
| **Free (mãi mãi)** | Thẻ "Hôm nay" (1/ngày), 1 lá tarot/ngày, lịch âm + ngày tốt cơ bản, hồ sơ sinh + biểu đồ cơ bản (Tử vi 12 cung / natal wheel / số chủ đạo), streak, widget | 0 | 0 | Đây là hook DAU, không giới hạn theo thời gian |
| **Plus – weekly** | Luận giải đầy đủ 4 engine, transit/tháng/năm, compatibility không giới hạn, 3 lá tarot spread, không ads, AI hỏi đáp 20 câu/tuần | **4,99 USD/tuần** (trial 3 ngày) | 49 000 đ/tuần | Theo RevenueCat weekly chiếm 55 % doanh thu; Nebula 7,99–9,99 → ta rẻ hơn 40 % |
| **Plus – annual** | như trên | 39,99 USD/năm | 499 000 đ/năm | Anchor để weekly trông đắt → đẩy annual |
| **Deep Reading (consumable)** | Report PDF/in-app 1 chủ đề (năm 2027, tình duyên, sự nghiệp, hợp tuổi 2 người) | 9,99 USD | 99 000 đ | Giống "report" của Jeomsin/Cece; margin cao, mua không cần sub |
| **Ads (free tier, Android + web ưu tiên)** | Rewarded video đổi 1 lá tarot thêm / 1 câu AI | – | – | Jeomsin chứng minh ở KR; iOS hạn chế để tránh review xấu |

**Giá theo PPP:** dùng App Store price tiers tự động theo quốc gia + override thủ công cho VN/IN/BR/ID/TH (≈ 25–40 % giá US). **[giả định cần test]** A/B 3 mức giá weekly trong 2 tuần đầu.

### E3. Unit economics mục tiêu (gate sau 30 ngày)

| KPI | Mục tiêu v1 | Căn cứ |
|---|---|---|
| Onboarding → hồ sơ sinh hoàn tất | ≥ 70 % | **[giả định]** |
| Download → trial start | ≥ 8 % | RevenueCat median 6,2 %, P90 20,3 % |
| Trial → paid | ≥ 10 % | RevenueCat hard paywall 10,7 % |
| D1 / D7 / D30 retention | 40 / 20 / 12 % | Adjust avg 25,3 / – / 5,7 → daily hook phải nhân đôi |
| ARPU paid/tháng (US) | ≥ 12 USD | 4,99 × 4,3 tuần × churn |
| Tỷ lệ refund/complaint về billing | < 1 % | Né lỗi Nebula |

---

## S. Summary – Kết luận B1

1. **Nhu cầu đã được chứng minh ở cả 3 cụm**: US (Pew 30 %), Đông Á (Yano 99,7 tỷ yên; KR ₩1,4 nghìn tỷ; CN >12 tỷ RMB), Nam Á (Astrotalk 145 M USD). Không có app nào phục vụ **cả Á lẫn Âu** bằng đúng hệ bói của từng văn hoá, đa ngôn ngữ.
2. **Mô hình thu phí chốt:** Freemium (daily card miễn phí vĩnh viễn) + Plus weekly 4,99 USD / annual 39,99 USD (PPP theo nước) + Deep Reading 9,99 USD. Marketplace người thật để v2.
3. **Thứ tự thị trường:** VN + EN → JA/KO/PT/ES → ZH-TW/TH/ID/HI.
4. **Rủi ro lớn nhất không phải thị trường mà là App Store 4.3(b)** → sản phẩm phải chứng minh "meaningfully different": multi-system cross-reading, lịch ngày tốt theo lịch âm, so sánh Á/Âu, widget, AI hỏi đáp có nguồn. Chi tiết chiến lược ở B2 §4.

### Trích nguyên văn Apple Guideline 4.3(b) (đọc từ developer.apple.com ngày 2026-10-10)

> "Don't submit apps that are indistinguishable from what's already widely available… Certain kinds of apps, such as dating, flashlight, sound effects, wallpaper, simple timers, and **fortune telling**, are well established on the App Store and we will not accept new submissions unless they offer a meaningfully different or improved experience."

Tiền lệ: app Struck (dating theo chiêm tinh) bị từ chối ~10 lần trong vài tháng trước khi được duyệt ([TechCrunch](https://techcrunch.com/2020/07/20/after-numerous-rejections-strucks-dating-app-for-the-co-star-crowd-hits-the-app-store/)); dev chỉ giữ tarot vẫn bị từ chối ([Apple forum](https://developer.apple.com/forums/thread/737999)).
