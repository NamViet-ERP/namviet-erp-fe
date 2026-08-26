# Release gates — “quy chuẩn hết” (Phase 7)

Chạy trước khi merge/release. Agent/CI phải **execute** các lệnh, không chỉ liệt kê.

## Gate bắt buộc (local / CI)

| # | Tiêu chí | Lệnh / kiểm tra |
|---|----------|-----------------|
| 1 | Không mock runtime trong FE | `npm run verify:no-mock` |
| 2 | OpenAPI FE ↔ snapshot | `npm run api:check` |
| 3 | TypeScript | `npx tsc --noEmit -p tsconfig.json` |
| 4 | BE không seed lúc start | Review `Program.cs`: không gọi Bootstrap/Seed; health only |
| 5 | Seed opt-in + guard | `scripts/README.md` + `ALLOW_DEMO_BOOTSTRAP` / CLI password |
| 6 | Menu = màn có API (CSKH ẩn) | CSKH tắt (`CSKH_MODULE_ENABLED`); purchasing/stocktake settings ẩn (`docs/UNSHIPPED_MODULES.md`) |
| 7 | Health ops | `GET /health` = 200; `GET /health/ready` = 200 khi DB OK |

Gộp 1–3:

```bash
npm run verify:release-gates
```

## Staging smoke (thủ công)

- [ ] Login auth  
- [ ] 1 flow Kho (vd. tồn / NK)  
- [ ] 1 flow Mua hàng (vd. KHMH / PO)  
- [ ] 1 màn HL hoặc NCC  

E2E smoke pages (khi có env Playwright):

```bash
npx playwright test e2e/wms-pages.spec.ts e2e/purchasing-suppliers-pages.spec.ts e2e/admin-pages.spec.ts
```

## Không thuộc gate này

- Full API CSKH (feature mới)  
- Rename migration lịch sử  
- Redesign UI toàn app  
- Worktree “sạch 100%” mọi WIP — chỉ yêu cầu **không** merge mock/seed/OpenAPI drift  
