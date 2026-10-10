# Findme — Ứng dụng bói toán / huyền học đa ngôn ngữ (Mobile-first + Web)

> Bộ tài liệu "plan có thể code được ngay". Viết cho PM + dev. Mọi con số đều có nguồn (xem mục *Nguồn* cuối mỗi file).
> Ngày lập: 2026-10-10. Ngôn ngữ tài liệu: tiếng Việt (code, schema, prompt: tiếng Anh).

## Cấu trúc

| # | File | Trả lời câu hỏi | Bước |
|---|------|-----------------|------|
| 01 | [01-market-research.md](./01-market-research.md) | Thị trường từng khu vực lớn bao nhiêu, ai dùng, họ trả tiền thế nào, chọn thị trường + mô hình thu phí nào (framework CIRCLES) | B1 |
| 02 | [02-painpoints-flows.md](./02-painpoints-flows.md) | Pain point của từng persona và luồng sản phẩm tương ứng, tính năng free hàng ngày | B2 |
| 03 | [03-data-sources.md](./03-data-sources.md) | **Nguồn dữ liệu/engine/nội dung** cho từng môn (đã verify license + chạy thử) | B3 |
| 04 | [04-backend-design.md](./04-backend-design.md) | Kiến trúc BE, schema DB, API, pipeline AI, i18n nội dung, thanh toán | B3 |
| 05 | [05-frontend-design.md](./05-frontend-design.md) | Kiến trúc FE mobile-first + web, màn hình, component, i18n UI | B3 |
| 06 | [06-dev-plan-and-prompts.md](./06-dev-plan-and-prompts.md) | Plan code theo sprint + **prompt cụ thể cho từng bước** để dán vào Claude Code | B4 |

## Quyết định then chốt (TL;DR)

1. **Thị trường ưu tiên (wave 1):** Việt Nam (vi) + khối tiếng Anh (en: US/CA/UK/AU và toàn cầu). Wave 2: es, pt-BR, ja, ko, zh-TW. Wave 3: hi, th, id, fr, de. Lý do + số liệu: file 01.
2. **Nội dung theo khu vực:** Đông Á/VN = Tử Vi Đẩu Số + Bát Tự (Tứ Trụ / Saju / Shichū Suimei) + Lịch ngày tốt xấu + Kinh Dịch. Phần còn lại = Thần số học + Tarot (+ cung hoàng đạo phương Tây ở wave 2).
3. **Mô hình thu phí (chốt trước khi build):** Freemium. Free loop hằng ngày ("Hôm nay của bạn") giữ chân, soft paywall sau lần đọc sâu đầu tiên. Doanh thu = Subscription (tuần/tháng/năm, giá theo PPP) + gói credit cho báo cáo lẻ. Rewarded ads chỉ bật ở VN/KR/ID. **Không** làm marketplace chuyên gia tính phút ở MVP.
4. **Tính năng free hàng ngày:** "Daily Oracle" cá nhân hoá: VN/CJK = lịch ngày (hoàng đạo/hắc đạo, giờ tốt, việc nên/kiêng theo tuổi, sao chiếu) + 1 lá/quẻ nhỏ; phương Tây = 1 lá Tarot + số ngày cá nhân (numerology) + câu chuyển vận. Có streak + push đúng giờ người dùng chọn.
5. **Khác biệt hoá cốt lõi:** "Compute-then-explain": engine tất định (deterministic) tính lá số/bát tự/lịch chính xác theo chuẩn từng quốc gia (ví dụ lịch âm VN ≠ TQ), LLM chỉ **diễn giải** trên JSON đã tính, không tự "bịa" lá số. Đây là đúng pain point mà tinhmenhdo.com và người dùng Hàn/Trung đang kêu về chatbot AI.
6. **Nguồn dữ liệu đã verify chạy được (MIT/ISC):** `iztro` 2.6.1 (Tử Vi, có sẵn 6 locale gồm vi-VN), `lunar-typescript` 1.8.6 (Bát Tự, Đại Vận, Cửu Tinh, Lịch Vạn Niên), `lunar-date-vn` 1.0.6 (lịch âm VN theo Hồ Ngọc Đức), `astronomy-engine` 2.1.19 (vị trí thiên thể, thay Swiss Ephemeris vì AGPL). Tarot: ảnh Rider-Waite-Smith 1909 + sách Waite 1911 đã hết bản quyền. Kinh Dịch: bản dịch Legge (1882/1899) public domain.

## Cách dùng bộ prompt

Mỗi bước trong file 06 có 1 prompt độc lập, đã ghi rõ: bối cảnh, file đầu vào, yêu cầu, tiêu chí nghiệm thu. Dán nguyên prompt vào Claude Code (hoặc Cursor) trong repo này, chạy tuần tự P0 → P14. Các prompt giả định stack trong file 04/05; nếu đổi stack, sửa phần *Stack* ở đầu prompt.
