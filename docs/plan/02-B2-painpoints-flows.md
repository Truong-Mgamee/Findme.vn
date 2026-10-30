# B2 – Painpoint & luồng tương ứng

## 1. Persona (từ B1 §2.3) và job-to-be-done

| Persona | JTBD | Tần suất | Bằng chứng |
|---|---|---|---|
| **P1 Ritual seeker** (US/BR/JA, nữ 18–34) | "Mỗi sáng tôi muốn biết hôm nay nên để ý gì, trong 30 giây, và có cái để share" | Hằng ngày | Pew: 20 % dùng "cho vui"; Co-Star viral nhờ share story |
| **P2 Decision maker** (VN/KR/TW, 25–40) | "Tôi sắp [cưới/mua nhà/đổi việc/xuất hành], tôi cần ngày tốt và lời luận giải tôi tin được" | Theo sự kiện (1–4 lần/năm) | Yano: 85 % hỏi tình cảm; Lịch Vạn Niên 15 M download nhờ "ngày tốt" |
| **P3 Relationship checker** (toàn cầu) | "Tôi với người này có hợp không?" | Theo mối quan hệ | Brazil: 23 % nói cung hoàng đạo quyết định thành công quan hệ ([Correio Braziliense](https://blogs.correiobraziliense.com.br/servidor/para-23-dos-brasileiros-o-signo-e-crucial-para-o-sucesso-do-relacionamento/amp/)) |

## 2. Painpoint → giải pháp → luồng

| # | Painpoint (ai) | Bằng chứng | Giải pháp trong app | Luồng (flow id) |
|---|---|---|---|---|
| PP1 | Mỗi app chỉ 1 hệ; người Á dùng app Tây không thấy Tử vi, người Tây không hiểu Bát tự (P1, P2) | Bảng engine↔thị trường B1 §2.2; không đối thủ nào gộp | **1 hồ sơ sinh → 4 engine**, màn "Destiny Profile" hiện hệ mặc định theo locale, chuyển tab sang hệ khác | F1 Onboarding, F2 Profile |
| PP2 | Daily horoscope chung chung, 12 cung giống nhau cho hàng triệu người (P1) | Review Co-Star/Nebula; Pew: chỉ 10 % thấy "insight" | Thẻ "Hôm nay" **cá nhân hoá theo giờ sinh**: transit thật (chiêm tinh), ngày can-chi so với mệnh (Á Đông), số ngày cá nhân (numerology), 1 lá tarot – gộp thành 3 câu | F3 Daily Card |
| PP3 | Quên quay lại; push gây fatigue (P1) | unstar.app: "great when you get one a week"; Adjust D30 5,7 % | **1 push/ngày đúng giờ user chọn**, widget home-screen, streak nhẹ (không phạt), nội dung push là câu đầu của thẻ | F3, F8 Notification |
| PP4 | Giờ sinh không biết / múi giờ sai → kết quả sai (P2) | Tử vi/natal cần giờ sinh; user VN thường biết "giờ Tý/Sửu…" | Nhập giờ theo **12 canh giờ** (Á) hoặc đồng hồ (Âu); "không biết giờ" → chế độ giảm độ tin + gợi ý hỏi gia đình; tự tra múi giờ lịch sử từ nơi sinh | F1 |
| PP5 | Cần ngày tốt cho việc cụ thể, phải tra lịch vạn niên rời (P2) | Lịch Vạn Niên 15 M download | **Lịch ngày tốt theo việc** (cưới, khai trương, xuất hành, ký hợp đồng) lọc theo tuổi user, có lý do (hoàng đạo/hắc đạo, xung tuổi) | F5 Good-day Calendar |
| PP6 | Hợp tuổi / compatibility phải nhập cả 2 người nhiều lần (P3) | Yano 85 % tình cảm | Lưu "People" (người thân), 1 chạm so sánh theo 4 hệ, kết quả shareable | F6 Compatibility |
| PP7 | Bị charge bất ngờ sau trial (P1) | Nebula complaints; Apple 3.1.2 yêu cầu mô tả rõ | Paywall ghi rõ "Hết trial ngày X sẽ thu Y", push nhắc **24 h trước** khi hết trial, 1 chạm huỷ trong app | F7 Paywall |
| PP8 | Luận giải dài, khó hiểu, thuật ngữ (mọi persona) | Giả định từ review app Tử vi VN **[giả định – kiểm chứng bằng 5 interview]** | Mỗi kết luận có 3 lớp: **1 câu tóm tắt → 3 bullet → chi tiết có thuật ngữ + tooltip** | F2, F4 |
| PP9 | Muốn hỏi câu cụ thể nhưng không có thầy (P2) | Astrotalk 145 M USD từ Q&A | v1.1: **AI hỏi đáp có nguồn** – LLM chỉ được trả lời dựa trên JSON kết quả engine + content pack, luôn trích "theo lá số của bạn, cung X có sao Y" | F9 Ask |

## 3. User flows (mức wireframe text)

### F1 Onboarding (mục tiêu ≤ 90 giây, ≥ 70 % hoàn tất)
1. Splash → chọn ngôn ngữ (auto theo device, cho đổi) 
2. "Bạn muốn khám phá gì?" chọn 1–3 chip: Hôm nay của tôi / Tử vi / Chiêm tinh / Thần số / Tarot / Ngày tốt / Hợp tuổi → quyết định tab mặc định
3. Nhập tên gọi, giới tính (bắt buộc cho Tử vi), ngày sinh (dương; hiện âm lịch tương ứng), giờ sinh (canh giờ hoặc đồng hồ, có "không rõ"), nơi sinh (autocomplete → lat/long/timezone)
4. Loading "đang lập lá số…" 2 s (hiển thị 4 engine đang tính) → **Destiny Profile preview** (free): số chủ đạo, cung mặt trời/mặt trăng, mệnh ngũ hành, 1 câu tổng
5. Hỏi giờ nhận thẻ hằng ngày → xin quyền push
6. **Paywall** (hard, có "Tiếp tục với bản Free" ở góc, text nhỏ nhưng rõ – tuân thủ 3.1.2) → Home

### F3 Daily Card (hook free)
- Home mở thẳng thẻ hôm nay: tiêu đề ngày (dương + âm + can chi), điểm 1–5 sao cho Tình cảm / Công việc / Tiền / Sức khoẻ, 3 câu cá nhân hoá, 1 lá tarot (lật để xem), màu/số may mắn, "Hôm nay nên / tránh".
- CTA: Share (ảnh 9:16 có watermark), Xem chi tiết (Plus), Lịch ngày tốt.
- Streak: "Ngày thứ 7 liên tiếp" – mất streak không phạt, chỉ "bắt đầu lại".
- Thẻ được tính 00:00 giờ địa phương, cache offline.

### F2 Destiny Profile
- Tab theo hệ: [Tử vi] [Bát tự] [Chiêm tinh] [Thần số] – thứ tự theo locale.
- Mỗi tab: biểu đồ (lá số 12 cung / natal wheel / bảng số), 3 lớp nội dung (PP8). Free: lớp 1 + lớp 2 của 1 mục; Plus: tất cả.
- Nút "So sánh hệ Á – Âu nói gì về tính cách của bạn" (khác biệt cho 4.3(b)).

### F4 Readings (Plus / consumable)
- Năm nay (đại vận + transit + personal year), Tháng này, Tình duyên, Sự nghiệp, Tarot spread 3 lá / Celtic cross 10 lá.
- Deep Reading = PDF + lưu vĩnh viễn trong "Thư viện".

### F5 Good-day Calendar
- Tháng view: ngày tô màu theo hoàng đạo/hắc đạo + xung tuổi user. Lọc theo việc. Chi tiết ngày: giờ hoàng đạo, hướng xuất hành, lý do.
- EN locale: hiển thị "Moon phase + Void-of-course + personal day number" thay cho can chi (cùng UI).

### F6 Compatibility
- Chọn 2 hồ sơ (self + People). Kết quả theo hệ: Ngũ hành/can chi (Á), Synastry cơ bản (Âu), Life path (số), tổng điểm + 3 lời khuyên. Free 1 lần/ngày, Plus không giới hạn.

### F7 Paywall & billing
- 2 gói: Weekly (trial 3 ngày) + Annual (highlight "tiết kiệm 85 %"). Deep Reading mua lẻ.
- Dòng bắt buộc: giá, chu kỳ, ngày thu tiền đầu tiên, link huỷ, Terms/Privacy.
- Push "Trial kết thúc ngày mai" (PP7).

### F8 Notification & widget
- 1 push/ngày (giờ user chọn), có thể tắt riêng từng loại. Widget iOS/Android: điểm ngày + 1 câu.

### F9 Ask (v1.1)
- Chat; system prompt chỉ cho phép trả lời từ JSON engine; mỗi câu trả lời có footnote "nguồn: cung Mệnh có Tử Vi + Thiên Phủ". Free 3 câu/tuần, Plus 20.

## 4. Chiến lược vượt Apple 4.3(b) ("meaningfully different")

Lập luận và tính năng sẽ ghi trong **App Review Notes** khi submit:

| Khác biệt | Có trong v1? | Đối thủ có? |
|---|---|---|
| 4 hệ bói Á + Âu cùng 1 hồ sơ, cross-reading | ✅ | Không (Co-Star/Nebula: chỉ Tây; Jeomsin/Lịch Việt: chỉ Á) |
| Lịch ngày tốt theo việc, theo tuổi, đa ngôn ngữ | ✅ | Chỉ app VN/TW, không đa ngôn ngữ |
| Tính toán thiên văn on-device (astronomy-engine, ±1′) – không phải text tĩnh 12 cung | ✅ | Nhiều app dùng text tĩnh |
| Giờ sinh theo canh giờ + tra múi giờ lịch sử | ✅ | Hiếm |
| Widget + offline | ✅ | Một phần |
| AI hỏi đáp có trích nguồn từ lá số | v1.1 | Nebula có chat nhưng không trích nguồn |
| Minh bạch billing (nhắc trước trial) | ✅ | Không |

Kế hoạch dự phòng: (1) submit Android + web trước để có số liệu user; (2) nếu iOS bị 4.3(b), appeal kèm bảng trên + video demo; (3) định vị metadata App Store là **"Lunar calendar & self-knowledge"** thay vì "fortune telling"; (4) PWA web làm kênh iOS tạm thời.

## 5. Luồng → màn hình → ticket (bảng tra chéo cho B4)

| Flow | Màn hình | Ticket B4 |
|---|---|---|
| F1 | Lang, Intent, BirthForm, PlaceSearch, ProfilePreview, PushOptIn, Paywall | T-FE-01…07 |
| F3 | Home/DailyCard, ShareSheet, StreakBadge | T-FE-10…12 |
| F2 | ProfileTabs, TuViChart, NatalWheel, NumerologyGrid, BaziTable | T-FE-20…24 |
| F4 | ReadingList, ReadingDetail, TarotSpread, Library | T-FE-30…33 |
| F5 | CalendarMonth, DayDetail, TaskFilter | T-FE-40…42 |
| F6 | PeopleList, CompareResult | T-FE-50…51 |
| F7 | Paywall, ManageSub | T-FE-60…61 |
| F8 | Settings/Notif, Widget | T-FE-70…71 |
