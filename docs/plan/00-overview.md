# Fortune App – Kế hoạch tổng thể (bản có thể code ngay)

> Ngày lập: 2026-10-10 · Người lập: Claude (theo yêu cầu của Trường) · Trạng thái: **Draft v1 – chờ chốt 3 quyết định ở mục 5**

## 1. Tóm tắt 1 phút

| Hạng mục | Quyết định | Căn cứ (nguồn ở từng file B1–B4) |
|---|---|---|
| Sản phẩm | **"Daily Fate"** – app bói toán đa hệ, đa ngôn ngữ, mobile-first (iOS/Android) + web PWA cùng codebase | Constraint của Trường + Apple 4.3(b) buộc phải khác biệt |
| Hệ bói (engine) | 4 engine: **Tử Vi/Bát Tự (Á Đông)**, **Chiêm tinh Tây phương**, **Thần số học**, **Tarot** | Mỗi engine map vào 1 cụm thị trường có số liệu (B1) |
| Hook free hằng ngày | **"Hôm nay của bạn"**: 1 thẻ tổng hợp/ngày (ngày tốt-xấu + câu hướng dẫn + 1 lá tarot) + streak + widget | Pew: 20 % dùng "cho vui", 14 % dùng hằng tháng, 6 % hằng tuần → cần ritual nhẹ, 30 giây |
| Mô hình thu phí | **Freemium + subscription (weekly / annual) + consumable "Deep Reading"**, giá theo PPP từng nước | RevenueCat 2025: weekly = 55,5 % doanh thu, trial→paid median 10,7 % (hard paywall) |
| Thị trường launch | Wave 1: **VN + US/EN** (2 ngôn ngữ, 4 engine) → Wave 2: JA, KO, PT-BR, ES → Wave 3: ZH-TW, TH, ID, HI | Tổng hợp số liệu B1 §3 |
| Nguồn dữ liệu | 100 % **MIT / Public Domain / tự biên soạn**, không dùng Swiss Ephemeris (AGPL) | B3 §1 – bảng license đã verify |
| Stack | Expo (React Native + RN Web) · TypeScript monorepo · Supabase (Postgres/Auth) · RevenueCat · i18n bằng ICU MessageFormat | B3 §2–3 |
| Rủi ro #1 | **Apple 4.3(b)** liệt kê "fortune telling" là category bão hoà, từ chối app không "meaningfully different" | Trích nguyên văn ở B1 §6; chiến lược né ở B2 §4 |

## 2. Việc đã làm / chưa làm được trong phiên này

| Việc | Kết quả |
|---|---|
| Tạo repo GitHub mới | **Thất bại (403)** – GitHub App của Claude không có quyền tạo repo. Tạm dùng repo `Findme.vn` (đang trống) làm nơi chứa. Xem mục 6 để chuyển sang repo riêng. |
| Đọc wiki Lark (danh sách app) | **Không truy cập được** – proxy mạng của session chặn domain `larksuite.com`. Tôi chọn app theo mô tả ở tin nhắn đầu của Trường (app bói toán đa ngôn ngữ). Nếu wiki có app khác phù hợp hơn, dán nội dung vào chat. |
| B1 Research thị trường | Xong – `01-B1-market-research.md` |
| B2 Painpoint & luồng | Xong – `02-B2-painpoints-flows.md` |
| B3 Nguồn dữ liệu, BE, FE | Xong – `03-B3-data-sources.md`, `04-B3-backend-design.md`, `05-B3-frontend-design.md` |
| B4 Plan code chi tiết | Xong – `06-B4-code-plan.md` (sprint, file tree, ticket) |
| Prompt cho từng bước | Xong – `docs/prompts/*.md` |

## 3. Cách đọc bộ tài liệu

```
docs/plan/
  00-overview.md              ← file này
  01-B1-market-research.md    ← CIRCLES, số liệu từng nước, mô hình thu phí
  02-B2-painpoints-flows.md   ← persona, painpoint, user flow, chiến lược né 4.3(b)
  03-B3-data-sources.md       ← bảng nguồn dữ liệu + license (QUAN TRỌNG NHẤT)
  04-B3-backend-design.md     ← kiến trúc, schema, API
  05-B3-frontend-design.md    ← IA, màn hình, i18n, design system
  06-B4-code-plan.md          ← sprint plan, file tree, ticket code được ngay
docs/prompts/
  P0-setup-repo.md            ← prompt scaffold monorepo
  P1-market-research.md       ← prompt chạy lại/đào sâu research
  P2-painpoint-flows.md
  P3a-data-pipeline.md        ← prompt build content pack đa ngôn ngữ
  P3b-backend.md
  P3c-frontend.md
  P4-sprint-execution.md      ← prompt chạy từng ticket
  P5-store-release.md         ← prompt chuẩn bị submit App Store / Play
```

## 4. Nguyên tắc "data-driven" áp dụng trong plan

1. Mỗi quyết định sản phẩm có ít nhất 1 nguồn (link) hoặc được đánh dấu **[giả định]** kèm cách kiểm chứng.
2. Số liệu từ market-research vendor (MarkNtel, Research&Markets…) **không dùng** làm căn cứ vì lệch nhau 3–6 lần (1,16 → 7,11 tỷ USD cho cùng năm 2025). Chỉ dùng: số liệu công ty công bố (Astrotalk FY25), khảo sát mẫu lớn (Pew n=9 593), cơ quan nghiên cứu quốc gia (Yano), benchmark hành vi thanh toán (RevenueCat, 115 000 app).
3. Mọi giả định về giá, conversion, retention đều có **KPI gate** trong B4 để đo lại sau 2 tuần launch.

## 5. Ba quyết định cần Trường chốt trước khi code

| # | Câu hỏi | Khuyến nghị | Vì sao |
|---|---|---|---|
| Q1 | Tên app / brand | "Daily Fate" (placeholder) | Cần tên không chứa từ "horoscope/tarot/fortune" để giảm rủi ro 4.3(b) và dễ đa ngôn ngữ |
| Q2 | Wave 1 là **VN + EN** hay **VN + JA/KO**? | VN + EN | EN mở được US (Pew 30 %), PH, IN-English; JA/KO cần content chất lượng bản địa, để Wave 2 |
| Q3 | Có bán "human reading" (marketplace thầy bói) ở v1 không? | **Không** ở v1 | Astrotalk/Sanctuary chứng minh marketplace lợi nhuận cao, nhưng cần supply + KYC + payout; v2 |

## 6. Chuyển code sang repo riêng (khi Trường muốn)

1. Tự tạo repo trên GitHub (ví dụ `Truong-Mgamee/daily-fate`), private.
2. Cài Claude GitHub App cho repo đó tại https://github.com/apps/claude/installations/select_target (hoặc kết nối lại ở https://claude.ai/connect-github).
3. Mở session mới chọn repo đó, hoặc trong session này nói "add repo daily-fate" để tôi attach và copy toàn bộ `docs/` + scaffold sang.
