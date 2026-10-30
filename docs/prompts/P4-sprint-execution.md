# P4 – Prompt chạy 1 ticket (dùng cho mọi sprint)

```
Ticket: {ID} – {TÊN} (docs/plan/06-B4-code-plan.md).
Trước khi code: đọc phần plan liên quan ({file §}), liệt kê file sẽ tạo/sửa, nêu giả định.
Khi code: nhỏ, có test, không mở rộng phạm vi; nếu phát hiện plan sai, ghi vào docs/plan/CHANGELOG.md thay vì tự đổi thiết kế.
Trước khi báo xong: chạy `pnpm lint && pnpm typecheck && pnpm test` (và Maestro nếu ticket FE có flow), dán output thật; nêu rõ phần chưa làm được và lý do.
Commit trên branch `feat/{ID}`; mở PR draft với checklist DoD B4 §4 và screenshot nếu là UI.
```

## Prompt review PR
```
Review PR theo docs/plan/06 §4 DoD và docs/plan/03 §4 checklist pháp lý: license mới có hợp lệ không, chuỗi UI chưa i18n, event analytics thiếu, entitlement gate sai, PII lưu thừa. Trả về findings theo mức nghiêm trọng, kèm file:line.
```
