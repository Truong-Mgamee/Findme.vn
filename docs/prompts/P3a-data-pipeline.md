# P3a – Prompt xây content pack đa ngôn ngữ (T-DATA-01…07)

## Prompt 1 – schema + pipeline
```
Đọc docs/plan/03-B3-data-sources.md §1.5 và §3.5. Trong packages/content:
1. Tạo JSON schema (draft 2020-12) cho: tuvi_star_in_palace, bazi_element, astro_planet_sign, astro_planet_house, numerology_number, tarot_card, daily_template. Mỗi record bắt buộc: id, locale, layer (1|2|3), text, tags[], source_note, status (draft|approved), version.
2. Script `content:build --locale <l>`: validate, gộp, gzip, tính checksum, ghi dist/content-pack.<l>.<version>.json.gz; script `content:publish` upload Supabase Storage và insert bảng content_packs.
3. Test: record thiếu field → fail; locale thiếu id so với en → cảnh báo.
```

## Prompt 2 – generate nội dung theo batch (chạy lặp theo loại)
```
Bạn là biên tập viên nội dung bói toán, viết cho app di động. Sinh nội dung cho loại {TYPE} locale {LOCALE} theo schema packages/content/schema/{TYPE}.json.

Quy tắc:
- Lớp 1: 1 câu ≤ 25 từ, giọng ấm, thì hiện tại, không hứa hẹn tuyệt đối. Lớp 2: 3 bullet ≤ 15 từ. Lớp 3: 80–120 từ có thuật ngữ + giải thích ngắn.
- Không copy từ website hiện đại. Tham chiếu tri thức công cộng (Tử Vi Đẩu Số Toàn Thư, Tam Mệnh Thông Hội, truyền thống RWS). Ghi source_note mô tả căn cứ.
- Thuật ngữ theo packages/i18n/glossary.json (giữ Hán-Việt cho tên sao, kèm chú thích lần đầu).
- Không nội dung y tế/pháp lý/tài chính cụ thể; dùng "có thể", "nên cân nhắc".
- Xuất JSON array hợp lệ, status "draft". Batch {N} record, id theo quy ước {TYPE}.{key}.{layer}.

Sau mỗi batch chạy `pnpm content:validate` và sửa lỗi trước khi tiếp.
```

## Prompt 3 – dịch Wave 2
```
Dịch content pack en → {LOCALE} từng record, giữ id/layer/tags, áp dụng glossary (không dịch term có keep_original=true), giữ độ dài ±20 %. Với JA: giọng です/ます; KO: 해요체; PT-BR: você. Xuất status "draft" để reviewer bản địa duyệt.
```

## Prompt 4 – oracle test cho engine (T-ENG-04)
```
Cài lasotuvi (Python, MIT) vào môi trường riêng; sinh 50 lá số ngẫu nhiên (năm 1950–2010, 12 canh giờ, 2 giới, âm/dương) → JSON snapshot packages/engine/test/oracle/tuvi/*.json. Viết test Vitest so sánh output port TS với snapshot (danh sách sao mỗi cung, cục, mệnh/thân, đại hạn). Báo cáo % khớp thật; không chỉnh snapshot để pass.
```
