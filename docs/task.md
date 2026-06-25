# WMS Restructure — Task Tracker

> Plan: `implementation_plan.md` v2 (Normalized DB Design)  
> Principles: SOLID, Rich Domain Model, single inventory service, DB transaction per movement.

---

## Phase 0 — Database & Domain Models ✅

- [x] `MaterialCategory` entity (adjacency list)
- [x] `InventoryReservation` entity + `ReservationStatus` enum
- [x] `ApprovalStatus.Draft` enum value
- [x] Update `Material`: `CategoryId`, `IsConsumable`; remove `MaterialCategory` string
- [x] Update `ProjectInventory`: `ReservedQty`, domain computed props + methods
- [x] Update `WarehouseTransaction`: `LinkedTicketCode`, navigations
- [x] `inventory_reservations.warehouse_id` + `external_qty` (shortfall)
- [x] EF migration `AddCategoryTreeAndReservations` (with data migration SQL)
- [x] Seed `wh-general` + `general_warehouse_id` setting in migration

## Phase 1 — Domain Service ✅

- [x] `IInventoryDomainService` (Domain layer interface)
- [x] `InventoryDomainService` (Infrastructure implementation)
- [x] `ReservationResult` record
- [x] Unit tests: reserve, fulfill, cancel, direct issue, shortfall
- [x] Register DI in `WarehouseModule`
- [x] Mark `WmsInventoryHelper` `[Obsolete]` (legacy path kept for totals/price)

## Phase 2 — API ✅

- [x] Refactor `ImportsController`: draft reserve, keeper approve, lock approved
- [x] Refactor `ExportsController` + `TransfersController`
- [x] Consolidate `ApproveTransactionHandler` → domain service
- [x] `CategoriesController` (GET tree, CRUD)
- [x] `POST /api/warehouse/projects/{code}/close`
- [x] `GET /api/stock/matrix`
- [x] `WmsMapper`: map `"draft"` ↔ `ApprovalStatus.Draft`
- [x] `[Authorize]` role for warehouse keeper on import approve

## Phase 3 — Frontend ✅

- [x] Sidebar + unified routes (`/warehouse/projects`, `/warehouse/materials`, `/warehouse/stock`)
- [x] Stock matrix wired to `GET /api/stock/matrix` (API mode)
- [x] `MaterialsPage` cascade category filters
- [x] `ProjectsPage` + `ProjectDetailPage` + close warehouse
- [x] Import draft → reserve UX (`ImportListPageApi`, status `draft`)

---

## Architecture Decisions (locked)

| Topic | Decision |
|-------|----------|
| Physical central warehouse | `WmsWarehouse` id `wh-general`, setting key `general_warehouse_id` |
| Project stock matrix | `project_inventory` (planned/actual/reserved cache) |
| Reservation source of truth | `inventory_reservations` (status `Holding`) |
| Available qty | `warehouse_inventory.Qty − SUM(reserved WHERE Holding)` |
| Shortfall on approve | `external_qty` on reservation; warehouse only debits `reserved_qty` |
| Direct Issue | `IsDirectProcurement` + auto XK via `linked_ticket_code`, net project stock = 0 |

---

## Verification

```powershell
cd WareHouse_Management_BE
dotnet build
dotnet test
dotnet ef database update --project src/Modules/Warehouse/NamViet.ERP.Modules.Warehouse.Infrastructure --startup-project src/ApiHost/NamViet.ERP.Api --context WarehouseDbContext

cd ../WareHouse_Management
npm run build
```

Manual: draft import → reservation Holding → keeper approve → Fulfilled + inventory updated.

---

## Phase 4 — Kho dự án làm trung tâm (2026-06-19)

> Plan chi tiết: `docs/wms-project-warehouse-plan.md`

### Phase A — Menu + công thức ✅
- [x] Sidebar IA: Kho dự án, Tồn kho, bỏ Danh sách kho
- [x] Redirect `/warehouse/list` → `/warehouse/projects`
- [x] Khả dụng = (Kho tổng − Giữ kho) + Tồn DA thực tế
- [x] Đổi title trang

### Phase B — Kho dự án UI ✅
- [x] Nút "Tạo kho dự án" + modal (POST `/api/warehouse/projects`)
- [x] Chi tiết: tab Tồn kho / Lịch sử phiếu / Thông tin
- [x] Shortcut Nhập/Xuất từ chi tiết kho

### Phase C — Nhập kho ✅
- [x] Chọn kho dự án trước (prefill từ chi tiết kho)
- [x] NCC + vật tư + đơn giá (WAC trên tồn kho)
- [x] Lưu nháp + PM chốt + thủ kho duyệt (`POST /submit`)
- [x] BE: ghi dự kiến / cộng tồn dự án (không trừ kho tổng)

### Phase D — Xuất kho ✅
- [x] BE: export gắn ProjectCode, planned/actual project_inventory
- [x] FE: chọn kho dự án, validate ≤ tồn khả dụng
- [x] 2 bước chốt + thủ kho duyệt

### Phase E — Chuyển kho hoàn trả ✅
- [x] Phase 1: VT+SL → kho tổng (BE `ApplyReturnToGeneralAsync`, FE `TransferListPageApi`)
- [x] Giữ nút Đóng kho ở chi tiết kho dự án

### Phase F — Lịch sử ✅
- [x] `GET /api/warehouse/projects/{code}/ledger`
- [x] Tab lịch sử dùng ledger API

### Phase G/H — Milestone / DA→DA ✅
- [x] ConstructionPhase optional trên dòng phiếu chuyển (báo cáo)
- [x] Chuyển kho dự án → kho dự án khác (`ApplyCrossProjectTransferAsync`)
