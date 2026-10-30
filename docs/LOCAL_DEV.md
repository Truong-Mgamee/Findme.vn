# Chạy local (máy của bạn)

Yêu cầu: Node ≥ 20, pnpm 10 (`corepack enable`), không cần Postgres/Redis (dùng PGlite + store in-memory).

```bash
git clone https://github.com/Truong-Mgamee/Findme.vn.git
cd Findme.vn
git checkout claude/fortune-telling-app-plan-4b3528
pnpm install

# 1) API (http://localhost:3001/docs là Swagger)
cd apps/api
cp .env.example .env
# tối thiểu: DATABASE_URL=pglite:./.pgdata  ADMIN_TOKEN=local-admin-token-123
#            JWT_SECRET=<chuỗi ≥16 ký tự>  BIRTH_ENC_KEY=<base64 32 byte: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
# tuỳ chọn: ANTHROPIC_API_KEY=... (bật AI thật; không có thì dùng template từ atoms)
pnpm content:seed -- --publish-reviewed     # nạp 160 atoms + glossary vào DB
pnpm job:daily -- $(date +%F) vi,en          # sinh Daily Oracle hôm nay
pnpm dev                                      # API tại :3001

# 2) Web (terminal khác) — http://localhost:3000/vi/lich-am-hom-nay
cd apps/web && NEXT_PUBLIC_API_URL=http://localhost:3001 ADMIN_TOKEN=local-admin-token-123 pnpm dev

# 3) Mobile (terminal khác) — quét QR bằng Expo Go
cd apps/mobile && EXPO_PUBLIC_API_URL=http://<IP-LAN-của-máy>:3001 pnpm start
```

## Thử nhanh bằng curl

```bash
A=http://localhost:3001/v1
TOK=$(curl -s -X POST $A/auth/guest -H 'accept-language: vi' -H 'x-tz: Asia/Ho_Chi_Minh' -H 'content-type: application/json' -d '{"country":"vn"}' | jq -r .token)
PID=$(curl -s -X POST $A/profiles -H "authorization: Bearer $TOK" -H 'content-type: application/json' \
  -d '{"birth":{"date":"1997-12-24","time":"12:00","timeUnknown":false,"gender":"female","place":{"name":"Hà Nội","lat":21.0285,"lng":105.8542,"tz":"Asia/Ho_Chi_Minh","country":"VN"},"calendarStandard":"vn"},"isSelf":true,"label":"Tôi"}' | jq -r .id)
curl -s $A/today -H "authorization: Bearer $TOK" | jq .            # Daily Oracle
curl -s $A/profiles/$PID/ziwei -H "authorization: Bearer $TOK" | jq '.chart.palaces[].name'
RID=$(curl -s -X POST $A/readings -H "authorization: Bearer $TOK" -H 'content-type: application/json' -d "{\"kind\":\"ziwei_full\",\"profileId\":\"$PID\"}" | jq -r .id)
curl -N $A/readings/$RID/stream -H "authorization: Bearer $TOK"     # SSE: summary/section/.../done
```

## Admin (web `/admin` hoặc curl)

`X-Admin-Token: <ADMIN_TOKEN>` → `GET /v1/admin/atoms`, `GET /v1/admin/coverage`, `POST /v1/admin/jobs/daily-oracle`.

## Chạy ngay trên máy bạn từ phiên Claude này

Bật **Remote Control** trong Claude Desktop (Settings → Claude Code → Remote Control) cho thư mục repo đã clone, rồi nhắn lại; phiên này sẽ kết nối và chạy `pnpm dev` trực tiếp trên máy bạn.
