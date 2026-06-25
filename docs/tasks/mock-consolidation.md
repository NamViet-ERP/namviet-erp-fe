# Mock & Hook Consolidation — Task Tracker

> **Approved:** 2026-06-25  
> **Completed:** 2026-06-25  
> **Scope:** Frontend `WareHouse_Management`

---

## Phase 0 — Chuẩn bị

| ID | Task | Status |
|----|------|--------|
| T0 | Dọn duplicate / trạng thái dở | [x] |
| T1 | Baseline build + grep snapshot | [x] |

## Phase 1 — Khung `src/mocks/`

| ID | Task | Status |
|----|------|--------|
| T2 | Core mocks | [x] |
| T3 | Re-export shim (đã xóa T29 — import trực tiếp `mocks`) | [x] |

## Phase 2 — Di chuyển data & services

| ID | Task | Status |
|----|------|--------|
| T4–T9 | Move + fix imports + xóa `src/data`, `src/services/mocks` | [x] |

## Phase 3 — Tách type khỏi mock data

| ID | Task | Status |
|----|------|--------|
| T10 | `Member` → `src/types/members.ts` | [x] |
| T11 | Seed `candidates`, `suppliers` → `mocks/data/` | [x] |

## Phase 4 — Gateway pattern

| ID | Task | Status |
|----|------|--------|
| T12 | Pilot `importsService` + `resolveMock` | [x] |
| T13 | WMS services (imports, exports, transfers, warehouses, products, stocktakes, adjustments, categories, stock, members) | [x] |
| T14 | HR/Admin — employees, candidates, roles, positions, hrStaff, adminUsers → `resolveMock` | [x] |
| T15 | projects, materials, suppliers, materialUnits → `resolveMock` | [x] |

## Phase 5 — Mock inline pages

| ID | Task | Status |
|----|------|--------|
| T16 | `mocks/pages/dashboardTopSales.ts` | [x] |
| T17 | `mocks/pages/expectedImports.ts` | [x] |
| T18 | `mocks/pages/reconciliation.ts` | [x] |

## Phase 6 — Hooks & components

| ID | Task | Status |
|----|------|--------|
| T19 | `hooks/dashboard/calendarConstants.ts` | [x] |
| T20 | `hooks/dashboard/useBirthdayCalendar.ts` | [x] |
| T21 | `hooks/dashboard/useTopSalesRows.ts` | [x] |
| T22 | `components/dashboard/TopSalesTable.tsx` | [x] |
| T23 | `DashboardPage.tsx` slim (238 dòng) | [x] |
| T24 | `hooks/warehouse/useExpectedImportsCoordination.ts` | [x] |
| T25 | `ExpectedImportsPage.tsx` slim | [x] |

## Phase 7 — Dọn dẹp & optimize

| ID | Task | Status |
|----|------|--------|
| T26 | Import `lib/mock` → `mocks` | [x] |
| T27 | Vite `define __USE_MOCK__` | [x] |
| T28 | Build verify | [x] |
| T29 | Xóa `lib/mock.ts` shim | [x] |
| T30 | Doc cập nhật | [x] |

---

## Cấu trúc sau refactor

```
src/mocks/
├── index.ts, config.ts, gateway.ts, clone.ts, delay.ts, mockId.ts, localStore.ts
├── data/           # seed tĩnh
├── services/       # mock implementations
└── pages/          # mock chỉ dùng cho page chưa có API

src/hooks/dashboard/
src/hooks/warehouse/
src/components/dashboard/
src/types/members.ts
```

---

## Acceptance checklist

- [x] Không còn `src/data/`, `src/services/mocks/`
- [x] Mock/seed dưới `src/mocks/`
- [x] 20 services dùng `resolveMock` (WMS + HR/Admin + members + categories)
- [x] Page không chứa mock array lớn
- [x] `DashboardPage` < 250 dòng (238)
- [x] `npm run build` pass
- [x] Smoke test mock services: `npm run test:smoke` (7 tests, `.env.test` forces `VITE_USE_MOCK=true`)

---

## Ghi chú / việc còn lại (optional)

- **`authService`:** giữ `if (USE_MOCK)` cho session helpers (không gọi mock module).
- **`employeesService`:** `isAccountActiveForEmployee` / `getAccountLockReason` giữ `USE_MOCK` sync (đọc `readStore` / localStorage).
- **Tree-shake prod:** Build với `VITE_USE_MOCK=false` để verify mock chunks bị loại (cần set env lúc build).
