# Checklist deploy — NamViet ERP (Frontend)

Hướng dẫn deploy **production** cho repo `WareHouse_Management` (React/Vite).  
Backend: file `docs/DEPLOY.md` trong repo **`WareHouse_Management_BE`** (cùng bộ ERP).

---

## Nguyên tắc vận hành

| Được | Không được |
|------|------------|
| Gọi API thật (same-origin proxy hoặc absolute URL) | `VITE_USE_MOCK=true` (cờ legacy; `verify-prod-env` fail nếu còn set) |
| Build bằng `npm run build:prod` | `npm run build` thiếu `.env.production` / env shell |
| Master data tùy chọn qua script SQL (BE) sau khi business chốt | Seed user / dữ liệu nghiệp vụ trong code hoặc migration tự chạy |
| Tạo admin đầu tiên thủ công (BE `BootstrapFirstAdmin`) | Tài khoản admin cứng trong repo |

---

## 1. Biến môi trường (FE)

Copy mẫu:

```bash
cp .env.production.example .env.production
```

Chỉnh `.env.production` (không commit file này nếu chứa URL nội bộ nhạy cảm):

| Biến | Bắt buộc | Ví dụ | Ghi chú |
|------|----------|-------|---------|
| `VITE_API_BASE_URL` | Có (có thể **rỗng**) | `` (khuyến nghị) hoặc `https://api.namviet.vn` | **Khuyến nghị:** để trống + reverse proxy `/api` (và `/hubs`) cùng origin với SPA (cookie auth). Absolute URL chỉ khi cố ý gọi API theo host khác same-site. **Bake vào bundle lúc build.** |
| `VITE_BASE_PATH` | Không | `/` hoặc `/wms/` | Nếu host dưới sub-path |

**Lưu ý:** Mọi biến `VITE_*` lộ trong file JS client — không đặt secret ở đây. Không set `VITE_E2E=true` trên production.

---

## 2. Build production (local hoặc CI deploy job)

```powershell
cd WareHouse_Management
# .env.production: VITE_API_BASE_URL=  (same-origin) hoặc absolute URL
npm ci
npm run build:prod
```

Artifact: thư mục `dist/` — deploy lên static host (Nginx, IIS, CDN, …).

### Guard đã bật (P0 + Phase 1)

- `verify-prod-env` — fail nếu `VITE_USE_MOCK=true` (cờ legacy) hoặc `VITE_API_BASE_URL` không phải rỗng / http(s) / path  
- `verify-no-mock-src` — fail nếu còn mock/seed store trong `src/`  
- `verify-prod-bundle` — fail nếu `dist/assets/` còn chunk `*.mock*.js`  
- CI: build same-origin (`VITE_API_BASE_URL` rỗng) + upload artifact `fe-dist`

### Mẫu reverse proxy (same-origin)

```nginx
# SPA + API cùng host — FE build với VITE_API_BASE_URL=
location /api/ {
  proxy_pass http://127.0.0.1:8080/api/;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
location /hubs/ {
  proxy_pass http://127.0.0.1:8080/hubs/;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 3. GitHub Actions (CI + CD)

| Workflow | Khi chạy | Việc |
|----------|----------|------|
| `.github/workflows/ci.yml` | push/PR → `production`, `feature/purchasing` | api:check, typecheck, lint, test, `build:prod`, artifact `fe-dist` |
| `.github/workflows/cd-publish.yml` | **workflow_dispatch** + GitHub Environment | Build deployable `dist/` (input `api_base_url`, mặc định rỗng = same-origin) |

Secrets / Environment (GitHub): không cần secret FE nếu same-origin. Nếu absolute API URL: truyền input `api_base_url` lúc dispatch.

Copy artifact lên host vẫn **thủ công** (hoặc mở rộng CD sau khi chốt hosting/SSH).

---

## 4. Trước khi deploy FE

- [ ] Backend đã chạy: `/health` và `/health/ready` trả 200  
- [ ] Same-origin: proxy `/api` (+ `/hubs`) đúng; hoặc `VITE_API_BASE_URL` absolute đúng  
- [ ] CORS trên BE cho phép origin frontend (xem BE deploy doc + `.env.production.example`)  
- [ ] Đã chạy `npm run build:prod` thành công  
- [ ] Deploy đúng artifact (CI `fe-dist` same-origin hoặc CD publish với URL đã chốt)

---

## 5. Sau khi deploy FE

- [ ] Mở app → trang login load  
- [ ] Đăng nhập tài khoản thật (không quick-login mock)  
- [ ] DevTools → Network: request tới `VITE_API_BASE_URL`, có `Authorization` sau login  
- [ ] Thử một flow Kho + một flow Mua hàng (sau login)  

### Session / quyền trên FE

`localStorage` (`nv-session-user`, permissions mirror) chỉ phục vụ **UI** (ẩn/hiện menu). **Server vẫn authoritative** — mọi API kiểm tra JWT + permission; không tin client để authorize.

---

## 6. Tạo admin đầu tiên (không seed)

Thực hiện **sau** BE migrate và chạy API (chi tiết BE doc):

1. Gọi register / tạo user qua API (Swagger chỉ bật ở Development — production dùng endpoint admin hoặc tool nội bộ).  
2. Gán role **admin** cho user đó (Admin UI hoặc thao tác DB/Identity — theo quy trình nội bộ).  
3. Đăng nhập FE bằng tài khoản vừa tạo → vào `/admin/users`.

---

## 7. Master data tùy chọn (BE)

Cây vật tư **không** seed tự động. Sau khi business chốt taxonomy:

```bash
psql -h <host> -U <user> -d <database> -f scripts/seed-material-category-tree.sql
```

(Script nằm repo BE — chạy thủ công, không bắt buộc deploy lần đầu.)

---

## 8. Khắc phục sự cố nhanh

| Triệu chứng | Kiểm tra |
|-------------|----------|
| Build fail “VITE_API_BASE_URL” | Set trong `.env.production` hoặc `$env:VITE_API_BASE_URL` trước `build:prod` |
| Build fail “VITE_USE_MOCK=true” | Gỡ `VITE_USE_MOCK` khỏi `.env.production` / env shell |
| Login OK nhưng API 401/CORS | `Cors:AllowedOrigins` trên BE, URL FE khớp |
| App gọi sai host | Build lại FE với `VITE_API_BASE_URL` đúng (không sửa tay file trong `dist/`) |

---

## 9. Roadmap tiếp theo

- **Phase 4:** BE hardening, test voucher workflow  
- **CD:** pipeline deploy tự động (sau khi chốt hosting)

**Phase 0–2 (hoàn tất):** guards, mock layer gỡ, UI không data giả.  
**Phase 3 (hoàn tất):** dashboard kho + sinh nhật từ BE; một Projects API (`/api/warehouse/projects`); doc BE-only modules (repo BE).
