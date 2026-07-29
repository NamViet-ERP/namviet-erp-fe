# Checklist deploy — NamViet ERP (Frontend)

Hướng dẫn deploy **production** cho repo `WareHouse_Management` (React/Vite).  
Backend: file `docs/DEPLOY.md` trong repo **`WareHouse_Management_BE`** (cùng bộ ERP).

---

## Nguyên tắc vận hành

| Được | Không được |
|------|------------|
| Gọi API thật qua `VITE_API_BASE_URL` | `VITE_USE_MOCK=true` (mock layer đã gỡ — build sẽ fail nếu set) |
| Build bằng `npm run build:prod` | `npm run build` thiếu `.env.production` / env shell |
| Master data tùy chọn qua script SQL (BE) sau khi business chốt | Seed user / dữ liệu nghiệp vụ trong code hoặc migration tự chạy |
| Tạo admin đầu tiên thủ công qua API | Tài khoản admin cứng trong repo |

---

## 1. Biến môi trường (FE)

Copy mẫu:

```bash
cp .env.production.example .env.production
```

Chỉnh `.env.production` (không commit file này nếu chứa URL nội bộ nhạy cảm):

| Biến | Bắt buộc | Ví dụ | Ghi chú |
|------|----------|-------|---------|
| `VITE_API_BASE_URL` | Có | `https://api.namviet.vn` | URL backend; **bake vào bundle lúc build** |
| `VITE_BASE_PATH` | Không | `/` hoặc `/wms/` | Nếu host dưới sub-path |

**Lưu ý:** Mọi biến `VITE_*` lộ trong file JS client — không đặt secret ở đây.

---

## 2. Build production (local hoặc CI deploy job)

```powershell
cd WareHouse_Management
# Đảm bảo .env.production hoặc shell có VITE_API_BASE_URL
npm ci
npm run build:prod
```

Artifact: thư mục `dist/` — deploy lên static host (Nginx, IIS, CDN, …).

### Guard đã bật (P0 + Phase 1)

- `verify-prod-env` — fail nếu `VITE_USE_MOCK=true` hoặc thiếu API URL  
- `verify-no-mock-src` — fail nếu còn `src/mocks/` hoặc import mock trong `src/`  
- `verify-prod-bundle` — fail nếu `dist/assets/` còn chunk `*.mock*.js`  
- `vite.config.ts` — fail production build nếu mock bật hoặc thiếu URL  
- `assertProductionConfig()` — runtime guard trong `main.tsx`  
- CI (GitHub Actions): chạy trên branch `production`, dùng URL placeholder chỉ để **verify compile** — deploy thật phải build lại với URL API thật

---

## 3. GitHub Actions (verify)

Workflow: `.github/workflows/ci.yml`

- Trigger: **push** và **pull request** vào branch **`production`**
- Env CI: `VITE_API_BASE_URL=https://api.ci-placeholder.local` (không dùng cho user thật)
- Khi đổi sang `main`/`master`: sửa `on.push.branches` / `pull_request.branches` trong file workflow

Deploy job thật (làm sau khi chốt hosting): thêm job hoặc pipeline riêng, set secret `VITE_API_BASE_URL` = URL production.

---

## 4. Trước khi deploy FE

- [ ] Backend đã chạy: `/health` và `/health/ready` trả 200  
- [ ] `VITE_API_BASE_URL` trỏ đúng domain API production  
- [ ] CORS trên BE cho phép origin frontend (xem BE deploy doc)  
- [ ] Đã chạy `npm run build:prod` thành công  
- [ ] Không deploy artifact từ CI placeholder URL (trừ môi trường test tạm)

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
| Build fail “VITE_USE_MOCK=true” | Dùng `npm run build:prod`, không set mock true |
| Login OK nhưng API 401/CORS | `Cors:AllowedOrigins` trên BE, URL FE khớp |
| App gọi sai host | Build lại FE với `VITE_API_BASE_URL` đúng (không sửa tay file trong `dist/`) |

---

## 9. Roadmap tiếp theo

- **Phase 4:** BE hardening, test voucher workflow  
- **CD:** pipeline deploy tự động (sau khi chốt hosting)

**Phase 0–2 (hoàn tất):** guards, mock layer gỡ, UI không data giả.  
**Phase 3 (hoàn tất):** dashboard kho + sinh nhật từ BE; một Projects API (`/api/warehouse/projects`); doc BE-only modules (repo BE).
